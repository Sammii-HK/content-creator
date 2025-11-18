'use client';

import { useEffect, useMemo, useState } from 'react';
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

type BrollVideo = {
  id: string;
  name: string;
  fileUrl: string;
  duration?: number | null;
  createdAt?: string;
};

const BROLL_CACHE_KEY = 'visual-editor-broll-cache';
const BROLL_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

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

const formatDuration = (seconds?: number | null) => {
  if (!seconds || Number.isNaN(seconds)) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VisualTemplateEditor = () => {
  const [viewMode, setViewMode] = useState<'edit' | 'previewCuts' | 'previewFull'>('edit');
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);
  const [isJsonExportOpen, setIsJsonExportOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [availableVideos, setAvailableVideos] = useState<BrollVideo[]>([]);
  const [previewVideoId, setPreviewVideoId] = useState<string>('');
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState<string | null>(null);
  const [initialTemplate, setInitialTemplate] = useState<VideoTemplate | undefined>(undefined);

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

  // Load template from localStorage in useEffect to prevent hydration errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = loadTemplateFromLocalStorage();
      if (stored) {
        setInitialTemplate(stored);
      }
    }
  }, []);

  const selectedText = useMemo(() => {
    if (!selectedTextId) {
      return null;
    }

    // Find the text overlay with the matching ID across all scenes
    for (const scene of template.scenes) {
      if (scene.text?.id === selectedTextId) {
        return {
          ...scene.text,
          id: scene.text.id ?? `scene-${selectedSceneIndex + 1}`,
        };
      }
    }

    // Fallback to selected scene's text
    if (selectedScene?.text) {
      return {
        ...selectedScene.text,
        id: selectedScene.text.id ?? `scene-${selectedSceneIndex + 1}`,
      };
    }

    return null;
  }, [selectedTextId, template.scenes, selectedScene, selectedSceneIndex]);
  const activeSceneTextId = selectedScene?.text?.id ?? null;

  // Auto-select text when scene changes
  useEffect(() => {
    if (activeSceneTextId && viewMode === 'edit') {
      // Always select the scene's text when in edit mode
      if (selectedTextId !== activeSceneTextId) {
        selectText(activeSceneTextId);
      }
    }
  }, [activeSceneTextId, selectedTextId, selectText, viewMode]);
  useEffect(() => {
    let isMounted = true;

    const hydrateFromCache = () => {
      if (typeof window === 'undefined') return false;
      try {
        const raw = sessionStorage.getItem(BROLL_CACHE_KEY);
        if (!raw) {
          console.log('[VideoCanvas] No cached videos found');
          return false;
        }
        const cached = JSON.parse(raw) as {
          fetchedAt: number;
          videos: BrollVideo[];
          selectedId?: string | null;
        };
        if (!Array.isArray(cached.videos)) return false;
        const cacheAge = Date.now() - cached.fetchedAt;
        const isFresh = cacheAge < BROLL_CACHE_TTL;
        console.log('[VideoCanvas] Cache found:', {
          videoCount: cached.videos.length,
          age: Math.round(cacheAge / 1000) + 's',
          fresh: isFresh,
        });
        if (isMounted) {
          setAvailableVideos(cached.videos);
          // Auto-select first video if none selected
          setPreviewVideoId((current) => {
            if (!current && cached.videos.length > 0) {
              const selectedId = cached.selectedId ?? cached.videos[0]?.id ?? null;
              if (selectedId) {
                console.log('[VideoCanvas] Auto-selecting from cache:', selectedId);
                return selectedId;
              }
            }
            return current;
          });
          setVideosLoading(false);
        }
        return isFresh;
      } catch (error) {
        console.error('[VideoCanvas] Cache hydration error:', error);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(BROLL_CACHE_KEY);
        }
        return false;
      }
    };

    const fetchBroll = async (showLoading = true) => {
      if (showLoading) {
        setVideosLoading(true);
      }
      setVideosError(null);
      try {
        console.log('[VideoCanvas] Fetching b-roll videos...');
        const personaId =
          typeof window !== 'undefined' ? localStorage.getItem('activePersona') : null;
        const url = personaId
          ? `/api/broll?personaId=${personaId}&active=true`
          : '/api/broll?active=true';
        console.log('[VideoCanvas] Fetch URL:', url);
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`Unable to fetch videos (${response.status})`);
        }
        const data = await response.json();
        console.log('[VideoCanvas] Received videos:', data.broll?.length || 0);
        const filtered: BrollVideo[] = (data.broll || [])
          .filter(
            (video: BrollVideo & { fileUrl: string }) =>
              video.fileUrl &&
              !video.fileUrl.includes('/placeholder/') &&
              !video.fileUrl.includes('example.com') &&
              !video.fileUrl.includes('test.mp4')
          )
          .map((video: BrollVideo & { fileUrl: string }) => ({
            id: video.id,
            name: video.name || 'Untitled Clip',
            fileUrl: video.fileUrl,
            duration: video.duration ?? null,
            createdAt: video.createdAt,
          }));

        console.log('[VideoCanvas] Filtered videos:', filtered.length);
        if (isMounted) {
          setAvailableVideos(filtered);
          // Auto-select first video if none selected
          if (filtered.length > 0) {
            setPreviewVideoId((current) => {
              if (!current && filtered[0]?.id) {
                console.log('[VideoCanvas] Auto-selecting first video:', filtered[0].id);
                return filtered[0].id;
              }
              return current;
            });
          }
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(
              BROLL_CACHE_KEY,
              JSON.stringify({
                fetchedAt: Date.now(),
                videos: filtered,
                selectedId: filtered[0]?.id ?? null,
              })
            );
          }
        }
      } catch (error) {
        console.error('[VideoCanvas] Failed to load b-roll videos:', error);
        if (isMounted) {
          setVideosError('Unable to load your b-roll library. Please upload a clip.');
        }
      } finally {
        if (isMounted) {
          setVideosLoading(false);
          console.log('[VideoCanvas] Video loading complete');
        }
      }
    };

    const cacheFresh = hydrateFromCache();
    fetchBroll(!cacheFresh);
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-select first video when availableVideos is populated and no video is selected
  useEffect(() => {
    if (availableVideos.length > 0 && !previewVideoId && !videosLoading) {
      const firstVideoId = availableVideos[0]?.id;
      if (firstVideoId) {
        console.log('[VideoCanvas] Auto-selecting first available video:', firstVideoId);
        setPreviewVideoId(firstVideoId);
      }
    }
  }, [availableVideos, previewVideoId, videosLoading]);

  const selectedPreviewVideo =
    availableVideos.find((video) => video.id === previewVideoId) ?? availableVideos[0] ?? null;

  // Log selected video for debugging
  useEffect(() => {
    if (selectedPreviewVideo) {
      console.log('[VideoCanvas] Selected video:', {
        id: selectedPreviewVideo.id,
        name: selectedPreviewVideo.name,
        url: selectedPreviewVideo.fileUrl,
      });
    } else {
      console.log('[VideoCanvas] No video selected', {
        previewVideoId,
        availableCount: availableVideos.length,
      });
    }
  }, [selectedPreviewVideo, previewVideoId, availableVideos.length]);

  // Debug: Log canvas section rendering
  useEffect(() => {
    console.log('[Canvas] Canvas section should be visible', {
      hasVideo: !!selectedPreviewVideo?.fileUrl,
      videoUrl: selectedPreviewVideo?.fileUrl,
      mainWidth: 'flex-1',
    });
  }, [selectedPreviewVideo]);

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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSave={handleSave}
        onImportJson={() => setIsJsonDialogOpen(true)}
        onExportJson={() => {
          setJsonValue(JSON.stringify(template, null, 2));
          setIsJsonExportOpen(true);
        }}
      />
      <div
        className={`bg-background-secondary flex flex-col ${
          isMobile ? 'h-[calc(100vh-56px)]' : 'h-[calc(100vh-64px)]'
        }`}
      >
        <div className="flex h-full w-full flex-1 flex-col md:flex-row overflow-hidden min-h-0">
          <main
            className={`flex flex-1 flex-col overflow-y-auto min-w-100 relative min-h-[70%] ${
              isMobile ? 'gap-4 p-4 pb-[400px]' : 'gap-6 p-6'
            }`}
            style={{ flex: '1 1 0%' }}
          >
            <section className="rounded-3xl border border-theme/40 bg-background p-5 shadow-theme-sm backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 text-foreground">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground-secondary">
                    Preview Clip
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    Connect your b-roll to see text overlays in context.
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-2 md:max-w-md">
                  <Select
                    value={previewVideoId}
                    onValueChange={(value) => setPreviewVideoId(value)}
                    disabled={videosLoading || !availableVideos.length}
                  >
                    <SelectTrigger className="h-11 rounded-full border border-theme/50 bg-background-secondary text-foreground focus-visible:ring-0">
                      <SelectValue
                        placeholder={
                          videosLoading ? 'Loading clips...' : 'Select a clip from your library'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent align="end" className="w-[320px]">
                      {availableVideos.map((video) => (
                        <SelectItem key={video.id} value={video.id}>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{video.name}</span>
                            <span className="text-xs text-foreground-secondary">
                              Duration {formatDuration(video.duration)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {videosError && <p className="text-xs text-red-500">{videosError}</p>}
                  {!videosLoading && !availableVideos.length && !videosError && (
                    <p className="text-xs text-foreground-secondary">
                      No clips yet. Upload a video from your dashboard to preview templates with
                      your own footage.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Scene Timeline */}
            <section className="rounded-3xl border border-theme/40 bg-background p-5 shadow-theme-sm backdrop-blur relative z-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground-secondary">
                      Scene Timeline
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      Jump between cuts to fine-tune overlays frame by frame.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addTextScene}
                    className="h-10 rounded-full border border-dashed border-theme/60 text-foreground"
                  >
                    + Scene
                  </Button>
                </div>
                <div
                  className={`flex w-full gap-2 ${
                    isMobile ? 'flex-nowrap overflow-x-auto pb-1 pr-2' : 'flex-wrap'
                  }`}
                >
                  {template.scenes.map((scene, index) => {
                    const sceneStart = typeof scene.start === 'number' ? scene.start : index * 2; // fallback spacing
                    const sceneEnd = typeof scene.end === 'number' ? scene.end : sceneStart + 2;
                    return (
                      <button
                        key={scene.text?.id || index}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          selectedSceneIndex === index
                            ? 'bg-accent text-white shadow-theme-sm'
                            : 'border border-theme/60 bg-background-secondary text-foreground hover:border-theme'
                        }`}
                        onClick={() => selectScene(index)}
                      >
                        Scene {index + 1}{' '}
                        <span className="text-xs text-foreground-secondary">
                          {sceneStart.toFixed(1)}s – {sceneEnd.toFixed(1)}s
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Canvas - Centered and responsive */}
            <section className="flex min-h-[500px] flex-1 items-center justify-center rounded-lg border border-border/40 bg-background p-6 relative z-0">
              <InteractiveVideoCanvas
                videoUrl={selectedPreviewVideo?.fileUrl ?? ''}
                scene={selectedScene}
                scenes={template.scenes}
                selectedTextId={selectedTextId}
                content={TEST_CONTENT}
                viewMode={viewMode}
                onSelect={selectText}
                onPositionChange={updateTextPosition}
              />
            </section>
          </main>

          {/* Desktop Panel - Always render, CSS handles visibility (md+ screens) */}
          <PropertiesPanel
            text={selectedText}
            onPositionChange={(position) =>
              selectedText?.id && updateTextPosition(selectedText.id, position)
            }
            onStyleChange={(style) => selectedText?.id && updateTextStyle(selectedText.id, style)}
            onContentChange={(content) =>
              selectedText?.id && updateTextContent(selectedText.id, content)
            }
            isMobileSheet={false}
            onSelectDefaultText={
              activeSceneTextId ? () => selectText(activeSceneTextId) : undefined
            }
          />
        </div>
      </div>

      {/* Mobile Panel - Always render, CSS handles visibility (below md screens) */}
      <PropertiesPanel
        text={selectedText}
        onPositionChange={(position) =>
          selectedText?.id && updateTextPosition(selectedText.id, position)
        }
        onStyleChange={(style) => selectedText?.id && updateTextStyle(selectedText.id, style)}
        onContentChange={(content) =>
          selectedText?.id && updateTextContent(selectedText.id, content)
        }
        isMobileSheet={true}
        onSelectDefaultText={activeSceneTextId ? () => selectText(activeSceneTextId) : undefined}
      />

      {/* Import JSON Dialog */}
      <Dialog open={isJsonDialogOpen} onOpenChange={handleJsonDialogChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <div className="flex h-full flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Import Template JSON</DialogTitle>
              <DialogDescription>
                Paste a template JSON definition to instantly populate the visual editor.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto rounded-2xl border border-border/40 bg-background-secondary/30 p-1">
              <Textarea
                value={jsonValue}
                onChange={(event) => setJsonValue(event.target.value)}
                placeholder={JSON_PLACEHOLDER}
                className="h-full min-h-[280px] border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
              />
            </div>
            {jsonError && <p className="text-sm text-red-600">{jsonError}</p>}
            <DialogFooter className="gap-2 border-t border-border/40 pt-4">
              <Button variant="ghost" onClick={() => handleJsonDialogChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleImportJson} disabled={!jsonValue.trim()}>
                Load Template
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export/Review JSON Dialog */}
      <Dialog open={isJsonExportOpen} onOpenChange={setIsJsonExportOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <div className="flex h-full flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Template JSON</DialogTitle>
              <DialogDescription>Review or copy your template JSON definition.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto rounded-lg border border-border/40 bg-background-secondary/30 p-4">
              <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                {JSON.stringify(template, null, 2)}
              </pre>
            </div>
            <DialogFooter className="gap-2 border-t border-border/40 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(template, null, 2));
                  alert('Template JSON copied to clipboard!');
                }}
              >
                Copy JSON
              </Button>
              <Button variant="ghost" onClick={() => setIsJsonExportOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisualTemplateEditor;
