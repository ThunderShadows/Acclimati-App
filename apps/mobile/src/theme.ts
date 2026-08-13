export const Colors = {
  // Brand
  primary:    '#0B2D32',   // deep dark teal
  mid:        '#0D7C82',   // mid teal
  bright:     '#16A896',   // bright teal
  tealSoft:   '#D6EBE8',   // soft teal tint

  // Backgrounds (warm off-white light mode)
  bg:         '#F6F3EC',   // warm off-white
  surface:    '#FFFFFF',   // pure white card surface
  surface2:   '#EFEBE2',   // secondary surface

  // Legacy aliases
  card:       '#FFFFFF',
  hero:       '#0B2D32',   // dark hero card bg

  // Text
  ink:        '#0B1F22',   // near-black
  inkSoft:    '#4C5C5E',   // medium grey-teal
  inkFaint:   '#8A9699',   // light grey
  text:       '#0B1F22',
  textMuted:  '#4C5C5E',
  textLight:  '#8A9699',
  textOnDark: '#F6F3EC',

  // Borders
  line:       '#E4DED1',   // warm border
  border:     '#E4DED1',
  separator:  '#EFEBE2',

  // Accent colours
  coral:      '#E26D5C',
  amber:      '#E9A84D',
  sand:       '#EADFCB',

  // Legacy accent
  green:      '#2E8266',

  // Risk level palette (matches design)
  risk: {
    none:     { bg: '#D7ECDF', text: '#2E8266', border: '#9DCFAE', dot: '#2E8266' },
    low:      { bg: '#F2E6B7', text: '#7A6416', border: '#D9BE5E', dot: '#7A6416' },
    moderate: { bg: '#F6D9B8', text: '#B06528', border: '#E2A76D', dot: '#B06528' },
    high:     { bg: '#F5C9BF', text: '#B0362B', border: '#E28071', dot: '#B0362B' },
    severe:   { bg: '#E3CEED', text: '#6B3A8F', border: '#B88CCE', dot: '#6B3A8F' },
  },

  phase: {
    days_before:   '#0D7C82',
    day_of_travel: '#E26D5C',
    first_3_days:  '#2E8266',
    ongoing:       '#8A9699',
  },
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
} as const;

export const Font = {
  size: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  26,
    xxxl: 32,
  },
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
} as const;
