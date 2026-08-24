"use client";

import React, { useMemo, useState } from 'react';
import { Flex } from '../Flex';
import { Typography } from '../Typography';
import './SideMenu.css';

/**
 * Preset theme names for the SideMenu.
 *
 * - `light`         – Clean neutral light background (default)
 * - `dark`          – Dark neutral (charcoal) background
 * - `dark-primary`  – Deep primary-colored background
 * - `light-primary` – Light background with primary accent
 * - `gradient`      – Purple-to-indigo gradient background
 * - `midnight`      – Deep navy/dark-blue enterprise theme
 * - `slate`         – Professional cool-gray theme
 * - `emerald`       – Rich dark-green enterprise theme
 * - `custom`        – User-provided colors via `customTheme`
 */
export type SideMenuTheme =
  | 'light'
  | 'dark'
  | 'dark-primary'
  | 'light-primary'
  | 'gradient'
  | 'midnight'
  | 'slate'
  | 'emerald'
  | 'custom';

/**
 * Custom theme configuration for the SideMenu.
 * Only used when `theme="custom"`.
 */
export interface SideMenuCustomTheme {
  /** Sidebar background color */
  sidebarBg: string;
  /** Default text color for menu items */
  textColor: string;
  /** Background color of the active/selected item */
  activeItemBg: string;
  /** Text color of the active/selected item */
  activeItemTextColor: string;
  /** Background color on hover (optional, defaults to a subtle shift of sidebarBg) */
  hoverItemBg?: string;
  /** Text color on hover */
  hoverItemTextColor?: string;
  /** Icon color (default state) */
  iconColor?: string;
  /** Icon color when active */
  activeIconColor?: string;
  /** Border color for header / footer separators */
  borderColor?: string;
  /** Submenu background */
  submenuBg?: string;
  /** Badge background */
  badgeBg?: string;
  /** Badge text color */
  badgeColor?: string;
}

export interface SideMenuItemProps {
  /**
   * Menu item label
   */
  label: string;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Icon to display before label
   */
  icon?: React.ReactNode;
  /**
   * Whether the item is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the item is active/selected
   * @default false
   */
  active?: boolean;
  /**
   * Submenu items for nested navigation
   */
  items?: SideMenuItemProps[];
  /**
   * Badge content (number or text)
   */
  badge?: string | number;
  /**
   * Custom href for links
   */
  href?: string;
}

export interface SideMenuProps {
  /**
   * Menu items configuration
   */
  items: SideMenuItemProps[];
  /**
   * Whether the sidebar is collapsed
   * @default false
   */
  collapsed?: boolean;
  /**
   * Collapse toggle handler
   */
  onCollapseToggle?: (collapsed: boolean) => void;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Sidebar width when expanded
   * @default '260px'
   */
  width?: string | number;
  /**
   * Sidebar width when collapsed
   * @default '80px'
   */
  collapsedWidth?: string | number;
  /**
   * Header content (logo, title)
   */
  header?: React.ReactNode;
  /**
   * Footer content
   */
  footer?: React.ReactNode;
  /**
   * Custom padding for header
   * @default '20px 16px'
   */
  headerPadding?: string | number;
  /**
   * Custom padding for footer
   * @default '20px 16px'
   */
  footerPadding?: string | number;
  /**
   * Colour theme preset for the sidebar.
   * Use `'custom'` together with `customTheme` to supply your own palette.
   * @default 'light'
   */
  theme?: SideMenuTheme;
  /**
   * Custom colour values – only applied when `theme="custom"`.
   */
  customTheme?: SideMenuCustomTheme;
}

