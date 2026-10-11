import { useColorScheme } from 'react-native';

/**
 * iOS-style grouped surfaces with a maroon tint. Light and dark palettes share keys, so components
 * read `useTheme().colors` and never branch on the scheme themselves.
 * The primary user may be 60 and reading in a wedding hall: keep contrast high and type generous.
 */
export type Palette = {
  /** Page background (iOS systemGroupedBackground). */
  bg: string;
  /** Cards, list rows, inputs (secondarySystemGroupedBackground). */
  surface: string;
  /** Pressed rows, placeholders, image wells. */
  surfaceAlt: string;
  /** Raised control on a fill, e.g. the selected segment thumb. */
  elevated: string;
  /** Neutral fill behind chips, segmented controls, search fields. */
  fill: string;
  separator: string;
  text: string;
  textMuted: string;
  textTertiary: string;
  /** Filled-button background; always carries `onPrimary` text. */
  primary: string;
  onPrimary: string;
  /** Text on a bright semantic fill (gave/received thumbs): white in light mode, black in dark. */
  onTinted: string;
  /** Tint for text, icons and links. Lighter than `primary` in dark mode so it stays legible. */
  tint: string;
  /** Translucent tint for "tinted" buttons and selected states. */
  tintFill: string;
  accent: string;
  accentFill: string;
  gave: string;
  received: string;
  danger: string;
  shadow: string;
};

export const lightColors: Palette = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceAlt: '#E5E5EA',
  elevated: '#FFFFFF',
  fill: 'rgba(118,118,128,0.12)',
  separator: 'rgba(60,60,67,0.22)',
  text: '#1C1C1E',
  textMuted: '#6C6C70',
  textTertiary: '#A1A1A6',
  primary: '#8E1B3A',
  onPrimary: '#FFFFFF',
  onTinted: '#FFFFFF',
  tint: '#8E1B3A',
  tintFill: 'rgba(142,27,58,0.10)',
  accent: '#B25E09',
  accentFill: '#FFF3E0',
  gave: '#C2410C',
  received: '#1F7A4D',
  danger: '#D70015',
  shadow: '#000000',
};

export const darkColors: Palette = {
  bg: '#000000',
  surface: '#1C1C1E',
  surfaceAlt: '#2C2C2E',
  elevated: '#636366',
  fill: 'rgba(118,118,128,0.24)',
  separator: 'rgba(84,84,88,0.65)',
  text: '#FFFFFF',
  textMuted: '#AEAEB2',
  textTertiary: '#6E6E73',
  primary: '#B0284F',
  onPrimary: '#FFFFFF',
  onTinted: '#000000',
  tint: '#FF7A9C',
  tintFill: 'rgba(255,122,156,0.16)',
  accent: '#FFB347',
  accentFill: 'rgba(255,179,71,0.14)',
  gave: '#FF8A65',
  received: '#4ADE80',
  danger: '#FF453A',
  shadow: '#000000',
};

export function useTheme(): { colors: Palette; dark: boolean } {
  const dark = useColorScheme() === 'dark';
  return { colors: dark ? darkColors : lightColors, dark };
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

/** iOS text styles, nudged up a size for older eyes. Colour-free: pair with `colors.*` or use `<Txt>`. */
export const font = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.4 },
  title: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 17 },
  bodyStrong: { fontSize: 17, fontWeight: '600' as const },
  callout: { fontSize: 16 },
  subhead: { fontSize: 15 },
  caption: { fontSize: 14 },
  footnote: { fontSize: 13 },
  /** Grouped-section header, sits above a card. */
  label: { fontSize: 13, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  money: { fontSize: 22, fontWeight: '700' as const, fontVariant: ['tabular-nums' as const] },
  bigMoney: { fontSize: 40, fontWeight: '700' as const, fontVariant: ['tabular-nums' as const] },
};

export const hit = { top: 8, bottom: 8, left: 8, right: 8 };
