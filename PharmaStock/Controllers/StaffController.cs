using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace PharmaStock.Controllers
{
    /// <summary>
    /// Controller for Staff users. Accessible by both Staff and Admin roles.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff")]
    public class StaffController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;

        public StaffController(UserManager<IdentityUser> userManager)
        {
            _userManager = userManager;
        }

        /// <summary>
        /// Gets the current user's profile. Accessible by Admin and Staff.
        /// </summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                         ?? User.FindFirstValue("sub");
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not found in token." });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                userName = user.UserName,
                roles
            });
        }

        /// <summary>
        /// Sample endpoint for both Admin and Staff to access inventory.
        /// </summary>
        [HttpGet("inventory")]
        public IActionResult GetInventory()
        {
            // Placeholder - would normally fetch from database
            return Ok(new
            {
                message = "Inventory data accessible by Staff and Admin",
                timestamp = DateTime.UtcNow
            });
        }
    }
}