// Chevron icon for submenu expansion
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className={`lxs-sidemenu-chevron ${isOpen ? 'lxs-sidemenu-chevron--open' : ''}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

/**
 * SideMenuItem component - Individual sidebar menu item with submenu support
 */
export const SideMenuItem = React.forwardRef<
  HTMLDivElement,
  SideMenuItemProps & { collapsed?: boolean; level?: number }
>(
  (
    {
      label,
      onClick,
      icon,
      disabled = false,
      active = false,
      items,
      badge,
      href,
      collapsed = false,
      level = 0,
    },
    ref
  ) => {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const hasSubmenu = items && items.length > 0;

    const handleClick = (e: React.MouseEvent) => {
      if (disabled) return;

      if (hasSubmenu) {
        e.preventDefault();
        setIsSubmenuOpen(!isSubmenuOpen);
      } else if (onClick) {
        e.preventDefault();
        onClick();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (hasSubmenu) {
          setIsSubmenuOpen(!isSubmenuOpen);
        } else {
          onClick?.();
        }
      }
    };

    const content = (
      <>
        <Flex align="center" gap={collapsed ? 0 : 12} style={{ flex: 1, minWidth: 0 }}>
          {icon && <span className="lxs-sidemenu-item-icon">{icon}</span>}
          {!collapsed && (
            <>
              <Typography
                variant="body2"
                noMargin
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Typography>
              {badge && <span className="lxs-sidemenu-item-badge">{badge}</span>}
              {hasSubmenu && <ChevronIcon isOpen={isSubmenuOpen} />}
            </>
          )}
        </Flex>
      </>
    );

    const itemClasses = [
      'lxs-sidemenu-item',
      active && 'lxs-sidemenu-item--active',
      disabled && 'lxs-sidemenu-item--disabled',
      hasSubmenu && 'lxs-sidemenu-item--has-submenu',
      collapsed && 'lxs-sidemenu-item--collapsed',
    ]
      .filter(Boolean)
      .join(' ');

    const ItemWrapper = href ? 'a' : 'div';

    return (
      <>
        <ItemWrapper
          ref={ref as any}
          className={itemClasses}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="menuitem"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          aria-expanded={hasSubmenu ? isSubmenuOpen : undefined}
          href={href}
          title={collapsed ? label : undefined}
          data-label={collapsed ? label : undefined}
        >
          {content}
        </ItemWrapper>
        {hasSubmenu && isSubmenuOpen && !collapsed && (
          <div className="lxs-sidemenu-submenu">
            {items.map((item, index) => (
              <SideMenuItem key={index} {...item} collapsed={collapsed} level={level + 1} />
            ))}
          </div>
        )}
      </>
    );
  }
);

SideMenuItem.displayName = 'SideMenuItem';

/**
 * SideMenu component - Professional sidebar navigation for admin panels
 *
 * @example
 * Basic sidebar menu
 * ```tsx
 * <SideMenu
 *   items={[
 *     { label: 'Dashboard', icon: <DashboardIcon />, active: true },
 *     {
 *       label: 'Products',
 *       icon: <ProductIcon />,
 *       items: [
 *         { label: 'All Products', onClick: () => {} },
 *         { label: 'Categories', onClick: () => {} }
 *       ]
 *     },
 *     { label: 'Settings', icon: <SettingsIcon />, onClick: () => {} }
 *   ]}
 * />
 * ```
 *
 * @example
 * Collapsible sidebar with header
 * ```tsx
 * <SideMenu
 *   collapsed={isCollapsed}
 *   onCollapseToggle={setIsCollapsed}
 *   header={<Logo />}
 *   items={menuItems}
 * />
 * ```
 */
/** Maps a preset theme name to its CSS modifier class. */
const THEME_CLASS_MAP: Record<Exclude<SideMenuTheme, 'custom'>, string> = {
  light: '',                          // default – no extra class needed
  dark: 'lxs-sidemenu--dark',
  'dark-primary': 'lxs-sidemenu--dark-primary',
  'light-primary': 'lxs-sidemenu--light-primary',
  gradient: 'lxs-sidemenu--gradient',
  midnight: 'lxs-sidemenu--midnight',
  slate: 'lxs-sidemenu--slate',
  emerald: 'lxs-sidemenu--emerald',
};

/** Converts a `SideMenuCustomTheme` object into CSS custom-property overrides. */
function buildCustomThemeVars(ct: SideMenuCustomTheme): React.CSSProperties {
  return {
    '--lxs-sidemenu-bg': ct.sidebarBg,
    '--lxs-sidemenu-item-color': ct.textColor,
    '--lxs-sidemenu-item-active-bg': ct.activeItemBg,
    '--lxs-sidemenu-item-active-color': ct.activeItemTextColor,
    '--lxs-sidemenu-item-hover-bg': ct.hoverItemBg ?? ct.activeItemBg + '33',
    '--lxs-sidemenu-item-icon-color': ct.iconColor ?? ct.textColor,
    '--lxs-sidemenu-item-icon-active-color': ct.activeIconColor ?? ct.activeItemTextColor,
    '--lxs-sidemenu-header-border': ct.borderColor ?? 'rgba(255,255,255,0.1)',
    '--lxs-sidemenu-footer-border': ct.borderColor ?? 'rgba(255,255,255,0.1)',
    '--lxs-sidemenu-submenu-bg': ct.submenuBg ?? 'rgba(0,0,0,0.06)',
    '--lxs-sidemenu-badge-bg': ct.badgeBg ?? '#ef4444',
    '--lxs-sidemenu-badge-color': ct.badgeColor ?? '#ffffff',
  } as React.CSSProperties;
}

const SideMenu = React.forwardRef<HTMLDivElement, SideMenuProps>(
  (
    {
      items,
      collapsed = false,
      onCollapseToggle: _onCollapseToggle,
      className = '',
      width = '260px',
      collapsedWidth = '80px',
      header,
      footer,
      headerPadding,
      footerPadding,
      theme = 'light',
      customTheme,
    },
    ref
  ) => {
    const sidebarWidth = collapsed
      ? typeof collapsedWidth === 'number'
        ? `${collapsedWidth}px`
        : collapsedWidth
      : typeof width === 'number'
      ? `${width}px`
      : width;

    const themeClass = theme === 'custom' ? 'lxs-sidemenu--custom' : THEME_CLASS_MAP[theme];

    const sidebarClasses = [
      'lxs-sidemenu',
      collapsed && 'lxs-sidemenu--collapsed',
      themeClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const customVars = useMemo(
      () => (theme === 'custom' && customTheme ? buildCustomThemeVars(customTheme) : {}),
      [theme, customTheme],
    );

    return (
      <aside
        ref={ref}
        className={sidebarClasses}
        style={{ width: sidebarWidth, ...customVars }}
        role="navigation"
      >
        {header && (
          <div
            className="lxs-sidemenu-header"
            style={headerPadding ? { padding: typeof headerPadding === 'number' ? `${headerPadding}px` : headerPadding } : undefined}
          >
            {header}
          </div>
        )}

        <div className="lxs-sidemenu-content">
          {items.map((item, index) => (
            <SideMenuItem key={index} {...item} collapsed={collapsed} />
          ))}
        </div>

        {footer && (
          <div
            className="lxs-sidemenu-footer"
            style={footerPadding ? { padding: typeof footerPadding === 'number' ? `${footerPadding}px` : footerPadding } : undefined}
          >
            {footer}
          </div>
        )}
      </aside>
    );
  }
);

SideMenu.displayName = 'SideMenu';

export default SideMenu as React.FC<SideMenuProps & React.RefAttributes<HTMLDivElement>>;
export { SideMenu };
