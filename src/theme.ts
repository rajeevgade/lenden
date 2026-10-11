/** Warm, high-contrast palette with generous sizes — the primary user may be 60 and reading in a wedding hall. */
export const colors = {
  bg: '#FBF6EE',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EADB',
  border: '#E6DCC9',
  text: '#2A1B12',
  textMuted: '#7A6A5C',
  primary: '#8E1B3A', // deep maroon
  primaryText: '#FFFFFF',
  accent: '#D98324', // saffron
  gave: '#B4462B', // what left the house
  received: '#2E7D5B', // what came in
  danger: '#B3261E',
  chipBg: '#F1E7D6',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

export const font = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 17, color: colors.text },
  bodyStrong: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 14, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600' as const, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.6 },
  money: { fontSize: 22, fontWeight: '700' as const, fontVariant: ['tabular-nums' as const] },
  bigMoney: { fontSize: 40, fontWeight: '700' as const, fontVariant: ['tabular-nums' as const] },
};

export const hit = { top: 8, bottom: 8, left: 8, right: 8 };
