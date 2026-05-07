# Frequently Asked Questions

---

**Q: Do I need PostgreSQL running to develop locally?**

No. The default configuration uses `StaticUserRepository`, which holds credentials in memory. PostgreSQL is not required and will not be connected to unless you explicitly switch to `DrizzleUserRepository`. You can log in and use the entire application locally with no database running.

---

**Q: How do I add a new user to the static credentials?**

Edit `libs/modules/auth/src/repositories/static-user.repository.ts`. Users are stored as an array of plain objects. Add an entry with the fields your app requires:

```ts
private readonly users: StaticUser[] = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'hashed-password-here',
    name: 'Admin User',
    roles: ['admin'],
  },
  // Add your user here
  {
    id: '2',
    email: 'dev@example.com',
    password: 'hashed-password-here',
    name: 'Dev User',
    roles: ['user'],
  },
];
```

Restart the API gateway after saving. The change takes effect immediately on next startup.

---

**Q: Can I call the API from outside the shell app?**

Yes. The NestJS API gateway runs independently at `http://localhost:3001`. You can call it directly from any HTTP client (curl, Postman, a separate frontend) as long as you handle CORS.

CORS is configured in `apps/api-gateway/src/main.ts`. To allow a new origin:

```ts
app.enableCors({
  origin: ['http://localhost:3000', 'http://your-other-origin:3002'],
  credentials: true,
});
```

Pass the `Authorization: Bearer <token>` header with every authenticated request.

---

**Q: How do modules communicate with each other?**

Through the event bus — `@mono/kernel/event-bus`. Module A publishes a typed event. Module B subscribes to it. Neither module imports the other.

```ts
// Module A publishes
import { eventBus } from '@mono/kernel/event-bus';
eventBus.emit('order:completed', { orderId: '123' });

// Module B subscribes
eventBus.on('order:completed', ({ orderId }) => {
  // react to the event
});
```

Direct imports between modules are blocked by Nx ESLint boundary rules. The lint check will fail if you try to import across module boundaries.

See `docs/03-kernel/03-event-bus.md` for the full guide.

---

**Q: Where do I put business logic?**

In the service layer inside `apps/api-gateway/src/modules/<module-name>/<module-name>.service.ts`.

- **Controllers** receive HTTP requests and delegate immediately to services. No logic in controllers.
- **Repositories** query the data layer. No transformation or validation logic in repositories.
- **Services** own all business logic: validation, transformation, orchestration, and calls to other services or repositories.

```ts
// Wrong — logic in a controller
@Get(':id')
async getInvoice(@Param('id') id: string) {
  const invoice = await this.repo.findById(id);
  if (!invoice) throw new NotFoundException();
  invoice.total = invoice.items.reduce((s, i) => s + i.price, 0); // wrong place
  return invoice;
}

// Correct — delegate to service
@Get(':id')
async getInvoice(@Param('id') id: string) {
  return this.invoiceService.getById(id);
}
```

---

**Q: Can I add a new kernel feature?**

Yes. Kernel libs are in `libs/kernel/`. Follow this pattern:

1. Create the directory: `libs/kernel/my-feature/src/`.
2. Write the implementation in `libs/kernel/my-feature/src/`.
3. Export the public API from `libs/kernel/my-feature/src/index.ts`.
4. Create `libs/kernel/my-feature/project.json` with the Nx project definition.
5. Add the path alias to `tsconfig.base.json`:
   ```json
   "@mono/kernel/my-feature": ["libs/kernel/my-feature/src/index.ts"]
   ```
6. Add the Nx tag `platform:kernel` in `project.json` so boundary rules apply correctly.
7. Write the documentation in `docs/03-kernel/`.

---

**Q: How do I switch from static users to a real database?**

Change one line in `apps/api-gateway/src/modules/auth/auth.module.ts`. Replace the `StaticUserRepository` provider with `DrizzleUserRepository`:

```ts
// Before
{
  provide: USER_REPOSITORY,
  useClass: StaticUserRepository,
}

// After
{
  provide: USER_REPOSITORY,
  useClass: DrizzleUserRepository,
}
```

You will also need:

1. A running PostgreSQL instance.
2. `DATABASE_URL` set in `.env`.
3. Migrations applied: `pnpm nx run api-gateway:migrate`.

The rest of the auth module — controllers, services, guards — is unaware of which repository is active. It programs against the `UserRepository` interface.

---

**Q: Why is my Tailwind class not applying?**

The most common cause: the file is not included in the `content` array in `tailwind.config.ts`.

Check that the path to your file matches one of the glob patterns:

```ts
content: [
  './apps/shell/src/**/*.{ts,tsx}',
  './libs/**/*.{ts,tsx}',
],
```

If you added a new top-level directory (e.g., `packages/`), add it here:

```ts
'./packages/**/*.{ts,tsx}',
```

Other causes:
- The class is misspelled (Tailwind does not warn about unknown classes by default).
- The class is being constructed dynamically with string concatenation — Tailwind's scanner cannot detect classes that are assembled at runtime. Use `cn()` with full class names instead.

---

**Q: How do I add a new page to an existing module?**

Create the file in the App Router directory for that module. Pages are co-located with the module folder under `(modules)`.

```
apps/shell/src/app/(modules)/your-module/new-page/page.tsx
```

The URL for this page will be `/your-module/new-page`.

```tsx
// apps/shell/src/app/(modules)/your-module/new-page/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from '@mono/kernel/auth/server';

export default async function NewPage() {
  const user = await getServerSession();
  if (!user) redirect('/login');

  return (
    <main>
      <h1>New Page</h1>
    </main>
  );
}
```

No routing configuration is needed. The App Router discovers pages by filesystem convention.

---

**Q: Where does the API docs page (/developer/api) get its data?**

It fetches live from `GET /api/docs-json` — a JSON endpoint that NestJS Swagger generates automatically at runtime from decorator metadata in your controllers.

You never edit the API docs page manually. When you add a new endpoint:

1. Add `@ApiOperation({ summary: 'What this endpoint does' })` to the controller method.
2. Add `@ApiResponse({ status: 200, type: ResponseDto })` for the success response.
3. Add `@ApiBody({ type: RequestDto })` if the endpoint takes a request body.

Restart the API gateway and visit `/developer/api`. The new endpoint appears immediately.
