using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
using PharmaStock.Services;

namespace PharmaStock.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly PharmaStockDbContext _context;
        private readonly IEmailNotificationService _emailService;

        public AdminController(
            UserManager<IdentityUser> userManager,
            PharmaStockDbContext context,
            IEmailNotificationService emailService)
        {
            _userManager = userManager;
            _context = context;
            _emailService = emailService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users
                .AsNoTracking()
                .ToListAsync();

            var userIds = users.Select(u => u.Id).ToList();
            var profilesByUserId = await _context.UserProfiles
                .AsNoTracking()
                .Where(p => userIds.Contains(p.UserId))
                .ToDictionaryAsync(p => p.UserId, p => p.DisplayName);

            var rolesByUserId = await _context.UserRoles
                .AsNoTracking()
                .Where(ur => userIds.Contains(ur.UserId))
                .Join(
                    _context.Roles.AsNoTracking(),
                    userRole => userRole.RoleId,
                    role => role.Id,
                    (userRole, role) => new
                    {
                        userRole.UserId,
                        RoleName = role.Name
                    })
                .Where(x => x.RoleName != null)
                .GroupBy(x => x.UserId)
                .ToDictionaryAsync(
                    group => group.Key,
                    group => (IReadOnlyCollection<string>)group
                        .Select(x => x.RoleName!)
                        .OrderBy(roleName => roleName)
                        .ToArray());

            var userList = new List<object>(users.Count);

            foreach (var user in users)
            {
                profilesByUserId.TryGetValue(user.Id, out var displayName);
                rolesByUserId.TryGetValue(user.Id, out var roles);

                userList.Add(new
                {
                    id = user.Id,
                    email = user.Email,
                    userName = user.UserName,
                    emailConfirmed = user.EmailConfirmed,
                    displayName = displayName ?? user.UserName,
                    roles = roles ?? Array.Empty<string>()
                });
            }

            return Ok(userList);
        }

        [HttpPatch("users/{id}/display-name")]
        public async Task<IActionResult> UpdateDisplayName(string id, [FromBody] UpdateDisplayNameRequest request)
        {
            var profile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == id);

            if (profile == null)
            {
                return NotFound(new { message = "User profile not found." });
            }

            profile.DisplayName = request.DisplayName;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Display name updated." });
        }

        public class UpdateDisplayNameRequest
        {
            public string DisplayName { get; set; } = string.Empty;
        }


        [HttpGet("stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            var totalUsers = await _userManager.Users
                .AsNoTracking()
                .CountAsync();

            var roleStats = await _context.Roles
                .AsNoTracking()
                .GroupJoin(
                    _context.UserRoles.AsNoTracking(),
                    role => role.Id,
                    userRole => userRole.RoleId,
                    (role, userRoles) => new
                    {
                        RoleName = role.Name,
                        UserCount = userRoles.Count()
                    })
                .Where(x => x.RoleName != null)
                .ToDictionaryAsync(
                    x => x.RoleName!,
                    x => x.UserCount);

            var totalRoles = roleStats.Count;

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

        [HttpPost("send-inventory-alerts")]
        public async Task<IActionResult> SendInventoryAlerts()
        {
            try
            {
                var (success, message) = await _emailService.SendUrgentInventoryAlertsAsync();
                return success
                    ? Ok(new { message })
                    : BadRequest(new { message });
            }
            catch (HttpRequestException)
            {
                return StatusCode(503, new { error = "AI prediction service is unavailable." });
            }
        }
    }
}
