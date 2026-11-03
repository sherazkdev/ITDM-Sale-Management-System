export type AuthPrincipal = {
  userId: bigint;
  username: string;
  displayName: string;
  permissions: Set<string>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      principal?: AuthPrincipal;
    }
  }
}
