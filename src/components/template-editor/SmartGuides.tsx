import type { SnapGuidesState, SnapPoints } from '@/hooks/useSnapGuides';

interface SmartGuidesProps {
  activeGuides: SnapGuidesState;
  snapPoints: SnapPoints;
  showBaseline?: boolean;
}

const SmartGuides = ({ activeGuides, snapPoints, showBaseline = true }: SmartGuidesProps) => {
  return (
    <div className="pointer-events-none absolute inset-0">
      {showBaseline &&
        snapPoints.vertical.map((value) => (
          <div
            key={`baseline-v-${value}`}
            className="absolute top-0 bottom-0 w-px bg-white/5"
            style={{ left: `${value}%` }}
          />
        ))}
      {showBaseline &&
        snapPoints.horizontal.map((value) => (
          <div
            key={`baseline-h-${value}`}
            className="absolute left-0 right-0 h-px bg-white/5"
            style={{ top: `${value}%` }}
          />
        ))}
      {activeGuides.vertical !== undefined && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-indigo-400"
          style={{ left: `${activeGuides.vertical}%` }}
        />
      )}
      {activeGuides.horizontal !== undefined && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-indigo-400"
          style={{ top: `${activeGuides.horizontal}%` }}
        />
      )}
    </div>
  );
};

export default SmartGuides;
