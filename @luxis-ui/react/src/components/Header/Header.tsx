"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Flex } from '../Flex';
import { Typography } from '../Typography';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Menu } from '../Menu';
import './Header.css';

export interface NotificationItem {
  /**
   * Notification ID
   */
  id: string;
  /**
   * Notification title
   */
  title: string;
  /**
   * Notification description
   */
  description?: string;
  /**
   * Timestamp or time ago string
   */
  time: string;
  /**
   * Whether notification is read
   * @default false
   */
  read?: boolean;
  /**
   * Notification icon
   */
  icon?: React.ReactNode;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Notification type for styling
   */
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface HeaderProps {
  /**
   * Logo or brand element
   */
  logo?: React.ReactNode;
  /**
   * Title text
   */
  title?: string;
  /**
   * Toggle button click handler (for sidebar)
   */
  onToggleSidebar?: () => void;
  /**
   * Whether to show toggle button
   * @default true
   */
  showToggle?: boolean;
  /**
   * Notifications list
   */
  notifications?: NotificationItem[];
  /**
   * Notification click handler
   */
  onNotificationClick?: (notification: NotificationItem) => void;
  /**
   * Mark all as read handler
   */
  onMarkAllAsRead?: () => void;
  /**
   * User name
   */
  userName?: string;
  /**
   * User email or role
   */
  userSubtitle?: string;
  /**
   * User avatar image URL
   */
  userAvatar?: string;
  /**
   * User menu items
   */
  userMenuItems?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    variant?: 'default' | 'danger';
    divider?: boolean;
  }>;
  /**
   * Custom actions (buttons, search, etc.)
   */
  actions?: React.ReactNode;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Whether header is sticky
   * @default true
   */
  sticky?: boolean;
}


import { BellIcon, MenuIcon, ChevronDownIcon } from '../../icons/IconComponents';

/**
 * NotificationPanel component
 */
const NotificationPanel = React.forwardRef<
  HTMLDivElement,
  {
    notifications: NotificationItem[];
    onNotificationClick?: (notification: NotificationItem) => void;
    onMarkAllAsRead?: () => void;
    onClose: () => void;
  }
