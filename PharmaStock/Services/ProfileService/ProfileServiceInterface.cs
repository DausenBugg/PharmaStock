using Microsoft.AspNetCore.Http;
using PharmaStock.Dtos.Requests.Profile;
using PharmaStock.Dtos.Responses;
using System.Security.Claims;

namespace PharmaStock.Services
{
    public interface ProfileServiceInterface
    {
        Task<(bool ok, string? error, ProfileResponse? data)>
            GetCurrentUserProfileAsync(ClaimsPrincipal principal);

        Task<(bool ok, string? error)>
            UpdateProfileRequestAsync(ClaimsPrincipal principal, UpdateProfileRequest request);

        Task<(bool ok, string? error)>
            UpdatePasswordAsync(ClaimsPrincipal principal, UpdatePasswordRequest request);

        Task<(bool ok, string? error)>
            UpdateProfileImageAsync(ClaimsPrincipal principal, IFormFile file);

        Task<(bool ok, string? error, byte[]? imageData, string? contentType)>
            GetProfileImageAsync(ClaimsPrincipal principal);

        Task<(bool ok, string? error)>
            DeleteProfileImageAsync(ClaimsPrincipal principal);
    }
}