'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

const BottomSheet = ({ isOpen, onOpenChange, title, children }: BottomSheetProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (event: React.PointerEvent) => {
    setIsDragging(true);
    setStartY(event.clientY);
    setCurrentY(event.clientY);
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging) return;
      setCurrentY(event.clientY);
    };

    const handlePointerUp = () => {
      if (!isDragging) return;

      const deltaY = currentY - startY;
      if (deltaY > 100) {
        onOpenChange(false);
      }

      setIsDragging(false);
      setStartY(0);
      setCurrentY(0);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, currentY, startY, onOpenChange]);

  const translateY = isDragging ? Math.max(0, currentY - startY) : 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 transform rounded-t-3xl bg-primary shadow-theme-xl transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          transform: isOpen ? `translateY(${translateY}px)` : 'translateY(100%)',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex cursor-grab items-center justify-center py-3 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
        >
          <div className="h-1 w-12 rounded-full bg-tertiary" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme px-6 pb-3">
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-secondary hover:bg-secondary"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </>
  );
};

export default BottomSheet;
