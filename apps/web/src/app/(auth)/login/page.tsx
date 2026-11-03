"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User as UserIcon, Package, FileText, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, AuthShowcase } from "@/components/auth/AuthShell";
import { LoginItdmsIllo } from "@/components/auth/illustrations";
import { loginInputSchema, type LoginInput } from "@/lib/validators/auth";
import { loginRequest } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { ServiceUnavailableBanner } from "@/components/shell/ServiceUnavailableBanner";
import { useAuth } from "@/components/providers/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") ?? "/dashboard";
  const reason = search.get("reason");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { refresh, serviceUnavailable } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (reason === "session_expired") {
      setServerError("Your session expired. Please sign in again.");
    } else if (reason === "api_unavailable") {
      setServerError(null);
    }
  }, [reason]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await loginRequest(values.username.trim(), values.password);
      queryClient.removeQueries({ queryKey: ["auth"] });
      await refresh();
      toast.success("Welcome back!", { description: values.username });
      router.push(redirect.startsWith("/") ? redirect : "/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.status === 401
            ? "Invalid username or password."
            : err.message
          : "Sign-in failed. Please try again.";
      setServerError(message);
    }
  };

  return (
    <AuthShell
      footer={
        <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Secure session.</span> Authentication is managed by the
            ITDMS API using HttpOnly cookies — not browser localStorage.
          </p>
        </div>
      }
      showcase={
        <AuthShowcase
          illustration={<LoginItdmsIllo />}
          heading={
            <>
              IT operations in one place —{" "}
              <span className="text-primary-300">assets, procurement, and finance</span>
            </>
          }
          subheading="Sign in to access modules allowed by your assigned permissions (configurable; D01 provisional)."
          features={[
            { icon: Package, title: "Asset register", desc: "Track hardware, issuance, and maintenance history." },
            { icon: FileText, title: "Procurement", desc: "Vendors, contracts, and purchase orders." },
            { icon: Wrench, title: "Operations", desc: "Maintenance, licenses, documents, and reports." },
          ]}
        />
      }
    >
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome back <span aria-hidden>👋</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in with your ITDMS username and password.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4" noValidate>
        {serviceUnavailable || reason === "api_unavailable" ? (
          <ServiceUnavailableBanner compact />
        ) : null}
        {serverError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            placeholder="Enter your username"
            leftIcon={<UserIcon />}
            error={!!errors.username}
            aria-invalid={!!errors.username}
            {...register("username")}
          />
          {errors.username ? <p className="text-xs text-destructive">{errors.username.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            leftIcon={<Lock />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            }
            error={!!errors.password}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
          {!isSubmitting ? (
            <>
              Sign in <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            "Signing you in..."
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
