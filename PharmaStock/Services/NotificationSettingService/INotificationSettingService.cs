using PharmaStock.Dtos.Requests;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Services;

public interface INotificationSettingService
{
    Task<NotificationSettingResponse> GetAsync();
    Task<NotificationSettingResponse> UpdateAsync(UpdateNotificationSettingRequest request);
}
