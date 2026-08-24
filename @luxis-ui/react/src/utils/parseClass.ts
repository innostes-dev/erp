// parseClass.ts
// Utility to parse Tailwind-like utility classes (e.g., mb-2, p-4, mb-[2px])
// and inject them into a <style> tag at runtime.
// Supports both standard scale values (mb-2) and arbitrary values (mb-[2px])
// Can be used with HOC (withParsedClasses) or globally for plain HTML

const STYLE_TAG_ID = "dynamic-styles";
let observer: MutationObserver | null = null;
let isInitialized = false;

// Ensure we have a single <style> tag in <head>
function getStyleTag(): HTMLStyleElement {
  let styleTag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = STYLE_TAG_ID;
    document.head.appendChild(styleTag);
  }
  return styleTag;
}

// Cache to avoid duplicate injections
// Cache to avoid duplicate injections
// We use a Set to track injected CSS rules for standard utility classes
// This is moved to the top to avoid duplicate declarations
const injectedRules = new Set<string>();
const parseCache = new Map<string, string>();

// Spacing scale mapping (similar to Tailwind's default scale)
// Spacing scale mapping (similar to Tailwind's default scale)
const spacingScale: Record<string, string> = {
  '0': '0',
  '1': '0.25rem', // 4px
  '2': '0.5rem',  // 8px  
  '3': '0.75rem', // 12px
  '4': '1rem',    // 16px
  '5': '1.25rem', // 20px
  '6': '1.5rem',  // 24px
  '8': '2rem',    // 32px
  '10': '2.5rem', // 40px
  '12': '3rem',   // 48px
  '16': '4rem',   // 64px
  '20': '5rem',   // 80px
  '24': '6rem',   // 96px
  '32': '8rem',   // 128px
  '40': '10rem',  // 160px
  '48': '12rem',  // 192px
  '56': '14rem',  // 224px
  '64': '16rem',  // 256px
  'px': '1px',
  '0.5': '0.125rem', // 2px
  '1.5': '0.375rem', // 6px
  '2.5': '0.625rem', // 10px
  '3.5': '0.875rem', // 14px
  'full': '100%',
  'auto': 'auto',
  'screen': '100vh',
  'xs': '0.25rem',
  'sm': '0.5rem',
  'md': '1rem',
  'lg': '1.5rem',
  'xl': '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

// Color scale mapping
const colorScale: Record<string, string> = {
  // Brand Colors
  'primary': 'var(--lxs-color-primary-600)',
  'primary-hover': 'var(--lxs-color-primary-700)',
  'secondary': 'var(--lxs-color-secondary-600)',
  'secondary-hover': 'var(--lxs-color-secondary-700)',

  // Status Colors
  'success': 'var(--lxs-color-success-600)',
  'warning': 'var(--lxs-color-warning-600)',
  'error': 'var(--lxs-color-error-600)',
  'danger': 'var(--lxs-color-error-600)', // Alias for error
  'info': 'var(--lxs-color-info-600)',

  // Base Colors
  'white': 'var(--lxs-color-white)',
  'black': 'var(--lxs-color-black)',
  'transparent': 'transparent',
  'current': 'currentColor',
  'inherit': 'inherit',

  // Semantic / UI Colors
  'neutral': 'var(--lxs-color-neutral-600)',
  'surface': 'var(--lxs-color-surface-paper)',
  'border': 'var(--lxs-color-border-default)',

  // Text Semantics (from base.css)
  'main': 'var(--lxs-text-primary)',      // Main text color
  'muted': 'var(--lxs-text-secondary)',   // Secondary text color
  'disabled': 'var(--lxs-text-disabled)', // Disabled text state
};

// Property mapping
const propertyMap: Record<string, string> = {
  // Margin
  m: "margin",
  mt: "margin-top",
  mr: "margin-right",
  mb: "margin-bottom",
  ml: "margin-left",
  mx: "margin-left, margin-right", // Will be handled specially
  my: "margin-top, margin-bottom", // Will be handled specially
  // Padding
  p: "padding",
  pt: "padding-top",
  pr: "padding-right",
  pb: "padding-bottom",
  pl: "padding-left",
  px: "padding-left, padding-right", // Will be handled specially
  py: "padding-top, padding-bottom", // Will be handled specially
  // Width/Height
  w: "width",
  h: "height",
  // Typography
  fs: "font-size",
  fw: "font-weight",
  lh: "line-height",
  ls: "letter-spacing",
  // Gap
  gap: "gap",
  // Colors
  bg: "background-color",
  text: "color",
  border: "border-color",
};

// Properties that use the color scale
const colorProperties = new Set(['bg', 'text', 'border']);

// Caches are now declared at the top of the file

export function parseClass(className: string): string {
  // Check cache first
  if (parseCache.has(className)) {
    return parseCache.get(className) as string;
  }

  // Simple optimization: if no hyphen, it can't be one of our utility classes
  if (!className.includes('-')) {
    parseCache.set(className, className);
    return className;
  }

  let result = className;

  // Parse prefixes (e.g., hover:)
  const prefixMatch = className.match(/^((?:[a-z]+:)+)(.+)$/);
  const prefixes = prefixMatch ? prefixMatch[1].split(':').filter(Boolean) : [];
  const baseClass = prefixMatch ? prefixMatch[2] : className;

  // Safe class name for CSS (escape special characters like :, [], %, ., #)
  // e.g., mb-[30px] -> mb-\[30px\]
  const safeClassName = className.replace(/[:[\]%.,#()]/g, '\\$&');

  // Match arbitrary value patterns like mb-[2px]
  let match = baseClass.match(/^([a-z]+)-\[(.+)\]$/);

  if (match) {
    const property = match[1];
    const value = match[2];

    const cssProp = propertyMap[property];
    if (cssProp) {
      // We use the original full class name as the identifier but escaped
      result = className;

      let cssContent: string;

      // Handle special cases for x/y axis properties
      if (property === 'mx') {
        cssContent = `margin-left: ${value}; margin-right: ${value};`;
      } else if (property === 'my') {
        cssContent = `margin-top: ${value}; margin-bottom: ${value};`;
      } else if (property === 'px') {
        cssContent = `padding-left: ${value}; padding-right: ${value};`;
      } else if (property === 'py') {
        cssContent = `padding-top: ${value}; padding-bottom: ${value};`;
      } else {
        cssContent = `${cssProp}: ${value};`;
      }

      let selector = `.${safeClassName}`;

      // Apply prefixes
      if (prefixes.includes('hover')) selector += ':hover';
      if (prefixes.includes('focus')) selector += ':focus';
      if (prefixes.includes('active')) selector += ':active';
      if (prefixes.includes('dark')) selector = `[data-theme='dark'] ${selector}`;

      const cssRule = `${selector} { ${cssContent} }`;

      if (!injectedRules.has(cssRule)) {
        try {
          const styleTag = getStyleTag();
          styleTag.appendChild(document.createTextNode(cssRule));
          injectedRules.add(cssRule);
        } catch (e) {
          console.warn("Failed to inject dynamic style rule:", cssRule);
        }
      }
    }
  } else {
    // Then try to match standard Tailwind-like patterns like mb-2, p-4, bg-primary
    match = baseClass.match(/^([a-z]+)-(.+)$/);
    if (match) {
      const property = match[1];
      const scaleValue = match[2];

      const cssProp = propertyMap[property];

      // Determine which scale to use
      let mappedValue: string | undefined;
      if (colorProperties.has(property)) {
        mappedValue = colorScale[scaleValue];
      } else {
        mappedValue = spacingScale[scaleValue];
      }

      if (cssProp && mappedValue) {
        result = className;

        let cssContent: string;

        // Handle special cases
        if (property === 'mx') {
          cssContent = `margin-left: ${mappedValue}; margin-right: ${mappedValue};`;
        } else if (property === 'my') {
          cssContent = `margin-top: ${mappedValue}; margin-bottom: ${mappedValue};`;
        } else if (property === 'px') {
          cssContent = `padding-left: ${mappedValue}; padding-right: ${mappedValue};`;
        } else if (property === 'py') {
          cssContent = `padding-top: ${mappedValue}; padding-bottom: ${mappedValue};`;
        } else {
          cssContent = `${cssProp}: ${mappedValue};`;
        }

        let selector = `.${safeClassName}`;

        // Apply prefixes
        if (prefixes.includes('hover')) selector += ':hover';
        if (prefixes.includes('focus')) selector += ':focus';
        if (prefixes.includes('active')) selector += ':active';
        if (prefixes.includes('dark')) selector = `[data-theme='dark'] ${selector}`;

        const cssRule = `${selector} { ${cssContent} }`;

        if (!injectedRules.has(cssRule)) {
          try {
            const styleTag = getStyleTag();
            styleTag.appendChild(document.createTextNode(cssRule));
            injectedRules.add(cssRule);
          } catch (e) {
            console.warn("Failed to inject dynamic style rule:", cssRule);
          }
        }
      }
    }
  }

  parseCache.set(className, result);
  return result;
}

// Process all classes on an element
function processElement(element: Element): void {
  if (!element.classList || element.classList.length === 0) return;

  const originalClasses = Array.from(element.classList);
  const processedClasses = originalClasses.map(cls => parseClass(cls));

  // Only update if there are changes
  if (processedClasses.some((cls, i) => cls !== originalClasses[i])) {
    element.className = processedClasses.join(' ');
  }
}

// Process all elements in the document
function processAllElements(): void {
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => processElement(element));
}

// Initialize global style processing
export function initGlobalStyles(): void {
  if (isInitialized) return;

  // Process existing elements
  if (document.body) {
    processAllElements();
  }

  // Set up MutationObserver to watch for new elements and class changes
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Handle added nodes
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            processElement(node as Element);
            // Also process children
            (node as Element).querySelectorAll('*').forEach(child => processElement(child));
          }
        });
      }
      // Handle className attribute changes
      else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        processElement(mutation.target as Element);
      }
    });
  });

  // Start observing
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  isInitialized = true;
}

// Cleanup function
export function cleanupGlobalStyles(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  isInitialized = false;
}

// Note: Global styles are automatically initialized by ThemeProvider.
// If you're not using ThemeProvider, you can manually call initGlobalStyles().

/**
 * Helper to generate spacing utility class from a value.
 * Handles both scale keys (e.g. 'md', '4') and arbitrary values (e.g. '30px').
 * @param prefix Property prefix, e.g. 'mb', 'p', 'mt'
 * @param value The value to apply
 */
export function getSpacingUtilityClass(prefix: string, value?: string | number): string {
  if (value === undefined || value === null || value === '') return '';

  const stringValue = String(value);

  // If it exists in the scale, use standard syntax
  if (Object.prototype.hasOwnProperty.call(spacingScale, stringValue)) {
    return `${prefix}-${stringValue}`;
  }

  // Otherwise use arbitrary value syntax
  return `${prefix}-[${stringValue}]`;
}