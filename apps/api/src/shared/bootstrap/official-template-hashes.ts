/** Expected SHA-256 of client official templates (integrity check after decode). */
export const OFFICIAL_TEMPLATE_SHA256 = {
  issuance: "ffc26c2f62b6fb8539f86b16517ea33bab458e9c9d73bd7b0ed894da19caeda4",
  return: "d1dc5237d54fbd070d4073c340090849069dba6f3c54fe8942d9552093f7750d",
} as const;

export const OFFICIAL_TEMPLATE_MIN_BYTES = 10_000;