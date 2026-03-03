using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
using PharmaStock.Data.Data.Entities;
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
        private readonly PharmaStockDbContext _dbContext;

        public StaffController(UserManager<IdentityUser> userManager, PharmaStockDbContext dbContext)
        {
            _userManager = userManager;
            _dbContext = dbContext;
        }
        /// <summary>
        /// Returns a summary of inventory: total items, low-stock count, expired count, and expiring count.
        /// </summary>
        [HttpGet("inventory/summary")]
        public async Task<ActionResult<InventorySummaryDto>> GetInventorySummary()
        {
            var now = DateTime.UtcNow;
            var expiringSoonCutoff = now.AddDays(7);

            var totalItems = await _dbContext.InventoryStocks.CountAsync();
            var lowStockCount = await _dbContext.InventoryStocks.CountAsync(m => m.QuantityOnHand < 10);
            var expiredCount = await _dbContext.InventoryStocks.CountAsync(m => m.ExpirationDate < now);
            var expiringCount = await _dbContext.InventoryStocks.CountAsync(m => m.ExpirationDate >= now && m.ExpirationDate <= expiringSoonCutoff);

            var summary = new InventorySummaryDto
            {
                TotalItems = totalItems,
                LowStockCount = lowStockCount,
                ExpiringCount = expiringCount,
                ExpiredCount = expiredCount
            };

            return Ok(summary);
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
        /// Gets inventory data placeholder. Accessible by Admin and Staff.
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
