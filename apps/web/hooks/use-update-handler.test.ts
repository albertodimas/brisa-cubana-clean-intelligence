import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUpdateHandler } from "./use-update-handler";

type ActionResult = { success?: string; error?: string };

function createFormData(): FormData {
  const formData = new FormData();
  formData.set("field", "value");
  return formData;
}

describe("useUpdateHandler", () => {
  it("submits updates and notifies success", async () => {
    const updateFn = vi.fn<
      (id: string, formData: FormData) => Promise<ActionResult>
    >(async () => ({ success: "ok" }));
    const onToast = vi.fn();
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useUpdateHandler(updateFn, onToast, onSuccess),
    );

    const data = createFormData();

    await act(async () => {
      await result.current.handleUpdate("service-1", data);
    });

    expect(updateFn).toHaveBeenCalledWith("service-1", data);
    expect(onToast).toHaveBeenCalledWith("ok", "success");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(result.current.updatingId).toBeNull();
  });

  it("reports errors without calling onSuccess", async () => {
    const updateFn = vi.fn<
      (id: string, formData: FormData) => Promise<ActionResult>
    >(async () => ({ error: "boom" }));
    const onToast = vi.fn();
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useUpdateHandler(updateFn, onToast, onSuccess),
    );

    await act(async () => {
      await result.current.handleUpdate("prop-9", createFormData());
    });

    expect(onToast).toHaveBeenCalledWith("boom", "error");
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.updatingId).toBeNull();
  });

  it("awaits onSuccess before finishing", async () => {
    const updateFn = vi.fn<
      (id: string, formData: FormData) => Promise<ActionResult>
    >(async () => ({ success: "updated" }));
    const onToast = vi.fn();
    const order: string[] = [];
    const onSuccess = vi.fn(async () => {
      order.push("onSuccess-start");
      await new Promise((resolve) => setTimeout(resolve, 0));
      order.push("onSuccess-end");
    });

    const { result } = renderHook(() =>
      useUpdateHandler(updateFn, onToast, onSuccess),
    );

    await act(async () => {
      order.push("handleUpdate");
      await result.current.handleUpdate("user-2", createFormData());
      order.push("handleUpdate-complete");
    });

    expect(order).toEqual([
      "handleUpdate",
      "onSuccess-start",
      "onSuccess-end",
      "handleUpdate-complete",
    ]);
  });
});
