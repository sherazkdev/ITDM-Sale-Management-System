"use client";

import { useEffect } from "react";

/** Warn on tab close when a form has unsaved edits. */
export function useUnsavedChangesWarning(isDirty: boolean, message = "You have unsaved changes.") {
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, message]);
}
