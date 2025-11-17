import { useCallback, useMemo, useState } from 'react';
import type { VideoTemplate, VideoScene, TextOverlay } from '@/lib/video';

export interface TemplateEditorState {
  template: VideoTemplate;
  selectedSceneIndex: number;
  selectedTextId: string | null;
  selectedScene: VideoScene | null;
  loadTemplate: (nextTemplate: VideoTemplate) => void;
  updateTemplateName: (name: string) => void;
  selectScene: (index: number) => void;
  selectText: (textId: string | null) => void;
  updateTextPosition: (textId: string, position: TextOverlay['position']) => void;
  updateTextStyle: (textId: string, style: Partial<TextOverlay['style']>) => void;
  updateTextContent: (textId: string, content: string) => void;
  addTextScene: () => void;
  duplicateSelectedScene: () => void;
  deleteSelectedScene: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const DEFAULT_TEMPLATE: VideoTemplate = {
  name: 'New Visual Template',
  duration: 12,
  textStyle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    maxWidth: 90,
  },
  scenes: [
    {
      start: 0,
      end: 3,
      text: {
        id: 'scene-1',
        content: '{{hook}}',
        position: { x: 50, y: 20 },
        style: {
          fontSize: 56,
          fontWeight: 'bold',
          color: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
          maxWidth: 80,
        },
      },
    },
    {
      start: 3,
      end: 12,
      text: {
        id: 'scene-2',
        content: '{{content}}',
        position: { x: 50, y: 60 },
        style: {
          fontSize: 40,
          fontWeight: 'normal',
          color: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1,
          maxWidth: 85,
        },
      },
    },
  ],
};

const withStableIds = (template: VideoTemplate): VideoTemplate => {
  const cloned = structuredClone(template) as VideoTemplate;
  cloned.scenes = cloned.scenes.map((scene, index) => {
    const text = scene.text;
    if (!text) {
      return {
        ...scene,
        text: {
          id: crypto.randomUUID(),
          content: '',
          position: { x: 50, y: 50 },
          style: {
            fontSize: 48,
            fontWeight: 'bold',
            color: '#ffffff',
          },
        },
      };
    }
    return {
      ...scene,
      text: {
        ...text,
        id: text.id || `scene-${index + 1}-${crypto.randomUUID()}`,
        style: {
          ...text.style,
          fontSize: text.style?.fontSize ?? 48,
          fontWeight: text.style?.fontWeight ?? 'bold',
          color: text.style?.color ?? '#ffffff',
        },
      },
    };
  });
  return cloned;
};

