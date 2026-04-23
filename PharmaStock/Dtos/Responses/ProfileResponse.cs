namespace PharmaStock.Dtos.Responses
{
    public class ProfileResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
        public string DisplayName { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public bool HasProfileImage { get; set; }
    }
}