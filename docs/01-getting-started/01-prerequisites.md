# 01 - Prerequisites

Before you can start developing on Innostes OS, you must ensure your local development environment is properly configured. We rely on modern tooling and strict versioning.

## Required Software

### 1. Node.js
You must have Node.js installed. We recommend using `nvm` (Node Version Manager) or `fnm` to manage your Node versions.
- **Minimum Version:** Node.js v18.17.0+
- **Recommended Version:** Node.js v20.x (LTS)

### 2. Package Manager
We use `npm` (or `pnpm`/`yarn` depending on your team's standard) as the default package manager for this Nx monorepo.
- **Minimum Version:** npm v9.x+

### 3. PostgreSQL
The backend (Kernel) uses PostgreSQL as its primary database.
- **Minimum Version:** PostgreSQL v14+
- You can install it natively or run it via Docker:
  ```bash
  docker run --name innostes-db -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:15
  ```

### 4. Git
Version control is mandatory. Ensure you have Git installed and configured with your SSH keys for repository access.

## Recommended IDE & Extensions
We highly recommend using **Visual Studio Code (VS Code)**.

Please install the following extensions to ensure your code complies with our linting and formatting rules:
- **Nx Console:** For visualizing the monorepo graph and running generators.
- **ESLint:** To catch boundary violations and syntax errors.
- **Prettier:** For consistent code formatting.
- **Tailwind CSS IntelliSense:** For autocompleting utility classes in the React frontend.
