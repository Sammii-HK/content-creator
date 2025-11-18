// Text Colors - High contrast colors optimized for video overlays
// These colors are designed to be readable on both light and dark video backgrounds
export const TEXT_COLOR_OPTIONS = [
  // Pure whites - best for dark videos
  { id: 'pure-white', label: 'White', value: '#FFFFFF' },
  { id: 'warm-white', label: 'Warm White', value: '#FFFBF0' },

  // Pure blacks - best for light videos
  { id: 'pure-black', label: 'Black', value: '#000000' },
  { id: 'charcoal', label: 'Charcoal', value: '#1A1A1A' },

  // High contrast colors for vibrant videos
  { id: 'bright-yellow', label: 'Bright Yellow', value: '#FFEB3B' },
  { id: 'electric-green', label: 'Electric Green', value: '#00FF88' },
  { id: 'cyan', label: 'Cyan', value: '#00D9FF' },
  { id: 'magenta', label: 'Magenta', value: '#FF00FF' },
  { id: 'orange', label: 'Orange', value: '#FF6B35' },
  { id: 'red', label: 'Red', value: '#FF1744' },

  // Muted but readable colors
  { id: 'light-gray', label: 'Light Gray', value: '#E0E0E0' },
  { id: 'dark-gray', label: 'Dark Gray', value: '#424242' },
];

// Stroke Colors - Contrasting outline colors for text legibility
// These create outlines that make text readable on any background
export const STROKE_COLOR_OPTIONS = [
  { id: 'transparent', label: 'None', value: 'transparent' },

  // Black strokes - for light text on dark backgrounds
  { id: 'black', label: 'Black', value: '#000000' },
  { id: 'dark-gray', label: 'Dark Gray', value: '#212121' },

  // White strokes - for dark text on light backgrounds
  { id: 'white', label: 'White', value: '#FFFFFF' },
  { id: 'off-white', label: 'Off White', value: '#FAFAFA' },

  // Colored strokes for special effects
  { id: 'yellow', label: 'Yellow', value: '#FFEB3B' },
  { id: 'cyan', label: 'Cyan', value: '#00D9FF' },
  { id: 'magenta', label: 'Magenta', value: '#FF00FF' },
];

// Background Colors - Semi-transparent backgrounds for text containers
// These help text stand out on busy video backgrounds
export const BACKGROUND_COLOR_OPTIONS = [
  { id: 'transparent', label: 'None', value: 'transparent' },

  // Dark backgrounds - for light text
  { id: 'black-80', label: 'Black 80%', value: 'rgba(0, 0, 0, 0.8)' },
  { id: 'black-60', label: 'Black 60%', value: 'rgba(0, 0, 0, 0.6)' },
  { id: 'black-40', label: 'Black 40%', value: 'rgba(0, 0, 0, 0.4)' },
  { id: 'dark-gray-80', label: 'Dark Gray 80%', value: 'rgba(33, 33, 33, 0.8)' },

  // Light backgrounds - for dark text
  { id: 'white-90', label: 'White 90%', value: 'rgba(255, 255, 255, 0.9)' },
  { id: 'white-70', label: 'White 70%', value: 'rgba(255, 255, 255, 0.7)' },
  { id: 'white-50', label: 'White 50%', value: 'rgba(255, 255, 255, 0.5)' },
  { id: 'light-gray-80', label: 'Light Gray 80%', value: 'rgba(224, 224, 224, 0.8)' },

  // Colored backgrounds for branding
  { id: 'blue-tint', label: 'Blue Tint', value: 'rgba(33, 150, 243, 0.7)' },
  { id: 'red-tint', label: 'Red Tint', value: 'rgba(244, 67, 54, 0.7)' },
  { id: 'green-tint', label: 'Green Tint', value: 'rgba(76, 175, 80, 0.7)' },
];

export interface FontOption {
  id: string;
  label: string;
  description: string;
  stack: string;
  category: 'Sans Serif' | 'Serif' | 'Display';
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
