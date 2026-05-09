# 10 - Troubleshooting & FAQ

Below are common issues developers face when working with the Innostes OS architecture and how to resolve them.

## 1. Next.js Hydration Errors
**Symptom:** `Hydration failed because the server rendered HTML didn't match the client.`
**Cause:** This happens when a Server Component renders different output than the Client Component on first load (often due to `window` checks or extensions like password managers modifying HTML).
**Fix:**
- Ensure you aren't using browser APIs (`localStorage`, `window.innerWidth`) directly in the render path without `useEffect`.
- If dynamic data is causing it, wrap the problematic client component in a `<Suspense>` boundary or use `next/dynamic` with `ssr: false`.

## 2. Empty Sidebar / Module Not Showing
**Symptom:** You navigate to `/inventory` and the sidebar says "MODULE" with no links.
**Cause:** The frontend OS Shell cannot find a matching module ID in the registry data.
**Fix:**
- Check your `manifest.ts` file. Ensure `id: 'inventory'` matches the URL exactly.
- Verify that your manifest is imported and registered in `apps/api-gateway/src/app/module-catalog.ts`.
- Restart the API Gateway server.

## 3. Nx "Cannot find module" Errors
**Symptom:** TypeScript complains that it cannot find `@innostes/modules/hrms/feature-ui`.
**Cause:** The library is not registered in the root `tsconfig.base.json`.
**Fix:**
- Normally, Nx adds this automatically when you run `nx g @nx/...`.
- If it didn't, manually add the path under the `compilerOptions.paths` object in `tsconfig.base.json`.

## 4. ESLint "Module Boundary" Error
**Symptom:** `A project tagged with "type:ui" can only depend on libs tagged with "type:ui" or "type:util"`.
**Cause:** You are trying to import backend logic (`api-logic` or `data-access`) directly into a React component (`feature-ui`).
**Fix:** Do not import DB schemas or backend controllers into the frontend. Fetch data via HTTP instead.
