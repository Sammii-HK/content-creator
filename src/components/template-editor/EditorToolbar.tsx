'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Plus, Redo, Save, Trash2, Type, Undo, FileJson, Menu, Eye } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface EditorToolbarProps {
  templateName: string;
  onNameChange: (value: string) => void;
  onAddText: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  viewMode: 'edit' | 'previewCuts' | 'previewFull';
  onViewModeChange: (mode: 'edit' | 'previewCuts' | 'previewFull') => void;
  onSave?: () => void;
  onImportJson?: () => void;
  onExportJson?: () => void;
}

const viewOptions: Array<{ id: 'edit' | 'previewCuts' | 'previewFull'; label: string }> = [
  { id: 'edit', label: 'Edit' },
  { id: 'previewCuts', label: 'Preview' },
  { id: 'previewFull', label: 'Full Clip' },
];

const ViewModeToggle = ({
  compact = false,
  onChange,
  viewMode,
  onViewModeChange,
}: {
  compact?: boolean;
  onChange?: (mode: 'edit' | 'previewCuts' | 'previewFull') => void;
  viewMode: 'edit' | 'previewCuts' | 'previewFull';
  onViewModeChange: (mode: 'edit' | 'previewCuts' | 'previewFull') => void;
}) => (
  <div
    className={cn(
      'flex rounded-full border border-theme/40 bg-background-secondary text-[11px] font-semibold uppercase tracking-[0.3em]',
      compact ? 'w-full' : ''
    )}
  >
    {viewOptions.map((option) => (
      <button
        key={option.id}
        className={cn(
          'flex-1 px-3 py-1 transition',
          viewMode === option.id
            ? 'bg-primary text-primary-foreground'
            : 'text-secondary hover:text-foreground'
        )}
        onClick={() => {
          onViewModeChange(option.id);
          onChange?.(option.id);
        }}
        type="button"
      >
        {option.label}
      </button>
    ))}
  </div>
);

const EditorToolbar = ({
  templateName,
  onNameChange,
  onAddText,
  onDuplicate,
  onDelete,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  viewMode,
  onViewModeChange,
  onSave,
  onImportJson,
  onExportJson,
}: EditorToolbarProps) => {
  const { isMobile, isTablet } = useResponsive();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <header className="flex h-16 items-center justify-between border-b border-theme/30 bg-background px-4 backdrop-blur">
          <div className="flex flex-1 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="h-9 w-9"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-secondary">
                Template
              </span>
              <Input
                value={templateName}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Untitled template"
                className="h-10 border border-theme/40 bg-background-secondary text-sm text-foreground focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={onSave} className="h-9 rounded-full px-4">
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="border-b border-theme/20 bg-background px-4 py-2">
          <ViewModeToggle compact viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Mobile Menu Drawer */}
        {showMobileMenu && (
          <div className="border-b border-theme/30 bg-background p-4 shadow-theme-md backdrop-blur">
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onAddText();
                  setShowMobileMenu(false);
                }}
                className="justify-start gap-2 rounded-2xl"
              >
                <Plus className="h-4 w-4" />
                Add Text
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onDuplicate();
                  setShowMobileMenu(false);
                }}
                className="justify-start gap-2 rounded-2xl"
              >
                <Copy className="h-4 w-4" />
                Duplicate Scene
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete();
                  setShowMobileMenu(false);
                }}
                className="justify-start gap-2 rounded-2xl"
              >
                <Trash2 className="h-4 w-4" />
                Delete Scene
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="flex-1"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="flex-1"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 rounded-2xl border border-theme/40 bg-background-secondary/60 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-secondary">
                  Mode
                </div>
                <ViewModeToggle
                  compact
                  viewMode={viewMode}
                  onViewModeChange={(mode) => {
                    onViewModeChange(mode);
                    setShowMobileMenu(false);
                  }}
                />
              </div>
              {onImportJson && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onImportJson();
                    setShowMobileMenu(false);
                  }}
                  className="justify-start gap-2 rounded-2xl"
                >
                  <FileJson className="h-4 w-4" />
                  Import JSON
                </Button>
              )}
            </div>
          </div>
        )}
        {viewMode === 'edit' && (
          <Button
            variant="default"
            size="sm"
            className="fixed bottom-6 right-4 z-40 h-12 gap-2 rounded-full px-5 shadow-theme-xl"
            onClick={onAddText}
          >
            <Plus className="h-4 w-4" />
            Text
          </Button>
        )}
      </>
    );
  }

  // Tablet/Desktop Layout
  return (
    <header className="flex h-16 items-center justify-between border-b border-theme/30 bg-background px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="hidden rounded-2xl border border-theme/30 p-2 lg:flex">
          <Type className="h-4 w-4 text-accent" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-secondary">
            Template
          </span>
          <Input
            value={templateName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Untitled template"
            className="h-11 w-48 rounded-2xl border border-theme/30 bg-background-secondary text-sm text-foreground focus-visible:ring-0 lg:w-64"
          />
        </div>
        {!isTablet && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={onAddText}
              className="h-10 w-10 rounded-2xl"
              title="Add Text"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={onDuplicate}
              className="h-10 w-10 rounded-2xl"
              title="Duplicate Scene"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={onDelete}
              className="h-10 w-10 rounded-2xl"
              title="Delete Scene"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
          className="h-9 w-9 rounded-2xl"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Cmd+Shift+Z)"
          className="h-9 w-9 rounded-2xl"
        >
          <Redo className="h-4 w-4" />
        </Button>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        {onExportJson && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onExportJson}
            title="Review/Export JSON"
            className="h-9 w-9 rounded-2xl"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {onImportJson && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onImportJson}
            title="Import JSON"
            className="h-9 w-9 rounded-2xl"
          >
            <FileJson className="h-4 w-4" />
          </Button>
        )}
        <Button variant="default" size="sm" onClick={onSave} className="gap-2 rounded-full px-4">
          <Save className="h-4 w-4" />
          {!isTablet && 'Save'}
        </Button>
      </div>
    </header>
  );
};

export default EditorToolbar;
