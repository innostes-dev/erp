# Event Bus

The event bus is the only permitted communication channel between modules. It is a typed, in-process pub/sub system built on [mitt](https://github.com/developit/mitt).

**Rule: modules must not import each other.** This is enforced by Nx ESLint boundary tags. When module A needs to tell module B that something happened, it publishes an event. Module B subscribes to that event independently.

---

## What is it?

- Built on `mitt` — a 200-byte event emitter library.
- Fully typed via a shared `EventMap` interface.
- Lives in `@mono/kernel/event-bus`.
- Works entirely in-process (browser memory). It is not a WebSocket or a message queue.

---

## Current typed events

All event names and their payload types are defined in one place:

```ts
// libs/kernel/event-bus/src/events.ts

export interface EventMap {
  'module:activated': { moduleId: string };
  'user:logged-in': { userId: string; email: string };
  'user:logged-out': undefined;
  'notification:show': {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
  'notification:dismiss': { id: string };
}
```

Add new event types to this interface when you need a new signal — see the section below.

---

## Publishing an event

Import `eventBus` from `@mono/kernel/event-bus` and call `emit`.

```ts
// Inside any module — e.g., libs/modules/billing/src/billing.service.ts

import { eventBus } from '@mono/kernel/event-bus';

function handlePaymentComplete(invoiceId: string) {
  // ... business logic ...

  eventBus.emit('notification:show', {
    id: crypto.randomUUID(),
    message: `Invoice ${invoiceId} paid successfully`,
    type: 'success',
  });
}
```

TypeScript enforces the payload type at the call site. Passing the wrong shape is a compile error.

---

## Subscribing to an event

Import `eventBus` and call `on`. In React components, subscribe inside `useEffect` and unsubscribe on cleanup.

```tsx
'use client';

import { useEffect } from 'react';
import { eventBus } from '@mono/kernel/event-bus';
import type { EventMap } from '@mono/kernel/event-bus';

export function NotificationCenter() {
  useEffect(() => {
    function handleNotification(payload: EventMap['notification:show']) {
      // add to local notification list
    }

    eventBus.on('notification:show', handleNotification);

    return () => {
      eventBus.off('notification:show', handleNotification);
    };
  }, []);

  return <div>{/* render notifications */}</div>;
}
```

> **Note:** Always call `eventBus.off` in the `useEffect` cleanup. A subscription that is not removed leaks memory and causes duplicate handlers when the component remounts (e.g., during React Strict Mode).

---

## Subscribing outside React

In non-React code (a service file, a utility), subscribe at the top level or inside a class constructor.

```ts
// libs/modules/analytics/src/tracker.ts

import { eventBus } from '@mono/kernel/event-bus';

eventBus.on('user:logged-in', ({ userId }) => {
  // record login event in analytics
});

eventBus.on('user:logged-out', () => {
  // flush pending analytics queue
});
```

Keep in mind these subscriptions live for the lifetime of the page unless you explicitly call `off`.

---

## How to add a new event type

### Step 1 — Add the event to the EventMap

```ts
// libs/kernel/event-bus/src/events.ts

export interface EventMap {
  // ... existing events ...

  'cart:item-added': { productId: string; quantity: number };
}
```

### Step 2 — Verify exports

`EventMap` must be re-exported from the package index so other modules can type their handlers.

```ts
// libs/kernel/event-bus/src/index.ts
export { eventBus } from './bus';
export type { EventMap } from './events';
```

### Step 3 — Publish from the source module

```ts
import { eventBus } from '@mono/kernel/event-bus';

eventBus.emit('cart:item-added', { productId: 'sku-123', quantity: 2 });
```

### Step 4 — Subscribe from the receiving module

```ts
import { eventBus } from '@mono/kernel/event-bus';
import type { EventMap } from '@mono/kernel/event-bus';

eventBus.on('cart:item-added', (payload: EventMap['cart:item-added']) => {
  // react to the event
});
```

TypeScript will catch typos in event names and mismatched payload shapes at compile time.

---

## When to use events vs props vs state

Use this table to decide:

| Situation | Mechanism |
|---|---|
| Parent passes data to child | Props |
| Child notifies parent of an action | Callback prop |
| Multiple components in the same module share state | Module-level Zustand store |
| Platform UI state (sidebar, theme) | `useKernelStore()` |
| Module A needs to notify Module B | Event bus |
| Module A needs data from Module B | Wrong question — restructure so each module owns its own data |

---

## Cross-module communication rule

Modules are isolated by Nx boundary enforcement. The Nx ESLint config ensures that a tag `scope:billing` cannot import from `scope:crm`. This is not optional and not overridable with a comment.

The event bus is the intentional escape hatch. It decouples the publisher from the subscriber completely — the billing module does not need to know that the crm module exists, and vice versa.

If you find yourself wanting to call a function that lives in another module directly, that is a signal to:

1. Convert the call into an event emission.
2. Or extract the shared logic into a kernel lib that both modules can import.

Never import across module boundaries. The CI lint check will fail if you do.
