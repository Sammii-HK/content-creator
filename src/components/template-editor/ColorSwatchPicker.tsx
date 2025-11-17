import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus } from 'lucide-react';
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

const ColorSwatchPicker = ({
  label,
  value,
  options,
  onChange,
  allowTransparent = false,
}: ColorSwatchPickerProps) => {
  const [customColor, setCustomColor] = useState('#ffffff');
  const [open, setOpen] = useState(false);

  const normalizedValue = value || options[0]?.value;

  const allOptions = useMemo(() => {
    if (!allowTransparent) return options;
    return [
      { id: 'transparent', label: 'Transparent', value: 'transparent' },
      ...options.filter((opt) => opt.id !== 'transparent'),
    ];
  }, [allowTransparent, options]);

  const selectedOption = allOptions.find((opt) => opt.value === normalizedValue);

  const renderSwatchBackground = (colorValue: string) =>
    colorValue === 'transparent' ? TRANSPARENT_PATTERN : colorValue;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-500">
        <span>{label}</span>
        {normalizedValue && (
          <span className="font-mono tracking-wide text-slate-600">
            {normalizedValue.toUpperCase()}
          </span>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-left shadow-sm transition hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white shadow ring-1 ring-slate-200"
              style={{
                background: renderSwatchBackground(selectedOption?.value || '#ffffff'),
                backgroundSize: selectedOption?.value === 'transparent' ? '10px 10px' : undefined,
              }}
            >
              {selectedOption?.value === 'transparent' && (
                <span className="text-[10px] font-semibold text-slate-600">Ø</span>
              )}
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {selectedOption?.label || normalizedValue?.toUpperCase()}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-4 p-4" align="start">
          <div className="grid grid-cols-6 gap-2">
            {allOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={clsx(
                  'relative h-9 w-9 rounded-full border border-slate-200 transition hover:border-slate-400 focus:outline-none',
                  normalizedValue === option.value ? 'ring-2 ring-offset-2 ring-slate-900/70' : ''
                )}
                style={{
                  background: renderSwatchBackground(option.value),
                  backgroundSize: option.value === 'transparent' ? '10px 10px' : undefined,
                }}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                title={option.label || option.value}
              >
                {normalizedValue === option.value && (
                  <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-white drop-shadow">
                    •
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
              onClick={() => setCustomColor(normalizedValue || '#ffffff')}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 rounded-2xl bg-slate-50/80 p-3 shadow-inner">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Custom</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(event) => setCustomColor(event.target.value)}
                className="h-11 w-11 cursor-pointer rounded-full border border-slate-200 bg-white"
              />
              <input
                type="text"
                value={customColor}
                onChange={(event) => setCustomColor(event.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono uppercase tracking-wide text-slate-700"
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                onChange(customColor);
                setOpen(false);
              }}
              className="w-full"
            >
              Use {customColor.toUpperCase()}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ColorSwatchPicker;
