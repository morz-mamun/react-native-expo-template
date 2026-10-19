import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards accessibility when rebranding: every text/background token pair in src/global.css must
 * meet WCAG AA (4.5:1) in BOTH themes. Change a color that breaks contrast → this test fails.
 */
const css = readFileSync(join(__dirname, '../../../global.css'), 'utf8');

function tokens(variant: 'light' | 'dark'): Record<string, string> {
  const block = css.match(new RegExp(`@variant ${variant} \\{([\\s\\S]*?)\\n\\s*\\}`))?.[1];
  if (!block)
    throw new Error(`@variant ${variant} block not found in global.css`);
  return Object.fromEntries([...block.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [name!, hex!]));
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const WCAG_AA = 4.5;

describe.each(['light', 'dark'] as const)('%s theme contrast', (variant) => {
  const t = tokens(variant);

  const foregroundPairs = Object.keys(t)
    .filter(name => name.endsWith('-foreground') && name !== 'muted-foreground')
    .map(name => [name, name.replace(/-foreground$/, '')] as const);

  // Text tokens commonly placed directly on surfaces.
  const textOnSurfaces = ['foreground', 'muted-foreground', 'destructive'].flatMap(text =>
    ['background', 'card', 'muted'].map(surface => [text, surface] as const));

  it('defines the core tokens', () => {
    for (const name of ['background', 'foreground', 'primary', 'primary-foreground', 'muted-foreground', 'border'])
      expect(t).toHaveProperty(name);
  });

  it.each([...foregroundPairs, ...textOnSurfaces])('%s on %s ≥ 4.5:1', (text, surface) => {
    expect(t[text]).toBeDefined();
    expect(t[surface]).toBeDefined();
    expect(contrast(t[text]!, t[surface]!)).toBeGreaterThanOrEqual(WCAG_AA);
  });
});
