"use client";

import { createContext, type RefObject, useContext } from "react";

export interface ActiveDrag {
  cardIndex: number;
  columnIndex: number;
}

export interface DragContextValue {
  activeDrag: ActiveDrag | null;
  attemptMove: (from: number, cardIndex: number, to: number) => boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  setActiveDrag: (drag: ActiveDrag | null) => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DragContextValue;
}) {
  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}

export function useDragContext(): DragContextValue {
  const ctx = useContext(DragContext);
  if (ctx === null) {
    throw new Error("useDragContext must be used within a DragProvider");
  }
  return ctx;
}

// Hit-test the DOM at the given viewport coordinates and return the column
// index whose `<section data-column-index>` is the topmost element at that
// point. Returns `null` if the point is not over any column.
export function findDropColumn(
  clientX: number,
  clientY: number
): number | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const el of elements) {
    if (!(el instanceof HTMLElement)) {
      continue;
    }
    const raw = el.getAttribute("data-column-index");
    if (raw === null) {
      continue;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      continue;
    }
    return parsed;
  }
  return null;
}
