import {
  ApiClientError,
  apiFetch,
  apiGet,
  apiPatch,
  apiPost,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  getApiBaseUrl,
} from "./client";

export type ThemePreferencesPayload = {
  mode?: "light" | "dark" | "system";
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
};

export type UserProfile = {
  userId: string;
  username: string;
  displayName: string;
  email: string | null;
  profilePhone: string | null;
  profileLocation: string | null;
  profileBio: string | null;
  themePreferences: ThemePreferencesPayload | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
};

export type UpdateUserProfileInput = {
  displayName?: string;
  email?: string | null;
  profilePhone?: string | null;
  profileLocation?: string | null;
  profileBio?: string | null;
  themePreferences?: ThemePreferencesPayload;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function fetchUserProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>("/users/me");
}

export async function patchUserProfile(body: UpdateUserProfileInput): Promise<UserProfile> {
  return apiPatch<UserProfile, UpdateUserProfileInput>("/users/me", body);
}

export async function changeUserPassword(body: ChangePasswordInput): Promise<{ changed: boolean }> {
  return apiPost<{ changed: boolean }, ChangePasswordInput>("/users/me/password", body);
}

export async function uploadUserAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData();
  form.append("avatar", file);
  const res = await apiFetch<{ avatarUrl: string }>("/users/me/avatar", {
    method: "POST",
    body: form,
  });
  return res.data;
}

/** Avatar image URL for the authenticated user (cookie session). */
export function userAvatarSrc(hasAvatar: boolean): string | undefined {
  if (!hasAvatar) return undefined;
  return "/api/v1/users/me/avatar";
}

export type EntityImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

export async function postEntityImport(importPath: string, file: File): Promise<EntityImportResult> {
  const normalized = importPath.startsWith("/") ? importPath : `/${importPath}`;
  const url = `${getApiBaseUrl()}${normalized}`;
  const form = new FormData();
  form.append("file", file);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: form,
      credentials: "include",
      headers: {
        [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError("Network error — check your connection and try again.", 0, "NETWORK_ERROR");
  }

  const body = (await response.json()) as
    | { success: true; data: EntityImportResult }
    | { success: false; error: { message: string } };

  if (!response.ok || !("success" in body) || !body.success) {
    const message =
      "error" in body && body.error?.message
        ? body.error.message
        : response.statusText || "Import failed";
    throw new Error(message);
  }
  return body.data;
}
