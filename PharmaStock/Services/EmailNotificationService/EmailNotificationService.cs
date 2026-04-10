using System.Text;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using PharmaStock.Data;

namespace PharmaStock.Services;

public class EmailNotificationService : IEmailNotificationService
{
    private readonly IAIPredictionService _aiService;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly PharmaStockDbContext _context;
    private readonly IConfiguration _config;

    public EmailNotificationService(
        IAIPredictionService aiService,
        UserManager<IdentityUser> userManager,
        PharmaStockDbContext context,
        IConfiguration config)
    {
        _aiService = aiService;
        _userManager = userManager;
        _context = context;
        _config = config;
    }

    public async Task<(bool Success, string Message)> SendUrgentInventoryAlertsAsync()
    {
        var reorderAlerts = await _aiService.GetReorderAlertsAsync();
        var expirationRisks = await _aiService.GetExpirationRisksAsync();

        if (reorderAlerts.Count == 0 && expirationRisks.Count == 0)
            return (true, "No urgent inventory issues found.");

        // Resolve medication names from IDs
        var medIds = reorderAlerts.Select(a => a.MedicationId).ToHashSet();
        var stockIds = expirationRisks.Select(r => r.InventoryStockId).ToHashSet();

        var medications = await _context.Medications
            .Where(m => medIds.Contains(m.MedicationId))
            .AsNoTracking()
            .ToDictionaryAsync(m => m.MedicationId, m => m.Name);

        var stockMedNames = await _context.InventoryStocks
            .Include(s => s.Medication)
            .Where(s => stockIds.Contains(s.InventoryStockId))
            .AsNoTracking()
            .ToDictionaryAsync(s => s.InventoryStockId, s => s.Medication.Name);

        // Build email body
        var body = new StringBuilder();
        body.Append("<h2>PharmaStock — Urgent Inventory Alerts</h2>");
        body.Append($"<p>Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p>");

        if (reorderAlerts.Count > 0)
        {
            body.Append("<h3>Low Stock — Reorder Alerts</h3>");
            body.Append("<table border='1' cellpadding='6' cellspacing='0'>");
            body.Append("<tr><th>Medication</th><th>Issue</th><th>Recommended Reorder Level</th><th>Confidence</th></tr>");
            foreach (var alert in reorderAlerts)
            {
                var name = medications.GetValueOrDefault(alert.MedicationId, $"Medication #{alert.MedicationId}");
                body.Append($"<tr><td>{name}</td><td>Low Stock</td><td>{alert.RecommendedReorderLevel}</td><td>{alert.Confidence:P0}</td></tr>");
            }
            body.Append("</table>");
        }

        if (expirationRisks.Count > 0)
        {
            body.Append("<h3>Expiration Risk Alerts</h3>");
            body.Append("<table border='1' cellpadding='6' cellspacing='0'>");
            body.Append("<tr><th>Medication</th><th>Issue</th><th>Risk Level</th><th>Days to Expiry</th></tr>");
            foreach (var risk in expirationRisks)
            {
                var name = stockMedNames.GetValueOrDefault(risk.InventoryStockId, $"Stock #{risk.InventoryStockId}");
                body.Append($"<tr><td>{name}</td><td>Expiration Risk</td><td>{risk.RiskLabel}</td><td>{risk.DaysToExpiry}</td></tr>");
            }
            body.Append("</table>");
        }

        // Get admin recipients
        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        var recipients = admins.Where(a => !string.IsNullOrEmpty(a.Email)).ToList();

        if (recipients.Count == 0)
            return (false, "No admin users with email addresses found.");

        // Build and send the email
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _config["Smtp:FromName"] ?? "PharmaStock Alerts",
            _config["Smtp:FromAddress"] ?? "alerts@pharmastock.local"));

        foreach (var admin in recipients)
            message.To.Add(MailboxAddress.Parse(admin.Email!));

        message.Subject = $"PharmaStock Alert: {reorderAlerts.Count} reorder + {expirationRisks.Count} expiration issues";
        message.Body = new TextPart("html") { Text = body.ToString() };

        using var client = new SmtpClient();
        var host = _config["Smtp:Host"] ?? "localhost";
        var port = int.Parse(_config["Smtp:Port"] ?? "587");
        var enableSsl = bool.Parse(_config["Smtp:EnableSsl"] ?? "true");
        var socketOptions = port == 587
            ? SecureSocketOptions.StartTls
            : enableSsl
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.None;

        await client.ConnectAsync(host, port, socketOptions);

        var username = _config["Smtp:Username"];
        if (!string.IsNullOrEmpty(username))
            await client.AuthenticateAsync(username, _config["Smtp:Password"]);

        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        return (true, $"Alert email sent to {recipients.Count} admin(s) — {reorderAlerts.Count} reorder, {expirationRisks.Count} expiration issues.");
    }
}
