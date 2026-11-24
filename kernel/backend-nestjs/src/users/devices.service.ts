import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService, Queryable } from '../db/database.service';
import { DeviceNotFoundError } from '../common/errors';
import { DeviceRow, DeviceType } from './user.types';

export interface DeviceInput {
  fingerprint: string;
  name: string;
  type: DeviceType;
  osName?: string | null;
  osVersion?: string | null;
  clientName?: string | null;
  clientVersion?: string | null;
  pushToken?: string | null;
}

@Injectable()
export class DevicesService {
  constructor(private readonly db: DatabaseService) {}

  /** Register a new device or refresh `last_seen_at`/`last_ip` of a known one. */
  async registerOrTouch(db: Queryable, userId: string, d: DeviceInput, ip: string | null): Promise<DeviceRow> {
    const existing = await db.query<DeviceRow>(
      'SELECT * FROM user_devices WHERE user_id = $1 AND device_fingerprint = $2 AND deleted_at IS NULL LIMIT 1',
      [userId, d.fingerprint],
    );
    if (existing.rows[0]) {
      const r = await db.query<DeviceRow>(
        `UPDATE user_devices SET device_name = $2, device_type = $3, os_name = $4, os_version = $5, client_name = $6,
                client_version = $7, push_token = COALESCE($8, push_token), last_seen_at = now(), last_ip = $9, updated_at = now()
          WHERE id = $1 RETURNING *`,
        [
          existing.rows[0].id,
          d.name,
          d.type,
          d.osName ?? null,
          d.osVersion ?? null,
          d.clientName ?? null,
          d.clientVersion ?? null,
          d.pushToken ?? null,
          ip,
        ],
      );
      return r.rows[0];
    }
    const r = await db.query<DeviceRow>(
      `INSERT INTO user_devices (id, user_id, device_fingerprint, device_name, device_type, os_name, os_version, client_name,
                                 client_version, push_token, status, first_seen_at, last_seen_at, last_ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active', now(), now(), $11) RETURNING *`,
      [
        randomUUID(),
        userId,
        d.fingerprint,
        d.name,
        d.type,
        d.osName ?? null,
        d.osVersion ?? null,
        d.clientName ?? null,
        d.clientVersion ?? null,
        d.pushToken ?? null,
        ip,
      ],
    );
    return r.rows[0];
  }

  /** Issue a remote wipe and revoke every active session bound to the device. */
  async wipe(deviceId: string): Promise<DeviceRow> {
    return this.db.tx(async (tx) => {
      const r = await tx.query<DeviceRow>(
        `UPDATE user_devices SET status = 'wiped', wipe_requested_at = now(), updated_at = now()
          WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
        [deviceId],
      );
      if (!r.rows[0]) throw new DeviceNotFoundError(deviceId);
      await tx.query(
        'UPDATE user_sessions SET revoked_at = now(), updated_at = now() WHERE device_id = $1 AND revoked_at IS NULL',
        [deviceId],
      );
      return r.rows[0];
    });
  }
}
