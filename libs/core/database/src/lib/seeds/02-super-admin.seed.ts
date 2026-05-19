import { Seeder, DbType } from './seeder.interface';
import { users, roles } from '../schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import * as argon2 from 'argon2';
import { createCipheriv, createHmac, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-bytes-long-123456', 'utf-8');
const HMAC_SECRET = process.env.HMAC_SECRET || 'default-hmac-secret-key-123456';

function encryptEmail(email: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(email, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function hashEmail(email: string): string {
  return createHmac('sha256', HMAC_SECRET).update(email.toLowerCase()).digest('hex');
}

export const superAdminSeeder: Seeder = {
  name: '02 - Super Admin',
  run: async (db: DbType) => {
    const tenantId = 'system-tenant';
    const roleId = createId();

    console.log(`Seeding: Super Admin Role...`);
    const [existingRole] = await db.select().from(roles).where(eq(roles.name, 'Super Admin')).limit(1);
    let finalRoleId = existingRole?.id;
    
    if (!existingRole) {
      await db.insert(roles).values({
        id: roleId,
        tenantId,
        name: 'Super Admin',
        description: 'Unrestricted system access',
        isSystem: true,
        permissions: ['*'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      finalRoleId = roleId;
    }

    console.log(`Seeding: Super Admin User...`);
    const rawEmail = 'admin@innostes.com';
    const rawPassword = 'SuperAdminPassword123!';

    const emailEnc = encryptEmail(rawEmail);
    const emailHmac = hashEmail(rawEmail);
    const passwordHash = await argon2.hash(rawPassword);

    const [existingUser] = await db.select().from(users).where(eq(users.emailHmac, emailHmac)).limit(1);

    if (existingUser) {
      console.log('Super Admin user already exists. Updating password and role...');
      await db.update(users)
        .set({ password: passwordHash, roleId: finalRoleId })
        .where(eq(users.id, existingUser.id));
    } else {
      await db.insert(users).values({
        id: createId(),
        tenantId,
        emailEnc,
        emailHmac,
        password: passwordHash,
        firstName: 'System',
        lastName: 'Administrator',
        roleId: finalRoleId,
        emailVerifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
};
