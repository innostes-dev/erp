import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { idColumn } from './utils';
import { users } from './users';

export const otpTokens = pgTable(
  'otp_tokens',
  {
    ...idColumn,
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    otpHash: text('otp_hash').notNull(), // SHA-256 hash of OTP
    purpose: text('purpose').notNull(), // 'FORGOT_PASSWORD' | 'EMAIL_VERIFY'
    attempts: integer('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true, mode: 'string' }),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('otp_tokens_user_id_idx').on(table.userId),
  })
);

export const otpTokensRelations = relations(otpTokens, ({ one }) => ({
  user: one(users, {
    fields: [otpTokens.userId],
    references: [users.id],
  }),
}));
