using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using PharmaStock.Data.Entities;

namespace PharmaStock.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly IConfiguration _configuration;

        public AuthController(
            UserManager<IdentityUser> userManager,
            SignInManager<IdentityUser> signInManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var user = new IdentityUser
            {
                UserName = request.Email,
                Email = request.Email
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(error.Code, error.Description);
                }

                return ValidationProblem(ModelState);
            }

            return Created(string.Empty, new
            {
                id = user.Id,
                email = user.Email
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return Unauthorized();
            }

            var passwordValid = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!passwordValid.Succeeded)
            {
                return Unauthorized();
            }

            var token = CreateJwtToken(user);

            return Ok(new
            {
                token,
                expiresInMinutes = GetJwtDurationInMinutes()
            });
        }

        private string CreateJwtToken(IdentityUser user)
        {
            var key = _configuration["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException("Jwt:Key is not configured.");
            }

            var issuer = _configuration["Jwt:Issuer"] ?? string.Empty;
            var audience = _configuration["Jwt:Audience"] ?? string.Empty;
            var expires = DateTime.UtcNow.AddMinutes(GetJwtDurationInMinutes());

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expires,
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private int GetJwtDurationInMinutes()
        {
            var duration = _configuration["Jwt:DurationInMinutes"];
            return int.TryParse(duration, out var minutes) && minutes > 0 ? minutes : 60;
        }
    }
}
