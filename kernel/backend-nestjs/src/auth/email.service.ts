import { Inject, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { APP_CONFIG, AppConfig } from '../config/env';

export interface PasswordResetEmail {
  recipient: string;
  recipientName: string;
  tempPassword: string;
  resetLink: string;
  tempPasswordHours: number;
  resetLinkMinutes: number;
}

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transport: nodemailer.Transporter | null;

  constructor(@Inject(APP_CONFIG) private readonly cfg: AppConfig) {
    const s = cfg.smtp;
    this.transport = s.host
      ? nodemailer.createTransport({
          host: s.host,
          port: s.port,
          secure: s.port === 465,
          requireTLS: s.useTls && s.port !== 465,
          auth: s.username ? { user: s.username, pass: s.password ?? '' } : undefined,
        })
      : null;
  }

  async sendPasswordReset(m: PasswordResetEmail): Promise<void> {
    const subject = 'Reset your password';
    const text =
      `Hello ${m.recipientName},\n\nA password reset was requested for your account.\n\n` +
      `Temporary password (valid ${m.tempPasswordHours} hours): ${m.tempPassword}\n` +
      `Reset link (valid ${m.resetLinkMinutes} minutes): ${m.resetLink}\n\n` +
      'If you did not request this, contact your administrator.';
    const html =
      `<p>Hello ${escapeHtml(m.recipientName)},</p><p>A password reset was requested for your account.</p>` +
      `<p>Temporary password (valid ${m.tempPasswordHours} hours): <code>${escapeHtml(m.tempPassword)}</code></p>` +
      `<p><a href="${escapeHtml(m.resetLink)}">Reset your password</a> (valid ${m.resetLinkMinutes} minutes)</p>`;

    if (!this.transport) {
      if (!this.cfg.isDevLike) {
        this.logger.warn('SMTP is not configured: password reset email was NOT sent');
      } else {
        // Development convenience (mirrors the reference console mailer). Never done in production.
        this.logger.log(`[console mail] to=${m.recipient} subject="${subject}"\n${text}`);
      }
      return;
    }
    await this.transport.sendMail({ from: this.cfg.smtp.from, to: m.recipient, subject, text, html });
  }
}
