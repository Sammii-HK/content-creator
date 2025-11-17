'use client';

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
import { useResponsive } from '@/hooks/useResponsive';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PropertiesPanelProps {
  text?: (TextOverlay & { id: string }) | null;
  onPositionChange: (position: TextOverlay['position']) => void;
  onStyleChange: (style: Partial<TextOverlay['style']>) => void;
  onContentChange: (content: string) => void;
}

const PropertiesPanel = ({
  text,
  onPositionChange,
  onStyleChange,
  onContentChange,
}: PropertiesPanelProps) => {
  const { isMobile } = useResponsive();
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    position: false,
    typography: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (!text) {
    if (isMobile) {
      return null; // Don't show anything on mobile when no text selected
    }
    return (
      <aside className="w-80 border-l border-theme bg-secondary p-6">
        <p className="text-sm text-secondary">Select a text element to edit its properties</p>
      </aside>
    );
  }

  const { position, style } = text;
  const fontSize = style?.fontSize ?? 40;
  const strokeWidth = style?.strokeWidth ?? 0;

  const content = (
    <div className="space-y-4">
      {/* Content Section */}
      <section className="space-y-3">
        <button
          onClick={() => toggleSection('content')}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">Content</h3>
          {expandedSections.content ? (
            <ChevronUp className="h-4 w-4 text-secondary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-secondary" />
          )}
        </button>
        {expandedSections.content && (
          <Textarea
            className="min-h-[80px] rounded-xl border-theme bg-elevated text-sm text-primary"
            value={text.content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Enter text content..."
          />
        )}
      </section>

      <div className="h-px bg-border" />

      {/* Position Section */}
      <section className="space-y-3">
        <button
          onClick={() => toggleSection('position')}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Position
          </h3>
          {expandedSections.position ? (
            <ChevronUp className="h-4 w-4 text-secondary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-secondary" />
          )}
        </button>
        {expandedSections.position && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="position-x" className="text-xs text-secondary">
                X (%)
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
                className="h-9 border-theme bg-elevated text-primary"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="position-y" className="text-xs text-secondary">
                Y (%)
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
                className="h-9 border-theme bg-elevated text-primary"
              />
            </div>
          </div>
        )}
      </section>

      <div className="h-px bg-border" />

      {/* Typography Section */}
      <section className="space-y-3">
        <button
          onClick={() => toggleSection('typography')}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Typography
          </h3>
          {expandedSections.typography ? (
            <ChevronUp className="h-4 w-4 text-secondary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-secondary" />
          )}
        </button>
        {expandedSections.typography && (
          <div className="space-y-4">
            {/* Font Size */}
            <div className="space-y-2 rounded-xl bg-tertiary p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-secondary">Font Size</Label>
                <span className="text-xs font-semibold text-primary">{fontSize}px</span>
              </div>
              <Slider
                value={[fontSize]}
                max={96}
                min={16}
                onValueChange={([value]) => onStyleChange({ fontSize: value })}
              />
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <Label className="text-xs text-secondary">Font Family</Label>
              <Select
                value={style?.fontFamily || FONT_OPTIONS[0].stack}
                onValueChange={(value) => onStyleChange({ fontFamily: value })}
              >
                <SelectTrigger className="h-9 border-theme bg-elevated text-primary">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.id} value={font.stack}>
                      <div className="flex flex-col">
                        <span className="font-medium">{font.label}</span>
                        <span className="text-xs text-secondary">{font.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-secondary">Text</Label>
                <ColorSwatchPicker
                  label="Text Color"
                  value={style?.color}
                  options={TEXT_COLOR_OPTIONS}
                  onChange={(color) => onStyleChange({ color })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-secondary">Stroke</Label>
                <ColorSwatchPicker
                  label="Stroke Color"
                  value={style?.stroke ?? 'transparent'}
                  options={STROKE_COLOR_OPTIONS}
                  onChange={(color) => onStyleChange({ stroke: color })}
                  allowTransparent
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-secondary">Background</Label>
                <ColorSwatchPicker
                  label="Background"
                  value={style?.backgroundColor ?? style?.background?.toString()}
                  options={BACKGROUND_COLOR_OPTIONS}
                  onChange={(color) =>
                    onStyleChange({
                      background: true,
                      backgroundColor: color,
                    })
                  }
                />
              </div>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-secondary">Stroke Width</Label>
                <span className="text-xs text-primary">{strokeWidth}px</span>
              </div>
              <Slider
                value={[strokeWidth]}
                min={0}
                max={10}
                onValueChange={([value]) => onStyleChange({ strokeWidth: value })}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );

  // Mobile: Fixed bottom panel (always visible when text selected)
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 max-h-[60vh] overflow-y-auto border-t border-theme bg-primary p-4 shadow-theme-xl">
        {content}
      </div>
    );
  }

  // Desktop: Right sidebar
  return (
    <aside className="w-80 overflow-y-auto border-l border-theme bg-secondary p-6">{content}</aside>
  );
};

export default PropertiesPanel;
