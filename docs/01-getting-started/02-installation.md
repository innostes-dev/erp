# 02 - Installation

Once you have all prerequisites installed (Node.js, PostgreSQL, Git), you can clone the repository and install the project dependencies.

## 1. Clone the Repository

Open your terminal and clone the repository to your local workspace:

```bash
git clone git@github.com:innostes/testerp.git
cd testerp
```

## 2. Install Dependencies

Because this is an Nx monorepo, all dependencies for both the frontend (Next.js) and the backend (NestJS) are installed at the root level.

Run the following command:

```bash
npm install
```
*(Note: If your team uses `pnpm` or `yarn`, use `pnpm install` or `yarn install` respectively).*

This will download all required packages into the root `node_modules` directory.

## 3. Environment Variables

The project requires environment variables to connect to the database and configure the API gateway.

1. Locate the `.env.example` file in the root directory (if provided).
2. Copy it to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Open the `.env` file and configure your database connection string. For example:
   ```env
   DATABASE_URL="postgres://postgres:secret@localhost:5432/innostes_db"
   NEXT_PUBLIC_API_URL="http://localhost:3333"
   ```

## 4. Database Setup (Optional/If Applicable)

If you are setting up the database for the first time, you may need to run migrations to scaffold the tables.

```bash
# Push the Drizzle schema to your local database
npx nx run api-gateway:db-push
```
*(Check your `package.json` for the exact database migration scripts used in this project).*

You are now ready to run the application locally!
