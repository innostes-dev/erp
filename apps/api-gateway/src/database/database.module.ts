import { Global, Module } from '@nestjs/common';
import { databaseProvider, DRIZZLE_DB } from './database.provider';

@Global()
@Module({
  providers: [databaseProvider],
  exports: [DRIZZLE_DB],
})
export class DatabaseModule {}
