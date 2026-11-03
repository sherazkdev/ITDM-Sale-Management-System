function isDecimalLike(value: unknown): value is { toFixed: (dp?: number) => string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toFixed?: unknown }).toFixed === "function"
  );
}

export function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (isDecimalLike(value)) {
    return value.toFixed(2);
  }
  return value;
}

export function toPublicJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, jsonReplacer)) as T;
}
