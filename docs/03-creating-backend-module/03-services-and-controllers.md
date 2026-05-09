# 03 - Services and Controllers (API Logic)

Once the database is modeled, we create the NestJS logic to interact with it.

## 1. Generate the Library
```bash
npx nx g @nx/nest:lib api-logic --directory=libs/modules/inventory
```

## 2. Create the Service
Services contain your core business logic and database calls.

```typescript
// libs/modules/inventory/api-logic/src/inventory.service.ts
import { Injectable } from '@nestjs/common';
import { db } from '@innostes/core/database';
import { inventoryItems } from '@innostes/modules/inventory/data-access';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class InventoryService {
  async getItems(tenantId: string) {
    return db.select().from(inventoryItems).where(eq(inventoryItems.tenantId, tenantId));
  }
}
```

## 3. Create the Controller
Controllers map HTTP requests to your services. They enforce authentication.

```typescript
// libs/modules/inventory/api-logic/src/inventory.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '@innostes/core/auth';

@Controller('api/inventory')
@UseGuards(JwtAuthGuard) // CRITICAL: Secure the endpoint
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  async getItems(@Req() req) {
    // req.user is injected by JwtAuthGuard
    return this.inventoryService.getItems(req.user.tenantId);
  }
}
```

## 4. Export the Providers
Export both the Service and Controller in `libs/modules/inventory/api-logic/src/index.ts`.
