var builder = WebApplication.CreateBuilder(args);

// --------------------------
// Configuration
// --------------------------
// Configuration values are loaded from:
// - appsettings.json
// - appsettings.Development.json (when in Development environment)
// - Environment Variables
// These will be used later for database connection and JWT settings.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");


// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

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
