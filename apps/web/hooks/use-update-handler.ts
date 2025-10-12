/**
 * Custom hook for handling update actions with loading state and toast notifications
 */

import { useCallback, useState } from "react";
import type { ActionResult } from "@/lib/types";

type UpdateFunction = (id: string, formData: FormData) => Promise<ActionResult>;

type OnToastFunction = (message: string, type: "success" | "error") => void;

/**
 * Hook to manage update operations with loading state and toast notifications
 * @param updateFn - Server action function that performs the update
 * @param onToast - Function to show toast notifications
 * @param onSuccess - Optional callback to run after successful update
 * @returns Object with handleUpdate function and updatingId state
 */
export function useUpdateHandler(
  updateFn: UpdateFunction,
  onToast: OnToastFunction,
  onSuccess?: () => void | Promise<void>,
) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdate = useCallback(
    async (id: string, formData: FormData) => {
      setUpdatingId(id);
      const result = await updateFn(id, formData);
      setUpdatingId(null);

      if (result.error) {
        onToast(result.error, "error");
      } else if (result.success) {
        onToast(result.success, "success");
        if (onSuccess) {
          await onSuccess();
        }
      }
    },
    [updateFn, onToast, onSuccess],
  );

  return { handleUpdate, updatingId };
}
