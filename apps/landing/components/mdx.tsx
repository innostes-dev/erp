import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import type { MDXComponents } from 'mdx/types';
import { Button } from '@innostes/ui';
import {
  Accessibility,
  BookOpen,
  Boxes,
  Cpu,
  GitBranch,
  Layers,
  Package,
  Palette,
  Plug,
  Rocket,
  Server,
  Terminal,
  Wind,
  Workflow,
} from 'lucide-react';
import { Preview, PreviewRow, UsageGrid } from './docs/preview';
import { ComponentPreview } from './docs/component-preview';
import { ApiTable } from './docs/api-table';
import { PageTabs } from './docs/page-tabs';
import { ButtonPlayground } from './docs/button-playground';
import { InputPlayground } from './docs/input-playground';
import { CheckboxPlayground } from './docs/checkbox-playground';
import { SwitchPlayground } from './docs/switch-playground';
import { SelectPlayground } from './docs/select-playground';
import { PropsPlayground } from './docs/props-playground';
import { KeyboardTable } from './docs/keyboard-table';
import { DoDont, Do, Dont } from './docs/do-dont';
import { Anatomy } from './docs/anatomy';
import { StatusBadge } from './docs/status-badge';
import { Since } from './docs/since';
import { CategoryGrid } from './docs/category-grid';
import { TokenReference } from './docs/token-reference';
import { ContrastTable } from './docs/contrast-table';
import { ComponentIndex } from './docs/component-index';
import { HeroDemo } from './docs/hero-demo';
import { ApiEndpoint } from './docs/api-endpoint';
import { ApiPlayground } from './docs/api-playground';
import {
  AsLinkDemo,
  ButtonShowcase,
  DisabledDemo,
  FullWidthDemo,
  IconsDemo,
  LoadingDemo,
  SizesDemo,
  ThemingDemo,
  VariantCards,
} from './docs/button-demos';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Steps,
    Step,
    Tabs,
    Tab,
    TypeTable,
    Files,
    Folder,
    File,
    Button,
    ApiEndpoint,
    ApiPlayground,
    ComponentPreview,
    ApiTable,
    Preview,
    PreviewRow,
    UsageGrid,
    PageTabs,
    ButtonPlayground,
    InputPlayground,
    CheckboxPlayground,
    SwitchPlayground,
    SelectPlayground,
    PropsPlayground,
    KeyboardTable,
    DoDont,
    Do,
    Dont,
    Anatomy,
    StatusBadge,
    Since,
    CategoryGrid,
    TokenReference,
    ContrastTable,
    ComponentIndex,
    HeroDemo,
    ButtonShowcase,
    VariantCards,
    SizesDemo,
    IconsDemo,
    LoadingDemo,
    DisabledDemo,
    FullWidthDemo,
    AsLinkDemo,
    ThemingDemo,
    Accessibility,
    BookOpen,
    Boxes,
    Cpu,
    GitBranch,
    Layers,
    Package,
    Palette,
    Plug,
    Rocket,
    Server,
    Terminal,
    Wind,
    Workflow,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
