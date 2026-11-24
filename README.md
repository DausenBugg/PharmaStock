# PharmaStock

PharmaStock is a web-based pharmacy inventory management application intended to help small, independent pharmacies organize medication stock, track expiration dates, and identify inventory that may need attention. It is a development project, **not a production-ready pharmacy system**.

The application combines an Angular frontend, an ASP.NET Core REST API, a MySQL database, and an experimental Python-based prediction service.

## Why PharmaStock?

Smaller pharmacy teams may use spreadsheets or general-purpose inventory tools that make it difficult to monitor stock levels, expiration dates, and lot information in one place. PharmaStock explores a centralized, role-based workflow for managing these records and generating reports.

## Features

### Implemented and exercised in local testing

- User login and authenticated access to the web application.
- Dashboard and inventory listing.
- Medication and inventory data displayed with quantities, lot information, expiration dates, and beyond-use dates (BUD).
- Inventory quantity validation: negative quantities are rejected by the backend.
- Reports page displaying inventory information.
- Administration page listing users and their assigned roles.
- Role assignment and removal through the API, verified using Swagger.

### Present in the development project; not fully verified in this test cycle

- Inventory creation, editing, search, and pagination workflows.
- CSV report export and additional reporting functions.
- User profile and administrative account operations beyond the role tests above.
- FDA National Drug Code (NDC) data importing.
- AI-assisted reorder and expiration-risk prediction endpoints.
- Progressive Web App (PWA) installation and offline-related behavior.

The existence of a feature or endpoint does not mean it has passed end-to-end testing. See **Testing Status** and **Known Issues** below.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular, TypeScript, HTML, CSS |
| Backend | C#, ASP.NET Core Web API (.NET 8), Swagger/OpenAPI |
| Authentication | ASP.NET Core Identity and JWT-based authentication |
| Database | MySQL, Entity Framework Core with the Pomelo MySQL provider |
| Prediction service | Python, FastAPI (experimental / not verified in this test cycle) |
| FDA importer | Separate .NET 9 project (`PharmaStock.Importer`) |
| Development tooling | Docker Compose, Git, GitHub |

## Development Setup

These instructions describe the local development workflow tested on Windows using PowerShell. Commands assume the terminal starts at the repository root.

### Requirements

- .NET 8 SDK for the API; .NET 9 SDK for the importer
- Node.js and npm compatible with the frontend project
- Docker Desktop with Docker Compose
- Git
- EF Core CLI (`dotnet ef`) if not already installed
- Appropriate **local development configuration** for the database, authentication, and other services

Do not commit real database passwords, JWT signing keys, or other secrets. Consult the repository's configuration and Compose files for the required environment variables and service settings.

### 1. Start the containers

```powershell
docker compose up -d
docker ps
```

In the tested setup, Docker Compose starts the MySQL container and the AI service. Container names and ports may vary with configuration.

### 2. Apply database migrations

```powershell
cd PharmaStock
dotnet ef database update
```

### 3. Start the API

From the `PharmaStock/` backend directory:

```powershell
dotnet run
```

The API was available at `http://localhost:5177` during local testing, with Swagger at `http://localhost:5177/swagger`. Verify the actual listening address in the terminal for your environment.

### 4. Start the Angular frontend

Open a second terminal at the repository root:

```powershell
cd frontend
npm install
npm start
```

The frontend was available at `http://localhost:4200` during testing. Ensure the API is running before attempting to log in.

### 5. Stop the services

Stop the frontend and API with `Ctrl+C` in their respective terminals. From the repository root, stop the Docker services with:

```powershell
docker compose down
```

### Optional: Build for release

From `frontend/`:

```powershell
npm run build
```

From the backend project directory:

```powershell
dotnet build --configuration Release
```

These commands check compilation; a successful build is not equivalent to production deployment approval.

## Testing Status

The following checks were performed locally in November 2026:

