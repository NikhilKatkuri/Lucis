"use client";

import { useTheme } from "next-themes";
import {
  CheckCircleIcon,
  DesktopIcon,
  FloppyDiskIcon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  SunIcon,
  TranslateIcon,
  WarningIcon,
  WaveformIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/layout/page-shell";
import { Chip } from "@/components/shared/chip";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";

import { useHydrated } from "@/hooks/use-hydrated";
import { usePreference } from "@/hooks/use-preference";

import { FALLBACK_COORDINATES, HAZARDS, HAZARD_LABEL } from "@/constants/app";
import { queryKeys } from "@/lib/query-keys";
import { useSimulationState } from "@/hooks/use-live-data";
import { useUserLocation } from "@/hooks/use-user-location";
import { useSocket } from "@/providers/socket.provider";
import { aiService } from "@/services/ai.service";
import { deviceService } from "@/services/device.service";
import { getDeviceId } from "@/lib/device-id";
import { formatLocation } from "@/lib/format";
import { isKnownScenario } from "@/lib/socket-events";
import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";

const THEMES: { value: ThemeChoice; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: DesktopIcon },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
] as const;

/** Theme, language, notification and simulation preferences. */
export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  // Both preferences live in localStorage through an external store, so they
  // hydrate without an effect that sets state on mount.
  const [notifications, setNotifications] = usePreference("notifications", true);
  const [language, setLanguage] = usePreference("language", "en");

  const { state, start, pause, resume, reset, isLoading } = useSimulationState();
  const { simulationTick, isConnected, status } = useSocket();
  const {
    coordinates: detectedPosition,
    isUsingFallback,
    status: locationStatus,
    requestPermission,
    accuracy,
  } = useUserLocation();
  const coordinates = detectedPosition ?? FALLBACK_COORDINATES;

  const providers = useQuery({
    queryKey: queryKeys.ai.providers(),
    queryFn: aiService.providers,
    staleTime: Infinity,
  });

  const handleNotifications = async (enabled: boolean) => {
    setNotifications(enabled);

    try {
      await deviceService.setPreferences({
        deviceId: getDeviceId(),
        notificationEnabled: enabled,
      });
      toast.success(enabled ? "Notifications enabled" : "Notifications muted");
    } catch {
      toast.warning("Saved locally", {
        description: "The backend could not be updated.",
      });
    }
  };

  const handleLanguage = async (next: string) => {
    setLanguage(next);

    try {
      await deviceService.setPreferences({ deviceId: getDeviceId(), language: next });
    } catch {
      // The selector still updates locally.
    }
  };

  const scenario = state?.scenario ?? "FLOOD";
  const isRunning = state?.status === "RUNNING";

  return (
    <>
      <PageHeader
        kicker="Preferences"
        title="Settings"
        description="Theme, language, notifications and the simulation harness."
        actions={
          <Chip tone={isConnected ? "success" : "warning"} size="sm" variant="tonal">
            <WaveformIcon className="size-3.5" aria-hidden="true" />
            {status === "connected" ? "Realtime connected" : "Realtime offline"}
          </Chip>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Appearance */}
        <Panel title="Appearance" subtitle="Theme preference">
          <fieldset>
            <legend className="sr-only">Colour theme</legend>
            <div
              role="radiogroup"
              aria-label="Colour theme"
              className="grid grid-cols-3 gap-2"
            >
              {THEMES.map((option) => {
                const Icon = option.icon;
                const isActive = (theme ?? "system") === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-card border p-4 transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      isActive
                        ? "border-primary bg-primary-container text-primary-container-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon
                      className="size-6"
                      weight={isActive ? "fill" : "regular"}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                    {isActive && hydrated ? (
                      <CheckCircleIcon
                        className="size-4"
                        weight="fill"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </Panel>

        {/* Notifications & language */}
        <Panel title="Notifications" subtitle="How you are alerted">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="notifications" className="text-sm">
                Critical and high alerts
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Show a toast the moment a high-severity alert is raised.
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={(checked) => void handleNotifications(checked)}
              aria-label="Enable critical and high alert notifications"
            />
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <Label
              htmlFor="language"
              className="flex items-center gap-1.5 text-sm"
            >
              <TranslateIcon className="size-4" aria-hidden="true" />
              Language
            </Label>
            <Select value={language} onValueChange={(next) => void handleLanguage(next)}>
              <SelectTrigger id="language" className="mt-2 w-full">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              Stored against this device so alerts can be prioritised by region.
            </p>
          </div>
        </Panel>

        {/* Location */}
        <Panel title="Location" subtitle="Used for proximity filtering">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Chip
                  tone={
                    locationStatus === "granted"
                      ? "success"
                      : locationStatus === "locating"
                        ? "warning"
                        : "danger"
                  }
                  size="sm"
                  variant="tonal"
                >
                  {locationStatus}
                </Chip>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Coordinates</dt>
              <dd className="font-medium text-foreground tabular-nums">
                {formatLocation(coordinates)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Accuracy</dt>
              <dd className="font-medium text-foreground tabular-nums">
                {accuracy === null ? "—" : `±${Math.round(accuracy)} m`}
              </dd>
            </div>
          </dl>

          {isUsingFallback ? (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-full"
              onClick={requestPermission}
              disabled={locationStatus === "locating"}
            >
              {locationStatus === "locating" ? "Locating…" : "Allow precise location"}
            </Button>
          ) : null}
        </Panel>

        {/* Simulation */}
        <Panel
          title="Simulation mode"
          subtitle="Drive the backend's synthetic scenario"
          actions={
            <Chip
              tone={isRunning ? "info" : "neutral"}
              size="sm"
              variant="tonal"
            >
              {state?.status.toLowerCase() ?? "unknown"}
            </Chip>
          }
        >
          {isLoading && !state ? (
            <p className="text-sm text-muted-foreground">Loading state…</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="scenario" className="text-sm">
                  Hazard scenario
                </Label>
                <Select
                  value={isKnownScenario(scenario) ? scenario : "FLOOD"}
                  onValueChange={(next) => start.mutate(next)}
                >
                  <SelectTrigger id="scenario" className="mt-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HAZARDS.map((hazard) => (
                      <SelectItem key={hazard} value={hazard}>
                        {HAZARD_LABEL[hazard]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">
                  Changing the scenario restarts the simulation and immediately
                  recalculates the risk zone.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {isRunning ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => pause.mutate()}
                    disabled={pause.isPending}
                  >
                    <PauseIcon className="size-4" weight="fill" aria-hidden="true" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => resume.mutate()}
                    disabled={resume.isPending}
                  >
                    <PlayIcon className="size-4" weight="fill" aria-hidden="true" />
                    Resume
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => start.mutate(scenario)}
                  disabled={start.isPending}
                >
                  <PlayIcon className="size-4" aria-hidden="true" />
                  Restart
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => reset.mutate()}
                  disabled={reset.isPending}
                >
                  <FloppyDiskIcon className="size-4" aria-hidden="true" />
                  Reset all
                </Button>
              </div>

              <p className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                <WarningIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-warning"
                />
                Reset clears every risk zone and alert the server is holding, and no
                socket event announces it — the app refetches on your behalf.
              </p>

              <p className="text-xs text-muted-foreground tabular-nums">
                Current tick: {simulationTick || state?.tick || 0} · scenario{" "}
                {scenario.toLowerCase()}
              </p>
            </div>
          )}
        </Panel>
      </div>

      {/* AI providers */}
      <Panel
        title="Assistant providers"
        subtitle="Configured on the server, in fallback order"
      >
        {providers.isError ? (
          <ErrorState
            kind="api"
            description={providers.error?.message}
            onRetry={() => void providers.refetch()}
          />
        ) : providers.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading providers…</p>
        ) : (providers.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            No AI providers are configured on the server.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {providers.data?.map((provider) => (
              <li key={`${provider.name}-${provider.priority}`}>
                <Chip tone="neutral" size="sm" variant="outline">
                  <span className="font-medium text-foreground">
                    {provider.priority}. {provider.name}
                  </span>
                  <span className="text-muted-foreground">{provider.status}</span>
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="About Lucis" subtitle="What this application is">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Lucis aggregates modelled hazard assessments, weather observations,
          resource registries and community reports into a single situational
          picture. Every estimate on these pages is generated by a model or
          submitted by a member of the public, and none of it constitutes an
          official emergency instruction. Always follow the guidance of local
          emergency services.
        </p>
      </Panel>
    </>
  );
}
