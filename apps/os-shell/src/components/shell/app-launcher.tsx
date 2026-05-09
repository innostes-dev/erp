'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { RegistryModule } from '../../lib/registry';
import { BRANDING } from '@innostes/core/design-system';

type AppLauncherProps = {
  modules: RegistryModule[];
};

export function AppLauncher({ modules }: AppLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="app-icon-btn" type="button" onClick={() => setOpen((state) => !state)} aria-label="Switch app">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H9V9H4V4ZM4 11H9V16H4V11ZM4 18H9V23H4V18ZM11 4H16V9H11V4ZM11 11H16V16H11V11ZM11 18H16V23H11V18ZM18 4H23V9H18V4ZM18 11H23V16H18V11ZM18 18H23V23H18V18Z" fill="currentColor" />
        </svg>
      </button>

      {open ? (
        <div className="app-launcher-overlay" onClick={() => setOpen(false)}>
          <div className="app-launcher-panel" onClick={(event) => event.stopPropagation()}>
            <div className="launcher-header">
              <span className="launcher-title">{BRANDING.modulesTitle}</span>
              <button className="launcher-close" type="button" onClick={() => setOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="launcher-grid">
              {/* HR Module */}
              <Link className="launcher-item" href="/hr" onClick={() => setOpen(false)}>
                <div className="launcher-icon-box hr-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <span>HR</span>
              </Link>

              {/* Payroll Module */}
              <Link className="launcher-item" href="/payroll" onClick={() => setOpen(false)}>
                <div className="launcher-icon-box payroll-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                    <line x1="12" y1="10" x2="12" y2="10"></line>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                </div>
                <span>Payroll</span>
              </Link>

              {/* Recruitment Module */}
              <Link className="launcher-item" href="/recruitment" onClick={() => setOpen(false)}>
                <div className="launcher-icon-box recruitment-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" y1="8" x2="19" y2="14"></line>
                    <line x1="22" y1="11" x2="16" y2="11"></line>
                  </svg>
                </div>
                <span>Recruitment</span>
              </Link>

              {/* Performance Module */}
              <Link className="launcher-item" href="/performance" onClick={() => setOpen(false)}>
                <div className="launcher-icon-box performance-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                </div>
                <span>Performance</span>
              </Link>

              {/* Settings Module */}
              <Link className="launcher-item" href="/settings" onClick={() => setOpen(false)}>
                <div className="launcher-icon-box settings-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </div>
                <span>Settings</span>
              </Link>
            </div>

            <div className="launcher-footer">
              <Link className="manage-modules-link" href="/workspace" onClick={() => setOpen(false)}>
                <span>Manage Modules</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
