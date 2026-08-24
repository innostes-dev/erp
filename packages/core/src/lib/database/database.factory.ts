import { IDatabaseService } from './database.interface';
import { PostgresDatabaseService } from './postgres.service';
import { PoolConfig } from 'pg';

export function createDatabaseService(config?: PoolConfig): IDatabaseService {
  return new PostgresDatabaseService(config);
}
