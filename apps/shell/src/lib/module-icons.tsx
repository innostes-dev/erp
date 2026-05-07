import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  BarChart2,
  Home,
  FileText,
  Lightbulb,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';

export type IconComponent = ComponentType<LucideProps>;

// Module icons — keyed by module id
export const MODULE_ICONS: Record<string, IconComponent> = {
  analytics: BarChart2,
};

// Nav item icons — keyed by iconId in navItems
export const NAV_ICONS: Record<string, IconComponent> = {
  home: Home,
  document: FileText,
  lightbulb: Lightbulb,
  cog: Settings,
  chart: BarChart2,
};

// Named re-exports for direct use
export {
  BarChart2 as BarChartIcon,
  Home as HomeIcon,
  FileText as DocumentIcon,
  Lightbulb as LightbulbIcon,
  Settings as CogIcon,
  Search as SearchIcon,
  Bell as BellIcon,
  ChevronDown as ChevronDownIcon,
  ArrowRight as ArrowRightIcon,
  LayoutGrid as WaffleIcon,
};
