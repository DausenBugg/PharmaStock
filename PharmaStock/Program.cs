
// These using are for the Database context and Entity Framework Core
using Microsoft.EntityFrameworkCore;
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

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
