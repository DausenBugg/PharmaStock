using Microsoft.AspNetCore.Identity;

namespace PharmaStock.Data.Entities
{
    public class UserProfile
    {
        public int UserProfileId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public byte[]? ProfileImage { get; set; }
        public string? ProfileImageContentType { get; set; }
        public string? Bio { get; set; }


        // Navigation property to IdentityUser
        public IdentityUser? User { get; set; }
    }
}