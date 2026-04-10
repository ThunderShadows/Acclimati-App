export const Colors = {
  // Brand
  primary:    '#0B2D32',   // deep dark teal
  mid:        '#0D7C82',   // mid teal
  bright:     '#16A896',   // bright teal

  // Backgrounds
  bg:         '#F2F5F8',   // cool light gray
  card:       '#FFFFFF',
  hero:       '#0B2D32',   // dark hero card bg

  // Text
  text:       '#1A2332',
  textMuted:  '#6B7280',
  textLight:  '#94A3B8',
  textOnDark: '#FFFFFF',

  // Borders / separators
  border:     '#E4E8EE',
  separator:  '#F0F3F6',

  // Accent colours
  coral:      '#F06449',
  amber:      '#F59E0B',
  green:      '#10B981',

  // Risk level palette (with border field added)
  risk: {
    none:     { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#22C55E' },
    low:      { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
    moderate: { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA', dot: '#F97316' },
    high:     { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
    severe:   { bg: '#FDF4FF', text: '#6B21A8', border: '#E9D5FF', dot: '#A855F7' },
  },

  // Phase accent (kept for ResultScreen timeline)
  phase: {
    days_before:   '#3B82F6',
    day_of_travel: '#8B5CF6',
    first_3_days:  '#10B981',
    ongoing:       '#6B7280',
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
    xs:  11,
    sm:  13,
    md:  15,
    lg:  17,
    xl:  20,
    xxl: 26,
    xxxl: 32,
  },
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
} as const;
