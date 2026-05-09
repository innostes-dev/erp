# 01 - System Overview

The **Innostes OS** platform is designed using a paradigm that mimics a desktop Operating System. Instead of a traditional monolithic web application, the system is separated into **Core Services** and **Pluggable Modules**.

## The Operating System Model

### 1. The Core (Kernel & Shell)
The Core is responsible for global, cross-cutting concerns that every application needs but shouldn't have to implement themselves:
- **Authentication & Authorization**: Identity verification and session management.
- **Routing & Navigation**: The top-level application launcher and sidebar navigation menus.
- **Design System**: A unified UI component library, typography, and color palette.
- **Module Registry**: A discovery service that tracks which modules are installed and what features they expose.

### 2. The Modules (Apps)
Modules are the actual business applications (e.g., HRMS, CRM, Payroll, Inventory). 
- They are completely isolated from each other.
- They "install" into the Core by registering their manifest and backend services.
- They rely on the Core to provide the UI shell, the database connection, and the user's identity.

## High-Level Data Flow
1. **Boot**: The Backend (Kernel) boots up and reads the `module-catalog.ts` to register all available backend APIs and frontend manifests.
2. **Session**: The user accesses the Frontend (Shell) and logs in.
3. **Discovery**: The Shell queries the Kernel's `/api/registry/modules` endpoint to discover what apps the user has access to.
4. **Execution**: The user clicks an app icon. The Shell dynamically renders the layout (sidebar) defined by the app's manifest and executes the React components corresponding to that route.
