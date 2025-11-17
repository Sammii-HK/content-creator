export interface SceneMapping {
  outputStart: number;
  outputEnd: number;
  videoStart: number;
  videoEnd: number;
  scene: any;
  sceneIndex: number;
}

export const getSceneVideoMapping = (
  scenes: any[] = [],
  sourceVideoDuration: number
): SceneMapping[] => {
  return scenes.map((scene: any, index: number) => {
    if (scene.videoStart !== undefined && scene.videoEnd !== undefined) {
      return {
        outputStart: scene.start,
        outputEnd: scene.end,
        videoStart: scene.videoStart,
        videoEnd: scene.videoEnd,
        scene,
        sceneIndex: index,
      };
    }

    const sceneDuration = scene.end - scene.start;
    const totalScenes = scenes.length || 1;
    const videoSegmentDuration = sourceVideoDuration / totalScenes;
    const videoStart = index * videoSegmentDuration;
    const videoEnd = Math.min(videoStart + sceneDuration, sourceVideoDuration);

    return {
      outputStart: scene.start,
      outputEnd: scene.end,
      videoStart,
      videoEnd,
      scene,
      sceneIndex: index,
    };
  });
};
