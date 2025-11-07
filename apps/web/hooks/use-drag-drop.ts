import { useState, useCallback } from "react";

export type DragDropState = {
  isDragging: boolean;
  draggedItemId: string | null;
  draggedItemData: string | null; // Can store JSON-stringified data
  dropTargetId: string | null;
};

export function useDragDrop() {
  const [state, setState] = useState<DragDropState>({
    isDragging: false,
    draggedItemId: null,
    draggedItemData: null,
    dropTargetId: null,
  });

  const handleDragStart = useCallback((itemId: string, itemData?: string) => {
    setState({
      isDragging: true,
      draggedItemId: itemId,
      draggedItemData: itemData || null,
      dropTargetId: null,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setState({
      isDragging: false,
      draggedItemId: null,
      draggedItemData: null,
      dropTargetId: null,
    });
  }, []);

  const handleDragOver = useCallback((targetId: string) => {
    setState((prev) => ({
      ...prev,
      dropTargetId: targetId,
    }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dropTargetId: null,
    }));
  }, []);

  return {
    state,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
  };
}
