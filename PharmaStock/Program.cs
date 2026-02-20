
// These using are for the Database context and Entity Framework Core
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
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

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<MedicationServiceInterface, MedicationService>();

var app = builder.Build();

// Seed the database
using (var scope = app.Services.CreateScope())
{
    
    var db = scope.ServiceProvider.GetRequiredService<PharmaStockDbContext>();
    await PharmaStock.Data.Infrastucture.SeedData.SeedAsync(db); 
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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
