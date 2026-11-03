import bcrypt from "bcryptjs";

const DEFAULT_ROUNDS = 12;

export async function hashPassword(plain: string, rounds = DEFAULT_ROUNDS): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
