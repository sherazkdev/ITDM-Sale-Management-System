import type { FieldErrors, FieldValues } from "react-hook-form";

/** Show Zod/RHF messages only after touch or submit (Prompt #14/#15 UX). */
export function fieldErrorMessage<T extends FieldValues>(
  name: keyof T & string,
  touched: Partial<Record<keyof T, boolean>>,
  isSubmitted: boolean,
  errors: FieldErrors<T>,
): string | undefined {
  if (!(touched[name] || isSubmitted)) return undefined;
  const err = errors[name];
  if (!err || typeof err.message !== "string") return undefined;
  return err.message;
}

export function fieldHasError<T extends FieldValues>(
  name: keyof T & string,
  touched: Partial<Record<keyof T, boolean>>,
  isSubmitted: boolean,
  errors: FieldErrors<T>,
): boolean {
  return Boolean(fieldErrorMessage(name, touched, isSubmitted, errors));
}
