import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import clsx from 'clsx';

export interface ColorOption {
  id: string;
  label?: string;
  value: string;
}

interface ColorSwatchPickerProps {
  label: string;
  value?: string;
  options: ColorOption[];
  onChange: (color: string) => void;
  allowTransparent?: boolean;
}

const TRANSPARENT_PATTERN =
  'linear-gradient(135deg, #f8fafc 25%, #d7dfe8 25%, #d7dfe8 50%, #f8fafc 50%, #f8fafc 75%, #d7dfe8 75%, #d7dfe8 100%)';

const normalizeHex = (value: string): string | null => {
  if (!value) return null;
  // Handle rgba values
  if (value.startsWith('rgba')) {
    return value; // Return as-is for rgba
  }
  const sanitized = value.trim().replace(/[^0-9a-fA-F#]/g, '');
  const withHash = sanitized.startsWith('#') ? sanitized : `#${sanitized}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    return withHash.toUpperCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash.split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
};

const ColorSwatchPicker = ({
  label,
  value,
  options,
  onChange,
  allowTransparent = false,
}: ColorSwatchPickerProps) => {
  const [customColor, setCustomColor] = useState('#ffffff');
  const [hexError, setHexError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const normalizedValue = value || options[0]?.value;

  const allOptions = useMemo(() => {
    if (!allowTransparent) return options;
    return [
      { id: 'transparent', label: 'None', value: 'transparent' },
      ...options.filter((opt) => opt.id !== 'transparent'),
    ];
  }, [allowTransparent, options]);

  const selectedOption = allOptions.find((opt) => opt.value === normalizedValue);

  const renderSwatchBackground = (colorValue: string) =>
    colorValue === 'transparent' ? TRANSPARENT_PATTERN : colorValue;

  const formatValue = (val: string) => {
    if (val === 'transparent') return 'None';
    if (val.startsWith('rgba'))
      return val.replace('rgba', '').replace(/[()]/g, '').substring(0, 15) + '...';
    return val.toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <button
          type="button"
          className="flex h-7 w-full items-center gap-2 rounded border border-border/40 bg-background px-2 transition-all hover:border-border/60 hover:bg-background-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <span
            className="h-4 w-4 shrink-0 rounded border border-border/40 shadow-sm"
            style={{
              background: renderSwatchBackground(selectedOption?.value || '#ffffff'),
              backgroundSize: selectedOption?.value === 'transparent' ? '8px 8px' : undefined,
            }}
          >
            {selectedOption?.value === 'transparent' && (
              <span className="flex h-full items-center justify-center text-[8px] font-bold text-foreground-muted">
                /
              </span>
            )}
          </span>
          <span className="flex-1 truncate text-left text-[10px] font-medium text-foreground">
            {selectedOption?.label || formatValue(normalizedValue || '')}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3 p-3" align="start">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            {label}
          </p>
          <div className="grid grid-cols-8 gap-1.5">
            {allOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={clsx(
                  'relative h-7 w-7 rounded border transition-all hover:scale-110 focus:outline-none focus:ring-1 focus:ring-primary/30',
                  normalizedValue === option.value
                    ? 'border-foreground ring-2 ring-primary/30 ring-offset-1'
                    : 'border-border/40'
                )}
                style={{
                  background: renderSwatchBackground(option.value),
                  backgroundSize: option.value === 'transparent' ? '8px 8px' : undefined,
                }}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                title={option.label || option.value}
              >
                {normalizedValue === option.value && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={
                          option.value === 'transparent' ||
                          (option.value.startsWith('#') && option.value.toLowerCase() === '#ffffff')
                            ? 'text-foreground'
                            : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                        }
                      />
                    </svg>
                  </span>
                )}
                {option.value === 'transparent' && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground-muted">
                    /
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Color Input */}
        <div className="space-y-2 rounded-lg border border-border/40 bg-background-secondary/30 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            Custom
          </p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(event) => {
                const nextValue = event.target.value.toUpperCase();
                setHexError(null);
                setCustomColor(nextValue);
              }}
              className="h-8 w-8 cursor-pointer rounded border border-border/40 bg-background"
            />
            <input
              type="text"
              value={customColor}
              onChange={(event) => {
                const nextValue = event.target.value.toUpperCase();
                setCustomColor(nextValue);
                setHexError(normalizeHex(nextValue) ? null : 'Invalid HEX');
              }}
              placeholder="#FFFFFF"
              className="flex-1 rounded border border-border/40 bg-background px-2 py-1.5 text-[10px] font-mono uppercase tracking-wide text-foreground transition-all focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          {hexError && <p className="text-[10px] text-destructive">{hexError}</p>}
          <Button
            size="sm"
            onClick={() => {
              const normalized = normalizeHex(customColor);
              if (normalized) {
                onChange(normalized);
                setOpen(false);
                setHexError(null);
              } else {
                setHexError('Invalid HEX value');
              }
            }}
            className="h-7 w-full text-[10px]"
            disabled={!normalizeHex(customColor)}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorSwatchPicker;
