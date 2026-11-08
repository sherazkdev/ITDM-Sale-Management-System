"use client";

import { Check, Monitor, Moon, Palette, RotateCcw, Save, Sun } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useBrandTheme } from "@/components/providers/BrandThemeProvider";
import { THEME_PRESETS, presetSwatch, type ThemeChannel } from "@/lib/theme-palette";
import { cn } from "@/lib/utils";
import { ApiClientError } from "@/lib/api/client";

const COLOR_CHANNELS: Array<{ key: ThemeChannel; label: string; description: string }> = [
  { key: "primary", label: "Primary color", description: "Buttons, links, and key highlights (ORLEN red by default)." },
  { key: "secondary", label: "Secondary color", description: "Subtle surfaces and secondary actions." },
  { key: "accent", label: "Accent color", description: "Hover states and soft accent backgrounds." },
];

export default function ThemeSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { colors, setColors, resetColors, saveToServer } = useBrandTheme();

  const onSave = async () => {
    try {
      await saveToServer();
      toast.success("Theme settings saved.");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not save theme.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Theme &amp; appearance</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Color mode and brand palette — synced to your ITDMS user profile when signed in.
            </p>
          </div>
          <Button onClick={() => void onSave()}>
            <Save className="h-4 w-4" /> Save changes
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" /> Color mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              { value: "light" as const, label: "Light", icon: Sun },
              { value: "dark" as const, label: "Dark", icon: Moon },
              { value: "system" as const, label: "System", icon: Monitor },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                    active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:bg-muted",
                  )}
                  aria-pressed={active}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" /> Brand colors
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Preset palettes update CSS tokens live. Default primary is rose (ORLEN red).
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetColors}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {COLOR_CHANNELS.map((channel) => (
            <div key={channel.key} className="flex flex-col gap-2">
              <div>
                <p className="text-sm font-medium">{channel.label}</p>
                <p className="text-xs text-muted-foreground">{channel.description}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {THEME_PRESETS.map((preset) => {
                  const active = colors[channel.key] === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setColors({ [channel.key]: preset.id })}
                      className={cn(
                        "relative h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-card transition-shadow",
                        active ? "ring-foreground/40" : "ring-transparent hover:ring-border",
                      )}
                      style={{ backgroundColor: `hsl(${presetSwatch(preset.id)})` }}
                      title={preset.label}
                      aria-pressed={active}
                    >
                      {active ? <Check className="h-4 w-4 text-white mx-auto" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Live preview
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Primary action</Button>
              <Button size="sm" variant="secondary">
                Secondary
              </Button>
              <Button size="sm" variant="soft">
                Soft
              </Button>
              <Badge>Badge</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
