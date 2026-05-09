# 03 - Running Locally

Innostes OS consists of two main applications that must run simultaneously for the system to function correctly:
1. **The Kernel (`api-gateway`)**: The NestJS backend.
2. **The Shell (`os-shell`)**: The Next.js frontend.

## Starting the Development Servers

We use the Nx CLI to serve applications. You will need to run these commands in separate terminal windows (or use a tool like `tmux` or VS Code split terminals).

### 1. Start the Backend (Kernel)
Open your first terminal and run:

```bash
npx nx serve api-gateway
```
- **What this does:** Compiles the NestJS application and starts it in watch mode.
- **Default Port:** `http://localhost:3333`
- **Verification:** You should see `[NestApplication] Nest application successfully started` in the console.

### 2. Start the Frontend (Shell)
Open your second terminal and run:

```bash
npx nx serve os-shell
```
- **What this does:** Compiles the Next.js application and starts the development server.
- **Default Port:** `http://localhost:3000`
- **Verification:** You should see `ready - started server on 0.0.0.0:3000` in the console.

## Accessing the Application

Once both servers are running:
1. Open your web browser.
2. Navigate to [http://localhost:3000](http://localhost:3000).
3. You should see the Innostes OS login screen.

### Bypassing Authentication Locally
If you are developing a specific module and want to bypass the login screen locally, you can navigate directly to the workspace:
[http://localhost:3000/workspace](http://localhost:3000/workspace)

## Running the Marketing Site (Optional)
If you need to work on the public-facing marketing site:

```bash
npx nx serve marketing-site
```
This will start on a separate port (usually `http://localhost:4200` or `3001` depending on the Nx configuration).
