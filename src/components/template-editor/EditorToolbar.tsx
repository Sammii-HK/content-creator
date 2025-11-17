'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Copy,
  Plus,
  Redo,
  Save,
  Trash2,
  Type,
  Undo,
  Eye,
  EyeOff,
  FileJson,
  Menu,
} from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
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
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onSave?: () => void;
  onImportJson?: () => void;
}

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
  isPreviewMode,
  onTogglePreview,
  onSave,
  onImportJson,
}: EditorToolbarProps) => {
  const { isMobile, isTablet } = useResponsive();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <header className="flex h-14 items-center justify-between border-b border-theme bg-primary px-4 shadow-theme-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Input
            value={templateName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Template"
            className="mx-2 h-9 flex-1 border-theme bg-secondary text-sm text-primary"
          />
          <Button variant="default" size="sm" onClick={onSave} className="h-9 rounded-full px-4">
            <Save className="h-4 w-4" />
          </Button>
        </header>

        {/* Mobile Menu Drawer */}
        {showMobileMenu && (
          <div className="border-b border-theme bg-primary p-4 shadow-theme-md">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onAddText();
                  setShowMobileMenu(false);
                }}
                className="justify-start gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDuplicate();
                  setShowMobileMenu(false);
                }}
                className="justify-start gap-2"
              >
                <Copy className="h-4 w-4" />
                Duplicate Scene
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDelete();
                  setShowMobileMenu(false);
                }}
                className="justify-start gap-2 text-red-600"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onTogglePreview();
                  setShowMobileMenu(false);
                }}
                className="justify-start gap-2"
              >
                {isPreviewMode ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Edit Mode
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Preview Mode
                  </>
                )}
              </Button>
              {onImportJson && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onImportJson();
                    setShowMobileMenu(false);
                  }}
                  className="justify-start gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  Import JSON
                </Button>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Tablet/Desktop Layout
  return (
    <header className="flex h-16 items-center justify-between border-b border-theme bg-primary px-6 shadow-theme-sm">
      <div className="flex items-center gap-3">
        <Type className="h-5 w-5 text-accent" />
        <Input
          value={templateName}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Template name"
          className="w-48 border-theme bg-secondary text-primary lg:w-64"
        />
        {!isTablet && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onAddText}
              className="h-9 w-9 rounded-full"
              title="Add Text"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDuplicate}
              className="h-9 w-9 rounded-full"
              title="Duplicate Scene"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-9 w-9 rounded-full text-red-600"
              title="Delete Scene"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
          className="h-9 w-9"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Cmd+Shift+Z)"
          className="h-9 w-9"
        >
          <Redo className="h-4 w-4" />
        </Button>
        <div className="mx-2 h-6 w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={onTogglePreview} className="gap-2">
          {isPreviewMode ? (
            <>
              <EyeOff className="h-4 w-4" />
              {!isTablet && 'Edit'}
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              {!isTablet && 'Preview'}
            </>
          )}
        </Button>
        {onImportJson && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onImportJson}
            title="Import JSON"
            className="h-9 w-9"
          >
            <FileJson className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          className="gap-2 rounded-full bg-accent px-4 hover:bg-accent-hover"
        >
          <Save className="h-4 w-4" />
          {!isTablet && 'Save'}
        </Button>
      </div>
    </header>
  );
};

export default EditorToolbar;
