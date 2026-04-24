namespace PharmaStock.Dtos.Requests.Profile
{
    public class UpdateProfileRequest
    {
        public string? DisplayName { get; set; } = string.Empty;
        public string? Bio { get; set; } = string.Empty;
    }
}