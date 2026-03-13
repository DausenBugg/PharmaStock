
// These using are for the Database context and Entity Framework Core
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PharmaStock.Data;
using PharmaStock.Data.Infrastucture;
using PharmaStock.Services;


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

builder.Services.AddScoped<SyntheticUsageHistoryImporter>();

builder.Services.AddScoped<MedicationServiceInterface, MedicationService>();
builder.Services.AddScoped<InventoryStockServiceInterface, InventoryStockService>();

// AI Prediction Service — HttpClient for the Python ML microservice
builder.Services.AddHttpClient<IAIPredictionService, AIPredictionService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["AIPrediction:BaseUrl"] ?? "http://localhost:8000");
    client.Timeout = TimeSpan.FromSeconds(30);
});


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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<InventoryStockServiceInterface, InventoryStockService>();
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

// CORS policy (allow frontend to access API)
var corsPolicyName = "FrontendCors";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: corsPolicyName,
        policy =>
        {
            policy.WithOrigins("http://localhost:4200") // Angular dev server
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials(); // Allow cookies and auth headers;
        });
});

var app = builder.Build();

if (args.Contains("import-synthetic-usage", StringComparer.OrdinalIgnoreCase))
{
    using var scope = app.Services.CreateScope();
    var importer = scope.ServiceProvider.GetRequiredService<SyntheticUsageHistoryImporter>();
    var replaceExisting = args.Contains("--replace", StringComparer.OrdinalIgnoreCase);
    var csvPath = args
        .FirstOrDefault(argument => argument.StartsWith("--csv=", StringComparison.OrdinalIgnoreCase))?
        .Split('=', 2)[1];

    var imported = await importer.ImportAsync(csvPath, replaceExisting);
    Console.WriteLine($"Imported {imported} synthetic UsageHistories rows.");
    return;
}

// --------------------------
// Seed Roles and Initial Admin User
// --------------------------
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
    
    // Seed roles
    string[] roles = { "Admin", "Staff" };
    
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }
    
    // Seed initial admin user
    var adminEmail = "admin@pharmastock.com";
    var adminUser = await userManager.FindByEmailAsync(adminEmail);
    
    if (adminUser == null)
    {
        adminUser = new IdentityUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true
        };
        
        // Default password - CHANGE IN PRODUCTION
        var result = await userManager.CreateAsync(adminUser, "Admin@123!");
        
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
    else if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
    {
        await userManager.AddToRoleAsync(adminUser, "Admin");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Exception hander
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500; // Internal Server Error
        context.Response.ContentType = "application/json";

        var errorFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        if (errorFeature != null)
        {
            var exception = errorFeature.Error;

            // Log the exception (you can use a logging framework here)
            Console.Error.WriteLine(exception);

            // Return a generic error response
            await context.Response.WriteAsJsonAsync(new
            {
                Message = "An unexpected error occurred. Please try again later."
            });
        }
    });
});

app.UseHttpsRedirection();

app.UseCors(corsPolicyName);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


app.Run();
