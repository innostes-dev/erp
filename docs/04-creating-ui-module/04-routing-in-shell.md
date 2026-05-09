# 04 - Routing in the Shell

The final step in creating a UI module is mapping your components to actual URLs in the Next.js `os-shell`.

Because Innostes OS uses dynamic routing (`app/(suite)/[appId]`), the layout and sidebar are handled automatically. You only need to build the pages.

## 1. Create the Route Folders
Navigate to `apps/os-shell/src/app/(suite)/[appId]`.

To create the `/inventory/items` route defined in your manifest:
1. Create a folder named `items` (i.e., `apps/os-shell/src/app/(suite)/[appId]/items`).
2. Create a `page.tsx` file inside it.

## 2. Implement the Page
Import the components you built in your `feature-ui` library.

```tsx
// apps/os-shell/src/app/(suite)/[appId]/items/page.tsx

import { ItemList } from '@innostes/modules/inventory/feature-ui';

export default async function ItemsPage({ params }: { params: { appId: string } }) {
  // Ensure this page only renders if the appId matches your module
  if (params.appId !== 'inventory') return null;

  return (
    <div className="module-page">
      <header className="page-header">
        <h1>Item Catalog</h1>
        <p>Manage all stock items.</p>
      </header>
      
      <ItemList />
    </div>
  );
}
```

## 3. Data Fetching
Next.js 15 uses Server Components by default. Fetch your data securely on the server and pass it down to your client components.

```tsx
async function fetchItems() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  const res = await fetch(`${API_URL}/api/inventory/items`, { cache: 'no-store' });
  return res.json();
}

export default async function ItemsPage({ params }) {
  if (params.appId !== 'inventory') return null;
  const items = await fetchItems();

  return <ItemList data={items} />;
}
```

Your module is now fully integrated with the OS Shell!
