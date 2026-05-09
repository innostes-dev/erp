'use client';

import Link from 'next/link';
import { BRANDING } from '@innostes/core/design-system';

export default function AuthPage() {
  return (
    <main className="auth-screen">
      <div className="auth-header">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#003da5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="auth-brand-icon">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
        <h1 className="auth-brand-name">{BRANDING.appName}</h1>
        <p className="auth-tagline">{BRANDING.tagline}</p>
      </div>

      <section className="auth-card">
        <div className="auth-card-header">
          <h2>Sign In</h2>
          <p>Access your enterprise workspace</p>
        </div>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="name@company.com" className="auth-input" />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>
            <input type="password" id="password" placeholder="••••••••" className="auth-input" />
          </div>

          <Link href="/workspace" className="auth-submit-btn">
            Sign in to Dashboard
          </Link>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="sso-actions">
          <button className="sso-btn" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Sign in with Company SSO</span>
          </button>
        </div>
      </section>

      <footer className="auth-footer">
        <p>New to {BRANDING.appName}? <a href="#" className="footer-link">Request enterprise access</a></p>
      </footer>
    </main>
  );
}