export const useTemplateEditor = (initialTemplate?: VideoTemplate): TemplateEditorState => {
  const [history, setHistory] = useState<{ past: VideoTemplate[]; future: VideoTemplate[] }>({
    past: [],
    future: [],
  });
  const [template, setTemplate] = useState<VideoTemplate>(() =>
    withStableIds(initialTemplate || DEFAULT_TEMPLATE)
  );
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(
    template.scenes[0]?.text?.id || null
  );

  const selectedScene = template.scenes[selectedSceneIndex] || null;

  const commitTemplate = useCallback(
    (nextTemplate: VideoTemplate) => {
      setHistory((prev) => ({
        past: [...prev.past.slice(-20), template],
        future: [],
      }));
      setTemplate(nextTemplate);
    },
    [template]
  );

  const updateSceneText = useCallback(
    (textId: string, updater: (text: TextOverlay) => TextOverlay) => {
      commitTemplate({
        ...template,
        scenes: template.scenes.map((scene) => {
          if (scene.text?.id !== textId) {
            return scene;
          }
          return {
            ...scene,
            text: updater(scene.text),
          };
        }),
      });
    },
    [commitTemplate, template]
  );

  const updateTextPosition = useCallback(
    (textId: string, position: TextOverlay['position']) => {
      updateSceneText(textId, (text) => ({
        ...text,
        position,
      }));
    },
    [updateSceneText]
  );

  const updateTextStyle = useCallback(
    (textId: string, style: Partial<TextOverlay['style']>) => {
      updateSceneText(textId, (text) => ({
        ...text,
        style: {
          ...text.style,
          ...style,
        },
      }));
    },
    [updateSceneText]
  );

  const updateTextContent = useCallback(
    (textId: string, content: string) => {
      updateSceneText(textId, (text) => ({
        ...text,
        content,
      }));
    },
    [updateSceneText]
  );

  const loadTemplate = useCallback(
    (nextTemplate: VideoTemplate) => {
      const normalized = withStableIds(nextTemplate);
      commitTemplate(normalized);
      setSelectedSceneIndex(0);
      setSelectedTextId(normalized.scenes[0]?.text?.id || null);
    },
    [commitTemplate]
  );

  const updateTemplateName = useCallback(
    (name: string) => {
      commitTemplate({
        ...template,
        name,
      });
    },
    [commitTemplate, template]
  );

  const selectScene = useCallback(
    (index: number) => {
      setSelectedSceneIndex(index);
      const scene = template.scenes[index];
      setSelectedTextId(scene?.text?.id || null);
    },
    [template.scenes]
  );

  const selectText = useCallback((textId: string | null) => {
    setSelectedTextId(textId);
  }, []);

  const addTextScene = useCallback(() => {
    const lastScene = template.scenes[template.scenes.length - 1];
    const start = lastScene?.end ?? 0;
    const end = Math.min(template.duration, start + 3);
    const newScene: VideoScene = {
      start,
      end,
      text: {
        id: crypto.randomUUID(),
        content: '{{content}}',
        position: { x: 50, y: 50 },
        style: {
          fontSize: 36,
          fontWeight: 'normal',
          color: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1,
          maxWidth: 80,
        },
      },
    };
    commitTemplate({
      ...template,
      scenes: [...template.scenes, newScene],
    });
    setSelectedSceneIndex(template.scenes.length);
    setSelectedTextId(newScene.text?.id || null);
  }, [commitTemplate, template]);

  const duplicateSelectedScene = useCallback(() => {
    const scene = template.scenes[selectedSceneIndex];
    if (!scene) return;
    const clonedScene: VideoScene = {
      ...scene,
      start: Math.min(scene.start + 1, template.duration - 1),
      end: Math.min(scene.end + 1, template.duration),
      text: {
        ...scene.text,
        id: crypto.randomUUID(),
        position: { ...scene.text.position },
        style: { ...scene.text.style },
      },
    };
    const nextScenes = [...template.scenes];
    nextScenes.splice(selectedSceneIndex + 1, 0, clonedScene);
    commitTemplate({
      ...template,
      scenes: nextScenes,
    });
    setSelectedSceneIndex(selectedSceneIndex + 1);
    setSelectedTextId(clonedScene.text.id || null);
  }, [commitTemplate, selectedSceneIndex, template]);

  const deleteSelectedScene = useCallback(() => {
    if (template.scenes.length <= 1) return;
    const nextScenes = template.scenes.filter((_, idx) => idx !== selectedSceneIndex);
    const nextIndex = Math.max(0, selectedSceneIndex - 1);
    commitTemplate({
      ...template,
      scenes: nextScenes,
    });
    setSelectedSceneIndex(nextIndex);
    setSelectedTextId(nextScenes[nextIndex]?.text?.id || null);
  }, [commitTemplate, selectedSceneIndex, template]);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (!prev.past.length) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      setTemplate(previous);
      return {
        past: newPast,
        future: [template, ...prev.future],
      };
    });
  }, [template]);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (!prev.future.length) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      setTemplate(next);
      return {
        past: [...prev.past, template],
        future: newFuture,
      };
    });
  }, [template]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return useMemo(
    () => ({
      template,
      selectedSceneIndex,
      selectedTextId,
      selectedScene,
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
    }),
    [
      addTextScene,
      canRedo,
      canUndo,
      deleteSelectedScene,
      duplicateSelectedScene,
      redo,
      loadTemplate,
      updateTemplateName,
      selectScene,
      selectText,
      selectedScene,
      selectedSceneIndex,
      selectedTextId,
      template,
      undo,
      updateTextContent,
      updateTextPosition,
      updateTextStyle,
    ]
  );
};
