import { useCallback, useMemo, useState } from 'react';

export interface SnapPoints {
  horizontal: number[];
  vertical: number[];
}

export interface SnapGuidesState {
  horizontal?: number;
  vertical?: number;
}

export interface SnapInput {
  x: number;
  y: number;
}

export interface SnapGuidesHook {
  snapPoints: SnapPoints;
  activeGuides: SnapGuidesState;
  calculateSnappedPosition: (input: SnapInput) => SnapInput;
  resetGuides: () => void;
}

const DEFAULT_SNAP_POINTS: SnapPoints = {
  horizontal: [0, 25, 33.33, 50, 66.67, 75, 100],
  vertical: [0, 25, 33.33, 50, 66.67, 75, 100],
};

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const findSnapPoint = (value: number, points: number[], threshold: number) => {
  for (const point of points) {
    if (Math.abs(value - point) <= threshold) {
      return point;
    }
  }
  return null;
};

export const useSnapGuides = (
  overrides?: Partial<SnapPoints>,
  threshold: number = 3
): SnapGuidesHook => {
  const snapPoints = useMemo<SnapPoints>(
    () => ({
      horizontal: overrides?.horizontal || DEFAULT_SNAP_POINTS.horizontal,
      vertical: overrides?.vertical || DEFAULT_SNAP_POINTS.vertical,
    }),
    [overrides]
  );

  const [activeGuides, setActiveGuides] = useState<SnapGuidesState>({});

  const calculateSnappedPosition = useCallback(
    (input: SnapInput): SnapInput => {
      const snappedX = findSnapPoint(input.x, snapPoints.vertical, threshold);
      const snappedY = findSnapPoint(input.y, snapPoints.horizontal, threshold);

      setActiveGuides({
        vertical: snappedX === null ? undefined : snappedX,
        horizontal: snappedY === null ? undefined : snappedY,
      });

      return {
        x: clamp(snappedX ?? input.x),
        y: clamp(snappedY ?? input.y),
      };
    },
    [snapPoints.horizontal, snapPoints.vertical, threshold]
  );

  const resetGuides = useCallback(() => {
    setActiveGuides({});
  }, []);

  return {
    snapPoints,
    activeGuides,
    calculateSnappedPosition,
    resetGuides,
  };
};