| Area | Result | Notes |
| --- | --- | --- |
| Docker services and MySQL | Passed | Local containers started |
| EF Core migrations | Passed | Database reported up to date |
| API and Swagger | Passed | API started and Swagger was accessible |
| Authentication | Passed | Admin login succeeded |
| Angular frontend and dashboard | Passed | Login and dashboard loaded |
| Inventory listing | Passed | Inventory records displayed |
| Negative quantity validation | Passed with UI issue | Backend rejected negative quantities; UI lacked a useful error message |
| Reports page | Passed with display issues | Inventory report loaded |
| Administration user list | Passed | Users and roles returned |
| Role changes via Swagger | Passed | Staff-to-Admin assignment and old-role removal persisted |
| Staff-to-Admin via Angular | Failed | UI workflow did not produce the expected final role |
| Inventory pagination | Not tested | Insufficient records for a meaningful check |
| AI prediction behavior | Not tested | No end-to-end verification in this test cycle |
| Angular production build | Passed with warnings | Initial bundle exceeded configured budget; reports stylesheet slightly exceeded budget |
| Backend Release build | Passed with warnings | Security advisory reported for MailKit 4.9.0 |

## Known Issues and Limitations

1. **Inventory date editing:** Expiration date and beyond-use date (BUD) fields appear reversed in the editing interface. The persistence behavior has not been fully investigated.
2. **Validation feedback:** The backend rejects negative inventory quantities, but the frontend does not display a clear error explanation.
3. **Role upgrades in Angular:** Staff-to-Admin upgrades do not behave correctly through the Administration UI. Assigning Admin and removing Staff through Swagger succeeded, and the final role was verified as Admin.
4. **Report date formatting:** Some dates display as raw ISO timestamps instead of reader-friendly dates.
5. **BUD visual alerts:** Expired beyond-use dates are not highlighted consistently in the reports interface.
6. **Build-size budgets:** The Angular initial bundle was approximately 952 KB against a 500 KB warning budget; `reports.css` was approximately 4.35 KB against a 4 KB budget.
7. **Dependency advisory:** The backend Release build reported `NU1902` for `MailKit` 4.9.0 (moderate severity): [GHSA-9j88-vvj5-vhgr](https://github.com/advisories/GHSA-9j88-vvj5-vhgr). Review and update before deployment.
8. **Dependency audit:** `npm install` reported dependency vulnerabilities; these have not yet been individually reviewed or remediated.
9. **Deployment:** No production cloud deployment has been verified. Security, authorization, reliability, and data-handling requirements need review before use with real pharmacy data.

## Project Status

**Functional local development build / ongoing testing.** The frontend, API, database, authentication, inventory display, reports, and administrative user listing have been exercised. Known defects remain, and several workflows—including AI predictions and broader authorization checks—require additional testing. This project is not intended for handling live patient or pharmacy operations in its current state.

## Roadmap

- Resolve known inventory editing, validation-message, report-formatting, and role-management issues.
- Complete end-to-end tests for inventory CRUD, pagination, reports export, and staff authorization restrictions.
- Validate prediction-service outputs and their integration into the frontend.
- Review dependencies, secret handling, access controls, and deployment configuration.
- Improve frontend bundle size and document a reproducible deployment process.

## Repository Structure

```text
PharmaStock/
├── PharmaStock/           # ASP.NET Core backend API
├── PharmaStock.Importer/  # FDA NDC data importer
├── frontend/              # Angular web application
├── docker-compose.yml     # Local container services
├── docs/                  # Project documentation
└── README.md
```

Additional directories and files may be present on the development branch.

## FDA NDC Data Import

The `PharmaStock.Importer` project is intended to import FDA Product and Package datasets. Full datasets are excluded from source control; sample datasets may be provided under `data/sample`.

To run the importer from the repository root, after configuring its data sources:

```powershell
dotnet run --project PharmaStock.Importer
```

Confirm the importer configuration and input files before running it against a database.

## Contributors

- James Carter
- Eric Sutton
- Dausen Bugg

## Development Workflow

See `docs/GIT_WORKFLOW.md` for the repository's Git workflow, if available on your branch.
