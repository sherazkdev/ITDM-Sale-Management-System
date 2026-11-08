"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, Camera, Loader2, Mail, MapPin, Phone, User as UserIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api/client";
import { fetchUserProfile, patchUserProfile, uploadUserAvatar, userAvatarSrc } from "@/lib/api/user-profile";
import { useAuth } from "@/components/providers/AuthProvider";

const schema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(255),
  email: z.string().email().max(255).optional().or(z.literal("")),
  profilePhone: z.string().trim().max(64).optional(),
  profileLocation: z.string().trim().max(255).optional(),
  profileBio: z.string().trim().max(4000).optional(),
});

type FormValues = z.infer<typeof schema>;

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export default function ProfileSettingsPage() {
  const { session, refresh } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["user", "profile", "me"],
    queryFn: fetchUserProfile,
    enabled: session.status === "authenticated",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "",
      email: "",
      profilePhone: "",
      profileLocation: "",
      profileBio: "",
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    reset({
      displayName: profile.displayName,
      email: profile.email ?? "",
      profilePhone: profile.profilePhone ?? "",
      profileLocation: profile.profileLocation ?? "",
      profileBio: profile.profileBio ?? "",
    });
  }, [profileQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      patchUserProfile({
        displayName: values.displayName,
        email: values.email || null,
        profilePhone: values.profilePhone || null,
        profileLocation: values.profileLocation || null,
        profileBio: values.profileBio || null,
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["user", "profile", "me"] });
      await refresh();
      reset({
        displayName: data.displayName,
        email: data.email ?? "",
        profilePhone: data.profilePhone ?? "",
        profileLocation: data.profileLocation ?? "",
        profileBio: data.profileBio ?? "",
      });
      toast.success("Profile updated.");
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Save failed"),
  });

  const avatarMutation = useMutation({
    mutationFn: uploadUserAvatar,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "profile", "me"] });
      await refresh();
      toast.success("Profile photo updated.");
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Could not upload image.";
      setAvatarError(message);
      toast.error(message);
    },
  });

  if (session.status !== "authenticated") {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  const profile = profileQuery.data;
  const avatarSrc =
    avatarPreview ??
    (profile?.avatarUrl ? userAvatarSrc(true) : undefined);

  const clearPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setAvatarPreview(null);
  };

  const handleAvatarFile = (file?: File | null) => {
    if (!file) return;
    setAvatarError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setAvatarError("Unsupported format. Use PNG, JPG, WEBP, or GIF.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image is too large. Maximum size is 2MB.");
      return;
    }
    clearPreview();
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setAvatarPreview(objectUrl);
    avatarMutation.mutate(file, { onSettled: () => clearPreview() });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Personal details for ITDMS. Job title and department sync from your linked employee record when present.
          </p>
        </CardHeader>
        <CardContent>
          {profileQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <form
              onSubmit={handleSubmit((v) => saveMutation.mutate(v))}
              className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <UserAvatar
                    name={profile?.displayName ?? session.user.displayName}
                    src={avatarSrc}
                    size={120}
                  />
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                    aria-label="Change avatar"
                    disabled={avatarMutation.isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={(e) => {
                      handleAvatarFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
                {avatarError ? (
                  <p className="max-w-[180px] text-center text-xs text-destructive">{avatarError}</p>
                ) : (
                  <p className="text-center text-[11px] text-muted-foreground">
                    PNG, JPG, WEBP or GIF · max 2MB
                  </p>
                )}
                <p className="text-xs text-muted-foreground">@{session.user.username}</p>
                {profile?.jobTitle ? (
                  <p className="text-xs text-muted-foreground text-center">
                    {profile.jobTitle}
                    {profile.department ? ` · ${profile.department}` : ""}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="displayName">Display name</Label>
                    <Input
                      id="displayName"
                      leftIcon={<UserIcon />}
                      error={!!errors.displayName}
                      {...register("displayName")}
                    />
                    {errors.displayName ? (
                      <p className="text-xs text-destructive">{errors.displayName.message}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" leftIcon={<Mail />} {...register("email")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="profilePhone">Phone</Label>
                    <Input id="profilePhone" leftIcon={<Phone />} {...register("profilePhone")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="profileLocation">Location</Label>
                    <Input id="profileLocation" leftIcon={<MapPin />} {...register("profileLocation")} />
                  </div>
                </div>

                {profile?.jobTitle ? (
                  <div className="flex flex-col gap-1.5">
                    <Label>Job title (from employee record)</Label>
                    <Input value={profile.jobTitle} disabled leftIcon={<Briefcase />} />
                  </div>
                ) : null}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profileBio">Bio</Label>
                  <textarea
                    id="profileBio"
                    rows={3}
                    maxLength={4000}
                    className="w-full rounded-lg border border-input bg-card p-3 text-sm shadow-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring resize-none"
                    placeholder="Optional notes visible only in your profile…"
                    {...register("profileBio")}
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!isDirty || isSubmitting || saveMutation.isPending}
                    onClick={() => profile && reset()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={isSubmitting || saveMutation.isPending}
                    disabled={!isDirty}
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
