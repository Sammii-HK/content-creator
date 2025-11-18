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
  mobileSheetHeight?: 'collapsed' | 'half' | 'full';
  onMobileSheetHeightChange?: (height: 'collapsed' | 'half' | 'full') => void;
  viewMode?: 'edit' | 'previewCuts' | 'previewFull';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const PropertiesPanel = ({
  text,
  onPositionChange,
  onStyleChange,
  onContentChange,
  isMobileSheet = false,
  onSelectDefaultText,
  mobileSheetHeight = 'half',
  onMobileSheetHeightChange,
  viewMode = 'edit',
  isCollapsed = false,
  onToggleCollapse,
}: PropertiesPanelProps) => {
  // Only show in edit mode
  if (viewMode !== 'edit') {
    return null;
  }
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
      <div className="space-y-6">
        {/* Active Item Indicator */}
        <div className="rounded-xl border border-border/50 bg-background-secondary/50 px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/70">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                Editing
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">{previewLabel}</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-3">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Content
          </Label>
          <Textarea
            className="min-h-[100px] resize-none rounded-xl border border-border/50 bg-background text-sm transition-all duration-200 hover:border-border/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            value={text.content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Enter text..."
          />
        </div>

        {/* Position Section */}
        <div className="space-y-3 border-t border-border/30 pt-6">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Position
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="position-x" className="text-xs font-medium text-foreground-muted">
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
                className="h-10 rounded-xl border border-border/50 bg-background text-sm font-medium transition-all duration-200 hover:border-border/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-y" className="text-xs font-medium text-foreground-muted">
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
                className="h-10 rounded-xl border border-border/50 bg-background text-sm font-medium transition-all duration-200 hover:border-border/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Typography Section */}
        <div className="space-y-4 border-t border-border/30 pt-6">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Typography
          </Label>

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground-muted">Size</Label>
              <span className="rounded-lg px-2.5 py-1 text-xs font-bold text-primary bg-primary/10">
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
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground-muted">Font</Label>
            <Select
              value={style?.fontFamily || FONT_OPTIONS[0].stack}
              onValueChange={(value) => onStyleChange({ fontFamily: value })}
            >
              <SelectTrigger className="h-10 rounded-xl border border-border/50 bg-background text-sm font-medium transition-all hover:border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent className="max-h-60" style={{ backgroundColor: 'var(--background)' }}>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.id} value={font.stack}>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{font.label}</span>
                      <span className="text-xs text-foreground-muted">{font.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Colors Section */}
        <div className="space-y-4 border-t border-border/30 pt-6">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Colors
          </Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground-muted">Text</Label>
              <ColorSwatchPicker
                label="Text Color"
                value={style?.color}
                options={TEXT_COLOR_OPTIONS}
                onChange={(color) => onStyleChange({ color })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground-muted">Stroke</Label>
              <ColorSwatchPicker
                label="Stroke Color"
                value={style?.stroke ?? 'transparent'}
                options={STROKE_COLOR_OPTIONS}
                onChange={(color) => onStyleChange({ stroke: color })}
                allowTransparent
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground-muted">Background</Label>
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
        <div className="space-y-3 border-t border-border/30 pt-6">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-foreground-muted">Stroke Width</Label>
            <span className="rounded-lg px-2.5 py-1 text-xs font-bold text-primary bg-primary/10">
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

  // Mobile: Collapsible bottom sheet with drag handle
  if (isMobileSheet) {
    const getHeightClass = () => {
      switch (mobileSheetHeight) {
        case 'collapsed':
          return 'h-0 opacity-0 pointer-events-none';
        case 'full':
          return 'h-[80vh]';
        case 'half':
        default:
          return 'h-[40vh]';
      }
    };

    const handleDragHandleClick = () => {
      if (!onMobileSheetHeightChange) return;
      // Cycle through: half -> full -> collapsed -> half
      if (mobileSheetHeight === 'half') {
        onMobileSheetHeightChange('full');
      } else if (mobileSheetHeight === 'full') {
        onMobileSheetHeightChange('collapsed');
      } else {
        onMobileSheetHeightChange('half');
      }
    };

    // Completely hide when collapsed - show expand button
    if (mobileSheetHeight === 'collapsed') {
      return (
        <div className="properties-panel-mobile fixed bottom-0 left-0 right-0 z-[9999] h-auto">
          <button
            onClick={() => onMobileSheetHeightChange?.('half')}
            className="w-full h-14 bg-background border-t border-border/60 flex items-center justify-center gap-2 shadow-lg"
            style={{ backgroundColor: 'var(--background)' }}
          >
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
              className="text-foreground"
            >
              <path d="m12 19-6-6 6-6" />
            </svg>
            <span className="text-sm font-semibold text-foreground">Properties</span>
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Backdrop overlay when expanded */}
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity"
          onClick={() => onMobileSheetHeightChange?.('collapsed')}
        />
        <div
          className={`properties-panel-mobile ${getHeightClass()} flex-col overflow-hidden bg-background border-t border-border/60 shadow-[0_-1px_0_0_rgba(0,0,0,0.05),0_-4px_24px_rgba(0,0,0,0.08)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-[9999]`}
          style={{ backgroundColor: 'var(--background)' }}
        >
          {/* Drag Handle */}
          <div
            className="flex shrink-0 items-center justify-between border-b border-border/40 bg-background px-5 py-3 cursor-grab active:cursor-grabbing touch-none"
            onClick={handleDragHandleClick}
          >
            <h2 className="text-sm font-semibold text-foreground">Properties</h2>
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 rounded-full bg-foreground-muted/40" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMobileSheetHeightChange?.('collapsed');
                }}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-background-secondary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground"
                >
                  <path d="m18 6-6 6-6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 pb-[calc(20px+env(safe-area-inset-bottom))] min-h-0">
            {bodyContent}
          </div>
        </div>
      </>
    );
  }

  // Desktop: Right sidebar - Collapsible
  const desktopPanel = (
    <div
      className="flex h-full max-h-full flex-col overflow-hidden bg-background"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Header with collapse button */}
      <div
        className="shrink-0 border-b border-border/50 bg-background px-5 py-4 flex items-center justify-between"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {!isCollapsed && <h2 className="text-sm font-semibold text-foreground">Properties</h2>}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`h-7 w-7 rounded-lg border border-border/50 bg-background-secondary hover:bg-background-secondary/80 transition-all flex items-center justify-center ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            aria-label={isCollapsed ? 'Expand properties' : 'Collapse properties'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">{bodyContent}</div>
      )}
    </div>
  );

  return (
    <aside
      className={`properties-panel-desktop h-full max-h-full flex-shrink-0 flex-grow-0 flex-col overflow-hidden border-l border-border/50 bg-background shadow-[-1px_0_0_0_rgba(0,0,0,0.05)] transition-all duration-200 ${
        isCollapsed ? 'w-[60px] min-w-[60px] max-w-[60px]' : 'w-[320px] min-w-[320px] max-w-[320px]'
      }`}
      style={{ backgroundColor: 'var(--background)' }}
    >
      {desktopPanel}
    </aside>
  );
};

export default PropertiesPanel;
