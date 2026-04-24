using Microsoft.AspNetCore.Http;

namespace PharmaStock.Dtos.Requests.Profile
{
    public class UpdateProfileImageRequest
    {
        public IFormFile File { get; set; } = null!;
    }
}