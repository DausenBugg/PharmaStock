
// These using are for the Database context and Entity Framework Core
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PharmaStock.Data;


var builder = WebApplication.CreateBuilder(args);

// --------------------------
// Configuration
// --------------------------
// Configuration values are loaded from:
// - appsettings.json
// - appsettings.Development.json (when in Development environment)
// - Environment Variables
// These will be used later for database connection and JWT settings.


// --------------------------
// Database (EF Core and MySQL)
// --------------------------
// Get the connection string from configuration
var connectionString = builder.Configuration.GetConnectionString("PharmaStockDb")
    // Guard clause to ensure connection string is provided
    ?? throw new InvalidOperationException("Connection string 'PharmaStockDb' not found.");

// Register the DbContext with the dependency injection container
builder.Services.AddDbContext<PharmaStockDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// --------------------------
// ASP.NET Core Identity
// --------------------------
// Configure Identity services for authentication and user management
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    // Password settings (can be customized as needed)
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
    
    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    
    // User settings
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<PharmaStockDbContext>()
.AddDefaultTokenProviders();

// --------------------------
// Authentication (JWT Bearer)
// --------------------------
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("JWT key is not configured. Set Jwt:Key in configuration.");
}

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by a space and the token."
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
