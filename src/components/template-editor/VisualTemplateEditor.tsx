'use client';

import { useMemo, useState } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import EditorToolbar from '@/components/template-editor/EditorToolbar';
import InteractiveVideoCanvas from '@/components/template-editor/InteractiveVideoCanvas';
import PropertiesPanel from '@/components/template-editor/PropertiesPanel';
import { useTemplateEditor } from '@/hooks/useTemplateEditor';
import { useResponsive } from '@/hooks/useResponsive';
import type { VideoTemplate } from '@/lib/video';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FONT_GOOGLE_URL } from './presets';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const TEST_CONTENT: Record<string, string> = {
  hook: 'This changes everything...',
  content: 'Five ways to level up your content game today.',
  question: 'What if you could double your reach in 7 days?',
  answer: 'It starts with a magnetic hook and clear visual hierarchy.',
  title: 'Fast Visual Editor',
};

const JSON_PLACEHOLDER = `{
  "name": "Hook + Content",
  "duration": 12,
  "scenes": [
    {
      "start": 0,
      "end": 3,
      "text": {
        "content": "{{hook}}",
        "position": { "x": 50, "y": 22 },
        "style": {
          "fontSize": 54,
          "fontWeight": "bold",
          "color": "#ffffff",
          "stroke": "#000000",
          "strokeWidth": 2
        }
      }
    }
  ]
}`;

const SAMPLE_VIDEOS = [
  {
    id: 'sunset',
    name: 'Sunset Deck',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    duration: 12,
  },
  {
    id: 'escape',
    name: 'Coastal Escape',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 15,
  },
];

const LOCAL_STORAGE_KEY = 'visual-template-draft';

const saveTemplateToLocalStorage = (templateJson: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templateJson));
  } catch (err) {
    console.warn('Failed to persist template draft', err);
  }
};

const loadTemplateFromLocalStorage = (): VideoTemplate | null => {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(LOCAL_STORAGE_KEY);
    return value ? (JSON.parse(value) as VideoTemplate) : null;
  } catch (err) {
    console.warn('Failed to parse template draft', err);
    return null;
  }
};

const VisualTemplateEditor = () => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string>(SAMPLE_VIDEOS[0].id);

  const [initialTemplate] = useState<VideoTemplate | undefined>(() => {
    const stored = loadTemplateFromLocalStorage();
    return stored ?? undefined;
  });

  const {
    template,
    selectedScene,
    selectedSceneIndex,
    selectedTextId,
    loadTemplate,
    updateTemplateName,
    selectScene,
    selectText,
    updateTextPosition,
    updateTextStyle,
    updateTextContent,
    addTextScene,
    duplicateSelectedScene,
    deleteSelectedScene,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTemplateEditor(initialTemplate);

  const selectedText = useMemo(() => {
    if (!selectedScene?.text) {
      return null;
    }
    return {
      ...selectedScene.text,
      id: selectedScene.text.id ?? `scene-${selectedSceneIndex + 1}`,
    };
  }, [selectedScene, selectedSceneIndex]);
  const selectedPreviewVideo =
    SAMPLE_VIDEOS.find((video) => video.id === previewVideoId) ?? SAMPLE_VIDEOS[0];

  const handleSave = () => {
    saveTemplateToLocalStorage(template);
    alert('Template draft saved locally.');
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      loadTemplate(parsed as VideoTemplate);
      setJsonError(null);
      setIsJsonDialogOpen(false);
      setJsonValue('');
      alert('Template loaded from JSON!');
    } catch {
      setJsonError('Invalid JSON template. Please verify the structure and try again.');
    }
  };

  const handleJsonDialogChange = (open: boolean) => {
    setIsJsonDialogOpen(open);
    if (!open) {
      setJsonValue('');
      setJsonError(null);
    }
  };

  const { isMobile } = useResponsive();

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONT_GOOGLE_URL} />
      </Head>
      <EditorToolbar
        templateName={template.name ?? 'Visual Template'}
        onNameChange={updateTemplateName}
        onAddText={addTextScene}
        onDuplicate={duplicateSelectedScene}
        onDelete={deleteSelectedScene}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        isPreviewMode={isPreviewMode}
        onTogglePreview={() => setIsPreviewMode((prev) => !prev)}
        onSave={handleSave}
        onImportJson={() => setIsJsonDialogOpen(true)}
      />
      <div
        className={`flex overflow-hidden bg-secondary ${isMobile ? 'h-[calc(100vh-56px)] flex-col' : 'h-[calc(100vh-64px)]'}`}
      >
        <main className={`flex flex-1 flex-col overflow-y-auto ${isMobile ? 'p-4' : 'p-6'} gap-4`}>
          {/* Video Selector - Compact on mobile */}
          {!isMobile && (
            <section className="rounded-2xl border border-theme bg-elevated p-4 shadow-theme-sm">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    Preview Clip
                  </p>
                  <p className="text-xs text-tertiary">Sample b-roll for layout preview</p>
                </div>
                <Select value={previewVideoId} onValueChange={(value) => setPreviewVideoId(value)}>
                  <SelectTrigger className="w-48 border-theme bg-primary text-primary">
                    <SelectValue placeholder="Choose clip" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_VIDEOS.map((video) => (
                      <SelectItem key={video.id} value={video.id}>
                        {video.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>
          )}

          {/* Scene Timeline */}
          <section
            className={`rounded-2xl border border-theme bg-elevated shadow-theme-sm ${isMobile ? 'p-3' : 'p-4'}`}
          >
            <div
              className={`mb-2 text-xs font-semibold uppercase tracking-wider text-secondary ${isMobile ? 'text-center' : ''}`}
            >
              Scenes
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {template.scenes.map((scene, index) => (
                <button
                  key={scene.text?.id || index}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedSceneIndex === index
                      ? 'bg-accent text-white shadow-md'
                      : 'border border-theme bg-primary text-primary hover:bg-tertiary'
                  }`}
                  onClick={() => selectScene(index)}
                >
                  {index + 1}
                </button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={addTextScene}
                className="h-9 w-9 rounded-full border border-dashed border-theme"
              >
                +
              </Button>
            </div>
          </section>

          {/* Canvas - Centered and responsive */}
          <section className="flex flex-1 items-center justify-center">
            <InteractiveVideoCanvas
              videoUrl={selectedPreviewVideo.url}
              scene={selectedScene}
              selectedTextId={selectedTextId}
              content={TEST_CONTENT}
              isPreviewMode={isPreviewMode}
              onSelect={selectText}
              onPositionChange={updateTextPosition}
            />
          </section>
        </main>

        {/* Properties Panel - Responsive */}
        <PropertiesPanel
          text={selectedText}
          onPositionChange={(position) =>
            selectedText?.id && updateTextPosition(selectedText.id, position)
          }
          onStyleChange={(style) => selectedText?.id && updateTextStyle(selectedText.id, style)}
          onContentChange={(content) =>
            selectedText?.id && updateTextContent(selectedText.id, content)
          }
        />
      </div>

      <Dialog open={isJsonDialogOpen} onOpenChange={handleJsonDialogChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Template JSON</DialogTitle>
            <DialogDescription>
              Paste a template JSON definition to instantly populate the visual editor.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={jsonValue}
            onChange={(event) => setJsonValue(event.target.value)}
            placeholder={JSON_PLACEHOLDER}
            className="min-h-[280px] rounded-2xl border-slate-200 bg-slate-50 font-mono text-sm"
          />
          {jsonError && <p className="text-sm text-red-600">{jsonError}</p>}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => handleJsonDialogChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportJson} disabled={!jsonValue.trim()}>
              Load Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisualTemplateEditor;
