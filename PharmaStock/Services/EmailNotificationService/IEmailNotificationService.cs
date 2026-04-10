namespace PharmaStock.Services;

public interface IEmailNotificationService
{
    Task<(bool Success, string Message)> SendUrgentInventoryAlertsAsync();
}
