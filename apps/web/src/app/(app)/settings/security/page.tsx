"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError } from "@/lib/api/client";
import { changeUserPassword } from "@/lib/api/user-profile";

const passwordForm = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(12, "At least 12 characters").max(128),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type PasswordValues = z.infer<typeof passwordForm>;

export default function SecuritySettingsPage() {
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordForm),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: changeUserPassword,
    onSuccess: () => {
      toast.success("Password updated.");
      reset();
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Update failed"),
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Change password
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Password changes apply immediately to your ITDMS account session.
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="flex max-w-md flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type={show ? "text" : "password"}
                leftIcon={<KeyRound />}
                autoComplete="current-password"
                {...register("currentPassword")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type={show ? "text" : "password"}
                leftIcon={<KeyRound />}
                autoComplete="new-password"
                error={!!errors.newPassword}
                {...register("newPassword")}
              />
              {errors.newPassword ? (
                <p className="text-xs text-destructive">{errors.newPassword.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Minimum 12 characters.</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type={show ? "text" : "password"}
                leftIcon={<KeyRound />}
                autoComplete="new-password"
                error={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start px-0 h-auto text-muted-foreground"
              onClick={() => setShow((v) => !v)}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {show ? "Hide passwords" : "Show passwords"}
            </Button>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" disabled={!isDirty} onClick={() => reset()}>
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
                Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
