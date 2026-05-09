'use client';

import { useState, useRef, useEffect } from 'react';
import { useSelectedLayoutSegment } from 'next/navigation';
import type { RegistryModule } from '../../lib/registry';
import { BRANDING } from '@innostes/core/design-system';

export function TopbarActions({ modules }: { modules: RegistryModule[] }) {
  const activeSegment = useSelectedLayoutSegment();
  const activeModule = modules.find((m) => m.id === activeSegment);
  
  const [openDropdown, setOpenDropdown] = useState<'notifications' | 'help' | 'settings' | 'profile' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdown: typeof openDropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <div className="topbar-right" ref={ref}>
      <div className="search-wrapper">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input className="topbar-search" placeholder={`Search ${BRANDING.appName}`} />
      </div>

      <div className="dropdown-container">
        <button 
          className={`icon-btn ${openDropdown === 'notifications' ? 'active-btn' : ''}`} 
          onClick={() => toggleDropdown('notifications')} 
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="notification-badge">3</span>
        </button>
        
        {openDropdown === 'notifications' && (
          <div className="topbar-dropdown-panel notifications-panel">
            <div className="panel-header">
              <h3>{activeModule ? `${activeModule.name} Notifications` : 'Global Notifications'}</h3>
            </div>
            <div className="panel-body">
              <div className="notification-item unread">
                <div className="notif-icon bg-blue-100 text-blue-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
                </div>
                <div className="notif-content">
                  <p><strong>System Update</strong> installed successfully.</p>
                  <span>2 mins ago</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notif-icon bg-green-100 text-green-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div className="notif-content">
                  <p><strong>{activeModule?.name || 'Workspace'}</strong> sync completed.</p>
                  <span>1 hour ago</span>
                </div>
              </div>
            </div>
            <div className="panel-footer">
              <button>View all</button>
            </div>
          </div>
        )}
      </div>

      <div className="dropdown-container">
        <button 
          className={`icon-btn ${openDropdown === 'help' ? 'active-btn' : ''}`} 
          onClick={() => toggleDropdown('help')} 
          aria-label="Help"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </button>
        {openDropdown === 'help' && (
          <div className="topbar-dropdown-panel help-panel">
            <div className="panel-header">
              <h3>Help & Support</h3>
            </div>
            <div className="panel-body">
              <div className="menu-action-item">Documentation</div>
              <div className="menu-action-item">Contact Support</div>
              <div className="menu-action-item">Keyboard Shortcuts</div>
            </div>
          </div>
        )}
      </div>

      <div className="dropdown-container">
        <button 
          className={`icon-btn ${openDropdown === 'settings' ? 'active-btn' : ''}`} 
          onClick={() => toggleDropdown('settings')} 
          aria-label="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
        {openDropdown === 'settings' && (
          <div className="topbar-dropdown-panel settings-panel">
            <div className="panel-header">
              <h3>{activeModule ? `${activeModule.name} Settings` : 'Global Settings'}</h3>
            </div>
            <div className="panel-body">
              <div className="menu-action-item">Preferences</div>
              <div className="menu-action-item">Security</div>
              <div className="menu-action-item">Integrations</div>
            </div>
          </div>
        )}
      </div>

      <div className="dropdown-container">
        <div 
          className="user-avatar" 
          onClick={() => toggleDropdown('profile')}
        >
          <span className="avatar-initials">JD</span>
        </div>
        {openDropdown === 'profile' && (
          <div className="topbar-dropdown-panel profile-panel">
            <div className="profile-header">
              <div className="user-avatar-large">JD</div>
              <div className="profile-info">
                <h4>John Doe</h4>
                <p>john.doe@innostes.com</p>
              </div>
            </div>
            <div className="panel-body">
              <div className="menu-action-item">My Profile</div>
              <div className="menu-action-item">Account Settings</div>
              <div className="menu-separator"></div>
              <div className="menu-action-item text-red-600">Sign out</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
