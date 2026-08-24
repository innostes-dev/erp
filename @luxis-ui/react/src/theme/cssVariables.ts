import { tokens, Tokens } from './tokens';

import { RadiusSize } from './ThemeProvider';

/**
 * Generates CSS variables from design tokens
 * @param customTokens - Optional custom tokens to use instead of defaults
 * @param globalRadius - Optional global radius setting
 * @returns CSS variable declarations as a string
 */
export function generateCSSVariables(customTokens?: Tokens, globalRadius?: RadiusSize): string {
  const tokensToUse = customTokens || tokens;
  const cssVars: string[] = [];

  // Colors
  Object.entries(tokensToUse.colors).forEach(([colorName, shades]) => {
    if (typeof shades === 'object') {
      Object.entries(shades).forEach(([shade, value]) => {
        cssVars.push(`  --lxs-color-${colorName}-${shade}: ${value};`);
      });
    } else {
      cssVars.push(`  --lxs-color-${colorName}: ${shades};`);
    }
  });

  // Spacing
  Object.entries(tokensToUse.spacing).forEach(([key, value]) => {
    cssVars.push(`  --lxs-spacing-${key}: ${value};`);
  });

  // Typography
  Object.entries(tokensToUse.typography.fontFamily).forEach(([key, value]) => {
    cssVars.push(`  --lxs-font-family-${key}: ${value};`);
  });
  Object.entries(tokensToUse.typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`  --lxs-font-size-${key}: ${value};`);
  });
  Object.entries(tokensToUse.typography.fontWeight).forEach(([key, value]) => {
    cssVars.push(`  --lxs-font-weight-${key}: ${value};`);
  });
  Object.entries(tokensToUse.typography.lineHeight).forEach(([key, value]) => {
    cssVars.push(`  --lxs-line-height-${key}: ${value};`);
  });
  Object.entries(tokensToUse.typography.letterSpacing).forEach(([key, value]) => {
    cssVars.push(`  --lxs-letter-spacing-${key}: ${value};`);
  });

  // Text variants
  Object.entries(tokensToUse.typography.textVariants).forEach(([variant, props]) => {
    Object.entries(props).forEach(([prop, value]) => {
      const propName = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      cssVars.push(`  --lxs-text-${variant}-${propName}: ${value};`);
    });
  });

  // Border radius
  Object.entries(tokensToUse.borderRadius).forEach(([key, value]) => {
    cssVars.push(`  --lxs-radius-${key}: ${value};`);
  });

  // Global radius
  if (globalRadius) {
    const radiusValue = tokensToUse.borderRadius[globalRadius as keyof typeof tokensToUse.borderRadius] || globalRadius;
    cssVars.push(`  --lxs-radius-global: ${radiusValue};`);
  }

  // Shadows
  Object.entries(tokensToUse.shadows).forEach(([key, value]) => {
    cssVars.push(`  --lxs-shadow-${key}: ${value};`);
  });

  // Transitions
  Object.entries(tokensToUse.transitions).forEach(([key, value]) => {
    cssVars.push(`  --lxs-transition-${key}: ${value};`);
  });

  // Z-index
  Object.entries(tokensToUse.zIndex).forEach(([key, value]) => {
    cssVars.push(`  --lxs-z-${key}: ${value};`);
  });

  return cssVars.join('\n');
}

/**
 * Injects CSS variables into the document
 * @param customTokens - Optional custom tokens to use instead of defaults
 * @param globalRadius - Optional global radius setting
 */
export function injectCSSVariables(customTokens?: Tokens, globalRadius?: RadiusSize): void {
  if (typeof document === 'undefined') return;

  const styleId = 'luxis-ui-variables';
  let styleEl = document.getElementById(styleId);

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const cssVariables = generateCSSVariables(customTokens, globalRadius);
  styleEl.textContent = `:root {\n${cssVariables}\n}`;
}
