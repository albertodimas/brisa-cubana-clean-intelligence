import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDragDrop } from "./use-drag-drop";

describe("useDragDrop", () => {
  it("inicializa con estado por defecto", () => {
    const { result } = renderHook(() => useDragDrop());

    expect(result.current.state).toEqual({
      isDragging: false,
      draggedItemId: null,
      draggedItemData: null,
      dropTargetId: null,
    });
  });

  it("handleDragStart actualiza el estado correctamente", () => {
    const { result } = renderHook(() => useDragDrop());

    act(() => {
      result.current.handleDragStart("item-1", "some-data");
    });

    expect(result.current.state).toEqual({
      isDragging: true,
      draggedItemId: "item-1",
      draggedItemData: "some-data",
      dropTargetId: null,
    });
  });

  it("handleDragStart funciona sin itemData", () => {
    const { result } = renderHook(() => useDragDrop());

    act(() => {
      result.current.handleDragStart("item-1");
    });

    expect(result.current.state).toEqual({
      isDragging: true,
      draggedItemId: "item-1",
      draggedItemData: null,
      dropTargetId: null,
    });
  });

  it("handleDragOver actualiza dropTargetId", () => {
    const { result } = renderHook(() => useDragDrop());

    // Start dragging
    act(() => {
      result.current.handleDragStart("item-1", "data");
    });

    // Drag over target
    act(() => {
      result.current.handleDragOver("target-1");
    });

    expect(result.current.state.dropTargetId).toBe("target-1");
    expect(result.current.state.isDragging).toBe(true);
    expect(result.current.state.draggedItemId).toBe("item-1");
  });

  it("handleDragOver puede cambiar entre múltiples targets", () => {
    const { result } = renderHook(() => useDragDrop());

    act(() => {
      result.current.handleDragStart("item-1");
    });

    act(() => {
      result.current.handleDragOver("target-1");
    });

    expect(result.current.state.dropTargetId).toBe("target-1");

    act(() => {
      result.current.handleDragOver("target-2");
    });

    expect(result.current.state.dropTargetId).toBe("target-2");
  });

  it("handleDragLeave limpia dropTargetId", () => {
    const { result } = renderHook(() => useDragDrop());

    act(() => {
      result.current.handleDragStart("item-1");
    });

    act(() => {
      result.current.handleDragOver("target-1");
    });

    expect(result.current.state.dropTargetId).toBe("target-1");

    act(() => {
      result.current.handleDragLeave();
    });

    expect(result.current.state.dropTargetId).toBeNull();
    // Other state should remain
    expect(result.current.state.isDragging).toBe(true);
    expect(result.current.state.draggedItemId).toBe("item-1");
  });

  it("handleDragEnd resetea todo el estado", () => {
    const { result } = renderHook(() => useDragDrop());

    // Setup a full drag state
    act(() => {
      result.current.handleDragStart("item-1", "data");
    });

    act(() => {
      result.current.handleDragOver("target-1");
    });

    expect(result.current.state).toEqual({
      isDragging: true,
      draggedItemId: "item-1",
      draggedItemData: "data",
      dropTargetId: "target-1",
    });

    // End drag
    act(() => {
      result.current.handleDragEnd();
    });

    expect(result.current.state).toEqual({
      isDragging: false,
      draggedItemId: null,
      draggedItemData: null,
      dropTargetId: null,
    });
  });

  it("flujo completo de drag and drop", () => {
    const { result } = renderHook(() => useDragDrop());

    // 1. Start dragging
    act(() => {
      result.current.handleDragStart("booking-123", "2025-11-15T10:00:00.000Z");
    });

    expect(result.current.state.isDragging).toBe(true);
    expect(result.current.state.draggedItemId).toBe("booking-123");
    expect(result.current.state.draggedItemData).toBe(
      "2025-11-15T10:00:00.000Z",
    );

    // 2. Hover over first target
    act(() => {
      result.current.handleDragOver("2025-11-16");
    });

    expect(result.current.state.dropTargetId).toBe("2025-11-16");

    // 3. Leave first target
    act(() => {
      result.current.handleDragLeave();
    });

    expect(result.current.state.dropTargetId).toBeNull();

    // 4. Hover over second target
    act(() => {
      result.current.handleDragOver("2025-11-17");
    });

    expect(result.current.state.dropTargetId).toBe("2025-11-17");

    // 5. Drop (end drag)
    act(() => {
      result.current.handleDragEnd();
    });

    expect(result.current.state).toEqual({
      isDragging: false,
      draggedItemId: null,
      draggedItemData: null,
      dropTargetId: null,
    });
  });

  it("handlers están memoizados correctamente", () => {
    const { result, rerender } = renderHook(() => useDragDrop());

    const initialHandlers = {
      handleDragStart: result.current.handleDragStart,
      handleDragEnd: result.current.handleDragEnd,
      handleDragOver: result.current.handleDragOver,
      handleDragLeave: result.current.handleDragLeave,
    };

    // Trigger state change
    act(() => {
      result.current.handleDragStart("item-1");
    });

    // Rerender
    rerender();

    // Handlers should remain the same (memoized with useCallback)
    expect(result.current.handleDragStart).toBe(
      initialHandlers.handleDragStart,
    );
    expect(result.current.handleDragEnd).toBe(initialHandlers.handleDragEnd);
    expect(result.current.handleDragOver).toBe(initialHandlers.handleDragOver);
    expect(result.current.handleDragLeave).toBe(
      initialHandlers.handleDragLeave,
    );
  });

  it("puede almacenar datos complejos como JSON string", () => {
    const { result } = renderHook(() => useDragDrop());

    const complexData = JSON.stringify({
      bookingId: "booking-123",
      originalDate: "2025-11-15T10:00:00.000Z",
      propertyId: "property-456",
    });

    act(() => {
      result.current.handleDragStart("item-1", complexData);
    });

    expect(result.current.state.draggedItemData).toBe(complexData);

    // Can parse back
    const parsed = JSON.parse(result.current.state.draggedItemData!);
    expect(parsed.bookingId).toBe("booking-123");
    expect(parsed.originalDate).toBe("2025-11-15T10:00:00.000Z");
    expect(parsed.propertyId).toBe("property-456");
  });

  it("múltiples llamadas a handleDragStart sobrescriben el estado", () => {
    const { result } = renderHook(() => useDragDrop());

    act(() => {
      result.current.handleDragStart("item-1", "data-1");
    });

    expect(result.current.state.draggedItemId).toBe("item-1");
    expect(result.current.state.draggedItemData).toBe("data-1");

    // Start dragging another item (shouldn't happen in normal flow, but should handle it)
    act(() => {
      result.current.handleDragStart("item-2", "data-2");
    });

    expect(result.current.state.draggedItemId).toBe("item-2");
    expect(result.current.state.draggedItemData).toBe("data-2");
  });

  it("handleDragEnd puede ser llamado sin iniciar drag", () => {
    const { result } = renderHook(() => useDragDrop());

    // Should not throw error
    act(() => {
      result.current.handleDragEnd();
    });

    expect(result.current.state).toEqual({
      isDragging: false,
      draggedItemId: null,
      draggedItemData: null,
      dropTargetId: null,
    });
  });

  it("handleDragOver puede ser llamado sin iniciar drag", () => {
    const { result } = renderHook(() => useDragDrop());

    // Should not throw error
    act(() => {
      result.current.handleDragOver("target-1");
    });

    expect(result.current.state.dropTargetId).toBe("target-1");
    expect(result.current.state.isDragging).toBe(false);
  });
});
