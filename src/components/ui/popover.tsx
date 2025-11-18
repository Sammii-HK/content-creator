'use client';

/* eslint-disable react-hooks/immutability */

import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface PopoverContextValue {
  open: boolean;
  setOpen: (value: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

const usePopoverContext = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover components must be used within <Popover>');
  }
  return context;
};

interface PopoverProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Popover = ({ children, open: controlledOpen, onOpenChange }: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const setOpen = useCallback(
    (value: boolean) => {
      onOpenChange?.(value);
      if (controlledOpen === undefined) {
        setUncontrolledOpen(value);
      }
    },
    [controlledOpen, onOpenChange]
  );

  const value = useMemo(
    () => ({
      open,
      setOpen,
      triggerRef,
      contentRef,
    }),
    [open, setOpen]
  );

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (
        !contentRef.current ||
        contentRef.current.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen]);

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
};

interface PopoverTriggerProps {
  children: React.ReactElement;
}

export const PopoverTrigger = ({ children }: PopoverTriggerProps) => {
  const { open, setOpen, triggerRef } = usePopoverContext();

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (children as any).ref;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && typeof childRef === 'object') {
        childRef.current = node;
      }
    },
    [triggerRef, children]
  );

  return cloneElement(children, {
    ref: handleRef,
    'aria-expanded': open,
    'data-popover-trigger': '',
    onClick: (event: React.MouseEvent) => {
      (children.props as any).onClick?.(event);
      setOpen(!open);
    },
  } as any);
};

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export const PopoverContent = ({
  children,
  className,
  align = 'center',
  sideOffset = 8,
}: PopoverContentProps) => {
  const { open, triggerRef, contentRef } = usePopoverContext();
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let left = rect.left + rect.width / 2;
    if (align === 'start') {
      left = rect.left;
    } else if (align === 'end') {
      left = rect.right;
    }
    setPosition({
      top: rect.bottom + sideOffset,
      left,
    });
  }, [open, align, sideOffset, triggerRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={contentRef}
      className={clsx(
        'z-50 rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-white/80',
        className
      )}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform:
          align === 'start'
            ? 'translateY(0)'
            : align === 'end'
              ? 'translate(-100%, 0)'
              : 'translate(-50%, 0)',
        minWidth: 200,
      }}
    >
      {children}
    </div>,
    document.body
  );
};
