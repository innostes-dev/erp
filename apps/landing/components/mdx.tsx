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
  GitBranch,
  Layers,
  Package,
  Palette,
  Rocket,
  Server,
  Terminal,
  Wind,
} from 'lucide-react';
import { Preview, PreviewRow, UsageGrid } from './docs/preview';
import { ComponentPreview } from './docs/component-preview';
import { ApiTable } from './docs/api-table';
import { PageTabs } from './docs/page-tabs';
import { ButtonPlayground } from './docs/button-playground';
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
    ComponentPreview,
    ApiTable,
    Preview,
    PreviewRow,
    UsageGrid,
    PageTabs,
    ButtonPlayground,
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
    GitBranch,
    Layers,
    Package,
    Palette,
    Rocket,
    Server,
    Terminal,
    Wind,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
