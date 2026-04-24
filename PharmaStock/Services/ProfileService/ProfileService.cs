using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
using PharmaStock.Data.Entities;
using PharmaStock.Dtos.Requests.Profile;
using PharmaStock.Dtos.Responses;
using System.Security.Claims;

namespace PharmaStock.Services
{
    public class ProfileService : ProfileServiceInterface
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly PharmaStockDbContext _context;

        public ProfileService(
            UserManager<IdentityUser> userManager,
            PharmaStockDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        private async Task<IdentityUser?> GetUserAsync(ClaimsPrincipal principal)
        {
            return await _userManager.GetUserAsync(principal);
        }

        private async Task<UserProfile> GetOrCreateProfileAsync(IdentityUser user)
        {
            var profile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            if (profile == null)
            {
                profile = new UserProfile
                {
                    UserId = user.Id,
                    DisplayName = user.UserName ?? string.Empty
                };

                _context.UserProfiles.Add(profile);
                await _context.SaveChangesAsync();
            }

            return profile;
        }

        // =============================
        // GET PROFILE
        // =============================
        public async Task<(bool ok, string? error, ProfileResponse? data)>
            GetCurrentUserProfileAsync(ClaimsPrincipal principal)
        {
            var user = await GetUserAsync(principal);

            if (user == null)
            {
                return (false, "User not found.", null);
            }

            var roles = await _userManager.GetRolesAsync(user);

            var profile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            var response = new ProfileResponse
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                UserName = user.UserName ?? string.Empty,
                EmailConfirmed = user.EmailConfirmed,
                Roles = roles,
                DisplayName = profile?.DisplayName ?? string.Empty,
                Bio = profile?.Bio,
                HasProfileImage = profile?.ProfileImage != null
            };

            return (true, null, response);
        }

        // =============================
        // UPDATE PROFILE
        // =============================
        public async Task<(bool ok, string? error)>
            UpdateProfileRequestAsync(ClaimsPrincipal principal, UpdateProfileRequest request)
        {
            var user = await GetUserAsync(principal);

            if (user == null)
            {
                return (false, "User not found.");
            }

            var profile = await GetOrCreateProfileAsync(user);

            if (request.DisplayName != null)
            {
                profile.DisplayName = request.DisplayName;
            }

            if (request.Bio != null)
            {
                profile.Bio = request.Bio;
            }

            await _context.SaveChangesAsync();

            return (true, null);
        }

        // =============================
        // UPDATE PASSWORD
        // =============================
        public async Task<(bool ok, string? error)>
            UpdatePasswordAsync(ClaimsPrincipal principal, UpdatePasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword) ||
                string.IsNullOrWhiteSpace(request.ConfirmNewPassword))
            {
                return (false, "All password fields are required.");
            }

            if (request.NewPassword != request.ConfirmNewPassword)
            {
                return (false, "New password and confirm password do not match.");
            }

            var user = await GetUserAsync(principal);

            if (user == null)
            {
                return (false, "User not found.");
            }

            var result = await _userManager.ChangePasswordAsync(
                user,
                request.CurrentPassword,
                request.NewPassword);

            if (!result.Succeeded)
            {
                var errors = string.Join(" ", result.Errors.Select(e => e.Description));
                return (false, errors);
            }

            return (true, null);
        }

        // =============================
        // UPDATE IMAGE
        // =============================
        public async Task<(bool ok, string? error)>
            UpdateProfileImageAsync(ClaimsPrincipal principal, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return (false, "Image file is required.");
            }

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };

            if (!allowedTypes.Contains(file.ContentType))
            {
                return (false, "Only JPG, PNG, and WEBP files are allowed.");
            }

            if (file.Length > 2 * 1024 * 1024)
            {
                return (false, "Image must be 2MB or less.");
            }

            var user = await GetUserAsync(principal);

            if (user == null)
            {
                return (false, "User not found.");
            }

            var profile = await GetOrCreateProfileAsync(user);

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);

            profile.ProfileImage = memoryStream.ToArray();
            profile.ProfileImageContentType = file.ContentType;

            await _context.SaveChangesAsync();

            return (true, null);
        }

        // =============================
        // GET IMAGE
        // =============================
        public async Task<(bool ok, string? error, byte[]? imageData, string? contentType)>
            GetProfileImageAsync(ClaimsPrincipal principal)
        {
            var user = await GetUserAsync(principal);

            if (user == null)
            {
                return (false, "User not found.", null, null);
            }

            var profile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            if (profile == null || profile.ProfileImage == null || string.IsNullOrWhiteSpace(profile.ProfileImageContentType))
            {
                return (false, "No profile image found.", null, null);
            }

            return (true, null, profile.ProfileImage, profile.ProfileImageContentType);
        }

        // =============================
        // DELETE IMAGE
        // =============================
        public async Task<(bool ok, string? error)>
            DeleteProfileImageAsync(ClaimsPrincipal principal)
        {
            var user = await GetUserAsync(principal);

            if (user == null)
            {
                return (false, "User not found.");
            }

            var profile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            if (profile == null)
            {
                return (false, "Profile not found.");
            }

            profile.ProfileImage = null;
            profile.ProfileImageContentType = null;

            await _context.SaveChangesAsync();

            return (true, null);
        }
    }
}