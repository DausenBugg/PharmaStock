using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmaStock.Dtos.Requests.Profile;
using PharmaStock.Services;

namespace PharmaStock.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly ProfileServiceInterface _profileService;

        public ProfileController(ProfileServiceInterface profileService)
        {
            _profileService = profileService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var result = await _profileService.GetCurrentUserProfileAsync(User);

            if (!result.ok)
            {
                return NotFound(new { message = result.error });
            }

            return Ok(result.data);
        }

        [HttpPatch("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var result = await _profileService.UpdateProfileRequestAsync(User, request);

            if (!result.ok)
            {
                return BadRequest(new { message = result.error });
            }

            return Ok(new { message = "Profile updated successfully." });
        }

        [HttpPatch("update-password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
        {
            var result = await _profileService.UpdatePasswordAsync(User, request);

            if (!result.ok)
            {
                return BadRequest(new { message = result.error });
            }

            return Ok(new { message = "Password updated successfully." });
        }

        [HttpPatch("profile-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateProfileImage([FromForm] UpdateProfileImageRequest request)
        {
            var result = await _profileService.UpdateProfileImageAsync(User, request.File);

            if (!result.ok)
            {
                return BadRequest(new { message = result.error });
            }

            return Ok(new { message = "Profile image updated successfully." });
        }

        [HttpGet("profile-image")]
        public async Task<IActionResult> GetProfileImage()
        {
            var result = await _profileService.GetProfileImageAsync(User);

            if (!result.ok || result.imageData == null || string.IsNullOrWhiteSpace(result.contentType))
            {
                return NotFound(new { message = result.error });
            }

            return File(result.imageData, result.contentType);
        }

        [HttpDelete("profile-image")]
        public async Task<IActionResult> DeleteProfileImage()
        {
            var result = await _profileService.DeleteProfileImageAsync(User);

            if (!result.ok)
            {
                return BadRequest(new { message = result.error });
            }

            return Ok(new { message = "Profile image deleted successfully." });
        }
    }
}