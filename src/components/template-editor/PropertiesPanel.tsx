'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ColorSwatchPicker from './ColorSwatchPicker';
import {
  TEXT_COLOR_OPTIONS,
  STROKE_COLOR_OPTIONS,
  BACKGROUND_COLOR_OPTIONS,
  FONT_OPTIONS,
} from './presets';
import type { TextOverlay } from '@/lib/video';

interface PropertiesPanelProps {
  text?: (TextOverlay & { id: string }) | null;
  onPositionChange: (position: TextOverlay['position']) => void;
  onStyleChange: (style: Partial<TextOverlay['style']>) => void;
  onContentChange: (content: string) => void;
  isMobileSheet?: boolean;
  onSelectDefaultText?: () => void;
}

const PropertiesPanel = ({
  text,
  onPositionChange,
  onStyleChange,
  onContentChange,
  isMobileSheet = false,
  onSelectDefaultText,
}: PropertiesPanelProps) => {
  const normalizedBackground = (() => {
    if (typeof text?.style?.background === 'string') {
      return text.style.background;
    }
    if (text?.style?.backgroundColor) {
      return text.style.backgroundColor;
    }
    if (text?.style?.background === false) {
      return 'transparent';
    }
    return undefined;
  })();

  const renderPanelContent = () => {
    if (!text) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-foreground/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground-muted"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-foreground">No text selected</h3>
            <p className="text-xs text-foreground-muted max-w-[200px]">
              Select a text overlay on the canvas to edit its properties.
            </p>
          </div>
          {onSelectDefaultText && (
            <Button variant="secondary" size="sm" onClick={onSelectDefaultText} className="mt-2">
              Select Scene Text
            </Button>
          )}
        </div>
      );
    }

    const { position, style } = text;
    const fontSize = style?.fontSize ?? 40;
    const strokeWidth = style?.strokeWidth ?? 0;
    const cleanedContent = (text.content || '')
      .replace(/\{\{|\}\}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const previewLabel = cleanedContent || 'Text layer';

    return (
      <div className="space-y-1">
        {/* Active Item Indicator */}
        <div className="mb-4 rounded-lg border border-border/40 bg-background-secondary/30 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                Editing
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
                {previewLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-1.5 border-b border-border/30 pb-4">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Content
          </Label>
          <Textarea
            className="min-h-[80px] resize-none border-border/40 bg-background text-xs transition-all focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
            value={text.content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Enter text..."
          />
        </div>

        {/* Position Section */}
        <div className="space-y-1.5 border-b border-border/30 pb-4 pt-4">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Position
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="position-x" className="text-[10px] font-medium text-foreground-muted">
                X
              </Label>
              <Input
                id="position-x"
                type="number"
                min={0}
                max={100}
                value={Math.round(position.x)}
                onChange={(event) =>
                  onPositionChange({ ...position, x: Number(event.target.value) })
                }
                className="h-8 border-border/40 bg-background text-xs font-medium transition-all focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="position-y" className="text-[10px] font-medium text-foreground-muted">
                Y
              </Label>
              <Input
                id="position-y"
                type="number"
                min={0}
                max={100}
                value={Math.round(position.y)}
                onChange={(event) =>
                  onPositionChange({ ...position, y: Number(event.target.value) })
                }
                className="h-8 border-border/40 bg-background text-xs font-medium transition-all focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Typography Section */}
        <div className="space-y-4 border-b border-border/30 pb-4 pt-4">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Typography
          </Label>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-medium text-foreground-muted">Size</Label>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-primary bg-primary/10">
                {fontSize}px
              </span>
            </div>
            <Slider
              value={[fontSize]}
              max={96}
              min={16}
              step={1}
              onValueChange={([value]) => onStyleChange({ fontSize: value })}
              className="w-full"
            />
          </div>

          {/* Font Family */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-medium text-foreground-muted">Font</Label>
            <Select
              value={style?.fontFamily || FONT_OPTIONS[0].stack}
              onValueChange={(value) => onStyleChange({ fontFamily: value })}
            >
              <SelectTrigger className="h-8 border-border/40 bg-background text-xs font-medium transition-all focus:border-primary/60 focus:ring-1 focus:ring-primary/20">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.id} value={font.stack}>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs">{font.label}</span>
                      <span className="text-[10px] text-foreground-muted">{font.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Colors Section */}
        <div className="space-y-4 border-b border-border/30 pb-4 pt-4">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Colors
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-foreground-muted">Text</Label>
              <ColorSwatchPicker
                label="Text Color"
                value={style?.color}
                options={TEXT_COLOR_OPTIONS}
                onChange={(color) => onStyleChange({ color })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-foreground-muted">Stroke</Label>
              <ColorSwatchPicker
                label="Stroke Color"
                value={style?.stroke ?? 'transparent'}
                options={STROKE_COLOR_OPTIONS}
                onChange={(color) => onStyleChange({ stroke: color })}
                allowTransparent
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-foreground-muted">Background</Label>
              <ColorSwatchPicker
                label="Background"
                value={normalizedBackground}
                options={BACKGROUND_COLOR_OPTIONS}
                allowTransparent
                onChange={(color) => {
                  if (color === 'transparent') {
                    onStyleChange({
                      background: false,
                      backgroundColor: undefined,
                    });
                    return;
                  }
                  onStyleChange({
                    background: true,
                    backgroundColor: color,
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* Stroke Width */}
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-medium text-foreground-muted">Stroke Width</Label>
            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-primary bg-primary/10">
              {strokeWidth}px
            </span>
          </div>
          <Slider
            value={[strokeWidth]}
            min={0}
            max={10}
            step={0.5}
            onValueChange={([value]) => onStyleChange({ strokeWidth: value })}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  const bodyContent = renderPanelContent();

  // Mobile: Fixed bottom sheet - 15-20% height, positioned at bottom
  if (isMobileSheet) {
    return (
      <div className="properties-panel-mobile h-[20vh] min-h-[200px] max-h-[300px] flex-col overflow-hidden bg-background border-t border-border/60 shadow-[0_-1px_0_0_rgba(0,0,0,0.05),0_-4px_24px_rgba(0,0,0,0.08)]">
        {/* Drag Handle */}
        <div className="flex shrink-0 items-center justify-center border-b border-border/40 bg-background-secondary/30 py-2">
          <div className="h-0.5 w-10 rounded-full bg-foreground-muted/30" />
        </div>

        {/* Header */}
        <div className="shrink-0 border-b border-border/40 bg-background px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Properties</h2>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-[calc(20px+env(safe-area-inset-bottom))] min-h-0">
          {bodyContent}
        </div>
      </div>
    );
  }

  // Desktop: Right sidebar - Figma style
  const desktopPanel = (
    <div className="flex h-full max-h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border/60 bg-background px-4 py-3">
        <h2 className="text-xs font-semibold text-foreground">Properties</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">{bodyContent}</div>
    </div>
  );

  return (
    <aside className="properties-panel-desktop h-full max-h-full w-[320px] shrink-0 flex-col overflow-hidden border-l border-border/60 bg-background shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">
      {desktopPanel}
    </aside>
  );
};

export default PropertiesPanel;