>(({ notifications, onNotificationClick, onMarkAllAsRead, onClose }, ref) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div ref={ref} className="lxs-header-notifications-panel">
      <div className="lxs-header-notifications-header">
        <Flex justify="between" align="center">
          <Typography variant="subtitle2" noMargin>
            Notifications
          </Typography>
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              className="lxs-header-notifications-mark-read"
              onClick={() => {
                onMarkAllAsRead();
                onClose();
              }}
            >
              Mark all as read
            </button>
          )}
        </Flex>
      </div>
      <div className="lxs-header-notifications-list">
        {notifications.length === 0 ? (
          <div className="lxs-header-notifications-empty">
            <BellIcon />
            <Typography variant="body2" textColor="var(--color-neutral-500)" noMargin>
              No notifications
            </Typography>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`lxs-header-notification-item ${!notification.read ? 'lxs-header-notification-item--unread' : ''} ${notification.type ? `lxs-header-notification-item--${notification.type}` : ''}`}
              onClick={() => {
                onNotificationClick?.(notification);
                onClose();
              }}
            >
              {notification.icon && (
                <div className="lxs-header-notification-icon">{notification.icon}</div>
              )}
              <div className="lxs-header-notification-content">
                <Typography
                  variant="body2"
                  noMargin
                  style={{ fontWeight: notification.read ? 400 : 600 }}
                >
                  {notification.title}
                </Typography>
                {notification.description && (
                  <Typography variant="caption" textColor="var(--color-neutral-600)" noMargin>
                    {notification.description}
                  </Typography>
                )}
                <Typography variant="caption" textColor="var(--color-neutral-500)" noMargin style={{ marginTop: '4px' }}>
                  {notification.time}
                </Typography>
              </div>
              {!notification.read && <div className="lxs-header-notification-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

NotificationPanel.displayName = 'NotificationPanel';

/**
 * Header component - Professional admin panel header with notifications and user menu
 *
 * @example
 * Basic header
 * ```tsx
 * <Header
 *   title="Admin Dashboard"
 *   userName="John Doe"
 *   userSubtitle="Admin"
 *   onToggleSidebar={() => setCollapsed(!collapsed)}
 * />
 * ```
 *
 * @example
 * With notifications
 * ```tsx
 * <Header
 *   title="Dashboard"
 *   notifications={[
 *     { id: '1', title: 'New order received', time: '2 min ago', read: false },
 *     { id: '2', title: 'User registered', time: '1 hour ago', read: true }
 *   ]}
 *   userName="John Doe"
 *   userMenuItems={[
 *     { label: 'Profile', icon: <UserIcon /> },
 *     { label: 'Settings', icon: <SettingsIcon /> },
 *     { label: 'Logout', icon: <LogoutIcon />, variant: 'danger' }
 *   ]}
 * />
 * ```
 */
const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  (
    {
      logo,
      title,
      onToggleSidebar,
      showToggle = true,
      notifications = [],
      onNotificationClick,
      onMarkAllAsRead,
      userName,
      userSubtitle,
      userAvatar,
      userMenuItems = [],
      actions,
      className = '',
      sticky = true,
    },
    ref
  ) => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationsPanelRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Close dropdowns on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          notificationsRef.current &&
          !notificationsRef.current.contains(event.target as Node) &&
          notificationsPanelRef.current &&
          !notificationsPanelRef.current.contains(event.target as Node)
        ) {
          setNotificationsOpen(false);
        }
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
          setUserMenuOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const headerClasses = ['lxs-header', sticky && 'lxs-header--sticky', className]
      .filter(Boolean)
      .join(' ');

    return (
      <header ref={ref} className={headerClasses}>
        <Flex align="center" gap={16} style={{ flex: 1 }}>
          {/* Toggle Button */}
          {showToggle && onToggleSidebar && (
            <button
              className="lxs-header-toggle"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <MenuIcon />
            </button>
          )}

          {/* Logo */}
          {logo && <div className="lxs-header-logo">{logo}</div>}

          {/* Title */}
          {title && (
            <Typography variant="h6" noMargin className="lxs-header-title">
              {title}
            </Typography>
          )}
        </Flex>

        {/* Actions */}
        {actions && <div className="lxs-header-actions">{actions}</div>}

        {/* Right Section */}
        <div className="lxs-header-right">
          {/* Notifications */}
          {notifications && notifications.length > 0 && (
            <div className="lxs-header-notifications" ref={notificationsRef}>
              <button
                className={`lxs-header-icon-button ${notificationsOpen ? 'lxs-header-icon-button--active' : ''}`}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <Badge
                    variant="error"
                    size="sm"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 4px',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </button>
              {notificationsOpen && (
                <NotificationPanel
                  ref={notificationsPanelRef}
                  notifications={notifications}
                  onNotificationClick={onNotificationClick}
                  onMarkAllAsRead={onMarkAllAsRead}
                  onClose={() => setNotificationsOpen(false)}
                />
              )}
            </div>
          )}

          {/* User Menu */}
          {userName && (
            <div className="lxs-header-user-menu" ref={userMenuRef}>
              <button
                className={`lxs-header-user-button ${userMenuOpen ? 'lxs-header-user-button--active' : ''}`}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                <Avatar src={userAvatar} alt={userName} size="sm" />
                {!userAvatar && (
                  <span className="lxs-header-avatar-fallback">
                    {userName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                )}
                <div className="lxs-header-user-info">
                  <Typography variant="body2" noMargin style={{ fontWeight: 600 }}>
                    {userName}
                  </Typography>
                  {userSubtitle && (
                    <Typography variant="caption" textColor="var(--color-neutral-600)" noMargin>
                      {userSubtitle}
                    </Typography>
                  )}
                </div>
                <ChevronDownIcon />
              </button>
              {userMenuOpen && (
                <div className="lxs-header-user-dropdown">
                  <Menu items={userMenuItems} responsive={false} />
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';

export default Header as React.FC<HeaderProps & React.RefAttributes<HTMLElement>>;
export { Header };