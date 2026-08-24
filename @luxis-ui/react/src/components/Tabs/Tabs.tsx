"use client";

import React, { ReactNode, createContext, forwardRef, useContext, useState } from 'react';
import { withParsedClasses } from '../../hoc/withParsedClasses';
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons';
import { Size } from '../../theme';
import './Tabs.css';

// --- Types ---

export type TabsVariant = 'line' | 'enclosed' | 'soft-rounded' | 'solid-rounded' | 'segmented';
export type TabsOrientation = 'horizontal' | 'vertical';

interface TabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  variant: TabsVariant;
  orientation: TabsOrientation;
  size: Size;
  isLazy?: boolean;
}

// --- Context ---

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs sub-components must be used within a Tabs component');
  }
  return context;
};

// --- Components ---

// 1. Tabs (Container)

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * The initial active tab value (uncontrolled mode)
   */
  defaultValue?: string;
  /**
   * The active tab value (controlled mode)
   */
  value?: string;
  /**
   * Callback when the active tab changes
   */
  onChange?: (value: string) => void;
  /**
   * Visual style of the tabs
   * @default 'line'
   */
  variant?: TabsVariant;
  /**
   * Orientation of the tabs
   * @default 'horizontal'
   */
  orientation?: TabsOrientation;
  /**
   * Size of the tabs
   * @default 'md'
   */
  size?: Size;
  /**
   * Whether to lazy mount tab panels
   * @default false
   */
  isLazy?: boolean;
  children: ReactNode;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      children,
      defaultValue,
      value,
      onChange,
      variant = 'line',
      orientation = 'horizontal',
      size = 'md',
      isLazy = false,
      className,
      ...props
    },
    ref
  ) => {
    // Determine if controlled or uncontrolled
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue || '');

    const activeValue = isControlled ? value : internalValue;

    const handleChange = (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const contextValue: TabsContextValue = {
      activeValue: activeValue || '',
      setActiveValue: handleChange,
      variant,
      orientation,
      size,
      isLazy,
    };

    const rootClasses = [
      'lxs-tabs',
      `lxs-tabs--${variant}`,
      `lxs-tabs--${orientation}`,
      `lxs-tabs--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <TabsContext.Provider value={contextValue}>
        <div ref={ref} className={rootClasses} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

const TabsWithParsedClasses = withParsedClasses(Tabs);

export { TabsWithParsedClasses as Tabs };

// 2. TabList

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /**
   * If true, shows scroll buttons when tabs overflow (horizontal only)
   * @default false
   */
  showScrollControls?: boolean;
}

const TabList = forwardRef<HTMLDivElement, TabListProps>(
  ({ children, className, showScrollControls = false, ...props }, ref) => {
    const { orientation } = useTabsContext();
    const listRef = React.useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    // Merge refs
    const mergedRef = (node: HTMLDivElement) => {
      listRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as any).current = node;
    };

    const checkScroll = () => {
      if (listRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = listRef.current;
        // Show left arrow if we've scrolled right
        setShowLeftArrow(scrollLeft > 0);
        // Show right arrow if there's more content to scroll to
        // Use a small tolerance (1px) for browser rounding differences
        setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
      }
    };

    React.useEffect(() => {
      if (showScrollControls && orientation === 'horizontal') {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
      }
      return undefined;
    }, [showScrollControls, orientation, children]);

    const scroll = (direction: 'left' | 'right') => {
      if (listRef.current) {
        const scrollAmount = 200;
        const newScrollLeft = direction === 'left' 
          ? listRef.current.scrollLeft - scrollAmount 
          : listRef.current.scrollLeft + scrollAmount;
        
        listRef.current.scrollTo({
          left: newScrollLeft,
          behavior: 'smooth'
        });
        // checkScroll will be called by onScroll event
      }
    };

    const isHorizontal = orientation === 'horizontal';
    const showControls = showScrollControls && isHorizontal;

    return (
      <div className={`lxs-tab-list-container ${showControls ? 'lxs-tab-list-container--with-controls' : ''}`}>
        {showControls && (
          <button 
            className={`lxs-tab-scroll-btn lxs-tab-scroll-btn--left ${!showLeftArrow ? 'lxs-tab-scroll-btn--hidden' : ''}`}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            type="button"
            disabled={!showLeftArrow}
            tabIndex={-1}
          >
            <ChevronLeftIcon />
          </button>
        )}
        
        <div
          ref={mergedRef}
          className={`lxs-tab-list ${className || ''} ${showControls ? 'lxs-tab-list--scrollable' : ''}`}
          role="tablist"
          onScroll={showControls ? checkScroll : undefined}
          {...props}
        >
          {children}
        </div>

        {showControls && (
          <button 
            className={`lxs-tab-scroll-btn lxs-tab-scroll-btn--right ${!showRightArrow ? 'lxs-tab-scroll-btn--hidden' : ''}`}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            type="button"
            disabled={!showRightArrow}
            tabIndex={-1}
          >
            <ChevronRightIcon />
          </button>
        )}
      </div>
    );
  }
);

TabList.displayName = 'TabList';

const TabListWithParsedClasses = withParsedClasses(TabList);

export { TabListWithParsedClasses as TabList };

// 3. Tab

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The value of the tab. Must be unique within the Tabs component.
   */
  value: string;
  /**
   * Icon to display before the label
   */
  icon?: ReactNode;
  children?: ReactNode;
}

const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ children, value, icon, className, disabled, onClick, ...props }, ref) => {
    const { activeValue, setActiveValue } = useTabsContext();
    const isSelected = activeValue === value;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        setActiveValue(value);
        onClick?.(e);
      }
    };

    return (
      <button
        ref={ref}
        className={`lxs-tab ${className || ''}`}
        role="tab"
        aria-selected={isSelected}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleClick}
        type="button"
        tabIndex={isSelected ? 0 : -1}
        {...props}
      >
        {icon && <span className="lxs-tab__icon">{icon}</span>}
        {children}
      </button>
    );
  }
);

Tab.displayName = 'Tab';

const TabWithParsedClasses = withParsedClasses(Tab);

export { TabWithParsedClasses as Tab };

// 4. TabPanels

export interface TabPanelsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const TabPanels = forwardRef<HTMLDivElement, TabPanelsProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={`lxs-tab-panels ${className || ''}`} {...props}>
        {children}
      </div>
    );
  }
);

TabPanels.displayName = 'TabPanels';

const TabPanelsWithParsedClasses = withParsedClasses(TabPanels);

export { TabPanelsWithParsedClasses as TabPanels };

// 5. TabPanel

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The value corresponding to the Tab value
   */
  value: string;
  children: ReactNode;
}

const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ children, value, className, ...props }, ref) => {
    const { activeValue, isLazy } = useTabsContext();
    const isSelected = activeValue === value;

    if (!isSelected && isLazy) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={`lxs-tab-panel ${className || ''}`}
        role="tabpanel"
        hidden={!isSelected}
        data-state={isSelected ? 'active' : 'inactive'}
        tabIndex={0}
        {...props}
      >
        {/* If not lazy, we keep it in DOM but hidden. If lazy, we handled null return above */}
        {children}
      </div>
    );
  }
);

TabPanel.displayName = 'TabPanel';

const TabPanelWithParsedClasses = withParsedClasses(TabPanel);

export { TabPanelWithParsedClasses as TabPanel };
