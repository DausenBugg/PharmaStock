using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
using PharmaStock.Data.Entities;
using PharmaStock.Dtos.Requests;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Services;

public class NotificationSettingService : INotificationSettingService
{
    private readonly PharmaStockDbContext _context;

    public NotificationSettingService(PharmaStockDbContext context)
    {
        _context = context;
    }

    public async Task<NotificationSettingResponse> GetAsync()
    {
        var setting = await _context.NotificationSettings.FirstOrDefaultAsync();

        if (setting == null)
        {
            setting = new NotificationSetting();
            _context.NotificationSettings.Add(setting);
            await _context.SaveChangesAsync();
        }

        return MapToResponse(setting);
    }

    public async Task<NotificationSettingResponse> UpdateAsync(UpdateNotificationSettingRequest request)
    {
        var setting = await _context.NotificationSettings.FirstOrDefaultAsync();

        if (setting == null)
        {
            setting = new NotificationSetting();
            _context.NotificationSettings.Add(setting);
        }

        setting.ExpirationWarningDays = request.ExpirationWarningDays;
        setting.LowStockThresholdPercent = request.LowStockThresholdPercent;
        setting.RiskScoreCriticalThreshold = request.RiskScoreCriticalThreshold;
        setting.RiskScoreWarningThreshold = request.RiskScoreWarningThreshold;
        setting.MinRiskScoreFilter = request.MinRiskScoreFilter;

        await _context.SaveChangesAsync();

        return MapToResponse(setting);
    }

    private static NotificationSettingResponse MapToResponse(NotificationSetting setting) => new()
    {
        ExpirationWarningDays = setting.ExpirationWarningDays,
        LowStockThresholdPercent = setting.LowStockThresholdPercent,
        RiskScoreCriticalThreshold = setting.RiskScoreCriticalThreshold,
        RiskScoreWarningThreshold = setting.RiskScoreWarningThreshold,
        MinRiskScoreFilter = setting.MinRiskScoreFilter,
        UpdatedAtUtc = setting.UpdatedAtUtc
    };
}
