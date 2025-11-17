export const TEXT_COLOR_OPTIONS = [
  { id: 'pure-white', label: 'Pure White', value: '#ffffff' },
  { id: 'warm-champagne', label: 'Warm Champagne', value: '#F8E16C' },
  { id: 'soft-sand', label: 'Soft Sand', value: '#F4D2B8' },
  { id: 'punchy-coral', label: 'Punchy Coral', value: '#FF8A7A' },
  { id: 'electric-lime', label: 'Electric Lime', value: '#C9FF5A' },
  { id: 'cool-ice', label: 'Cool Ice', value: '#C7E7FF' },
  { id: 'deep-space', label: 'Deep Space', value: '#101828' },
];

export const STROKE_COLOR_OPTIONS = [
  { id: 'transparent', label: 'Transparent', value: 'transparent' },
  { id: 'rich-ebony', label: 'Rich Ebony', value: '#050709' },
  { id: 'true-black', label: 'Jet Black', value: '#0B0F17' },
  { id: 'warm-charcoal', label: 'Warm Charcoal', value: '#1F242E' },
  { id: 'ultra-navy', label: 'Ultra Navy', value: '#0B1C3B' },
  { id: 'golden-pop', label: 'Golden Pop', value: '#F7B500' },
  { id: 'soft-slate', label: 'Soft Slate', value: '#4A5568' },
];

export const BACKGROUND_COLOR_OPTIONS = [
  { id: 'void', label: 'Void', value: '#020617' },
  { id: 'onyx', label: 'Onyx', value: '#111827' },
  { id: 'graphite', label: 'Graphite', value: '#1F2937' },
  { id: 'espresso', label: 'Espresso', value: '#2B211A' },
  { id: 'blush', label: 'Editorial Blush', value: '#FFE7DA' },
  { id: 'storm', label: 'Storm Blue', value: '#4C6EF5' },
  { id: 'sunset', label: 'Sunset', value: '#FF9472' },
];

export interface FontOption {
  id: string;
  label: string;
  description: string;
  stack: string;
  category: 'Sans Serif' | 'Serif';
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'inter',
    label: 'Inter',
    description: 'Modern, highly readable sans serif',
    stack: "'Inter', 'Helvetica Neue', sans-serif",
    category: 'Sans Serif',
  },
  {
    id: 'manrope',
    label: 'Manrope',
    description: 'Rounded, friendly sans serif',
    stack: "'Manrope', 'Avenir', sans-serif",
    category: 'Sans Serif',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    description: 'Tech-forward understated sans',
    stack: "'Space Grotesk', 'Segoe UI', sans-serif",
    category: 'Sans Serif',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    description: 'Editorial serif with high contrast',
    stack: "'Playfair Display', 'Times New Roman', serif",
    category: 'Serif',
  },
  {
    id: 'dm-serif',
    label: 'DM Serif Display',
    description: 'Bold fashion serif statement',
    stack: "'DM Serif Display', 'Georgia', serif",
    category: 'Serif',
  },
  {
    id: 'libre-baskerville',
    label: 'Libre Baskerville',
    description: 'Classic storytelling serif',
    stack: "'Libre Baskerville', 'Georgia', serif",
    category: 'Serif',
  },
];

export const FONT_GOOGLE_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Manrope:wght@400;600;700&family=Space+Grotesk:wght@400;600&family=Playfair+Display:wght@400;600&family=DM+Serif+Display&family=Libre+Baskerville:wght@400;700&display=swap';
