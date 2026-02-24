using System.ComponentModel.DataAnnotations;

namespace PharmaStock.Data.Entities
{
    /// <summary>
    /// Request model for assigning or removing a role from a user.
    /// </summary>
    public class AssignRoleRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = string.Empty;
    }
}
