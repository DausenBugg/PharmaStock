using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;

namespace PharmaStock.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly PharmaStockDbContext _context;

        public AdminController(
            UserManager<IdentityUser> userManager,
            RoleManager<IdentityRole> roleManager,
            PharmaStockDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userList = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new
                {
                    id = user.Id,
                    email = user.Email,
                    userName = user.UserName,
                    emailConfirmed = user.EmailConfirmed,
                    roles
                });
            }

            return Ok(userList);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            var totalUsers = await _userManager.Users.CountAsync();
            var totalRoles = await _roleManager.Roles.CountAsync();

            // Count users per role
            var roleStats = new Dictionary<string, int>();
            var roles = await _roleManager.Roles.ToListAsync();
            foreach (var role in roles)
            {
                var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
                roleStats[role.Name!] = usersInRole.Count;
            }

            return Ok(new
            {
                totalUsers,
                totalRoles,
                usersPerRole = roleStats
            });
        }

        [HttpDelete("users/{email}")]
        public async Task<IActionResult> DeleteUser(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to delete user.", errors = result.Errors });
            }

            return Ok(new { message = $"User '{email}' has been deleted." });
        }

        [HttpGet("dashboard")]
        public IActionResult GetDashboard()
        {
            return Ok(new
            {
                message = "Welcome to the Admin Dashboard",
                timestamp = DateTime.UtcNow,
                serverInfo = new
                {
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                    machineName = Environment.MachineName
                }
            });
        }
    }
}
