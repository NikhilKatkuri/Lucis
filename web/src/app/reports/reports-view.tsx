"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  MapPinIcon,
  PaperPlaneRightIcon,
  SpinnerGapIcon,
  UsersThreeIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/layout/page-shell";
import { FilterChips } from "@/components/shared/filter-chips";
import { SearchBar } from "@/components/shared/search-bar";
import { SkeletonRows } from "@/components/shared/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { Chip } from "@/components/shared/chip";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommunityReportCard } from "@/components/reports/community-report-card";
import { DEFAULT_RADIUS_KM } from "@/constants/app";
import { useReports } from "@/hooks/use-live-data";
import { useEffectiveCoordinates } from "@/hooks/use-user-location";
import { ApiError } from "@/services/api.client";
import { distanceKm, formatLocation } from "@/lib/format";
import { cn } from "@/lib/utils";

const MESSAGE_MIN = 3;
const MESSAGE_MAX = 500;

const reportSchema = z.object({
  message: z
    .string()
    .min(MESSAGE_MIN, `Describe what you are seeing in at least ${MESSAGE_MIN} characters.`)
    .max(MESSAGE_MAX, `Keep the report under ${MESSAGE_MAX} characters.`),
});

type ReportForm = z.infer<typeof reportSchema>;
type ScopeFilter = "ALL" | "NEARBY";

/** Live citizen reports plus an optimistic submission form. */
export function ReportsView() {
  const {
    coordinates,
    isFallback: isUsingFallback,
  } = useEffectiveCoordinates();
  const [scope, setScope] = useState<ScopeFilter>("ALL");
  const [query, setQuery] = useState("");

  const radiusKm = scope === "NEARBY" ? DEFAULT_RADIUS_KM : undefined;
  const { reports, isLoading, isError, error, submit, isSubmitting, submitError } =
    useReports(radiusKm);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return reports;

    return reports.filter((report) =>
      report.message.toLowerCase().includes(needle),
    );
  }, [reports, query]);

  const stats = useMemo(() => {
    let nearby = 0;
    let verified = 0;

    for (const report of reports) {
      if (report.verified) verified += 1;
      const km = distanceKm(coordinates, {
        latitude: report.location.coordinates[1],
        longitude: report.location.coordinates[0],
      });
      if (km <= DEFAULT_RADIUS_KM) nearby += 1;
    }

    return { nearby, verified };
  }, [reports, coordinates]);

  /** Submits, then confirms. Failures surface inline via `submitError`. */
  const handleSubmitReport = async (message: string) => {
    await submit(message);
    toast.success("Report submitted", {
      description: "It is now visible to responders in the live feed.",
    });
  };

  return (
    <>
      <PageHeader
        kicker="Field reports"
        title="Community reports"
        description="Observations submitted by residents, newest first."
        actions={
          <Chip tone="neutral" size="sm" variant="outline">
            <MapPinIcon className="size-3.5" aria-hidden="true" />
            {formatLocation(coordinates)}
          </Chip>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Reports received"
          value={String(reports.length).padStart(2, "0")}
          note="Since the server started"
          icon={<UsersThreeIcon />}
          tone="primary"
        />
        <StatCard
          label={`Within ${DEFAULT_RADIUS_KM} km`}
          value={String(stats.nearby).padStart(2, "0")}
          note="Close to your position"
          icon={<MapPinIcon />}
          tone="info"
        />
        <StatCard
          label="Verified"
          value={String(stats.verified).padStart(2, "0")}
          note="Confirmed by responders"
          icon={<CheckCircleIcon />}
          tone="success"
        />
      </div>

      {isError ? (
        <ErrorState kind="api" description={error?.message} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
        <ReportComposer
          onSubmit={handleSubmitReport}
          isSubmitting={isSubmitting}
          error={submitError}
          isUsingFallback={isUsingFallback}
        />

        <Panel
          title="Report feed"
          subtitle={`${visible.length} shown`}
          actions={
            <FilterChips<ScopeFilter>
              label="Filter reports by proximity"
              value={scope}
              onChange={setScope}
              size="sm"
              options={[
                { value: "ALL", label: "All" },
                { value: "NEARBY", label: `Within ${DEFAULT_RADIUS_KM} km` },
              ]}
            />
          }
        >
          <div className="flex flex-col gap-4">
            <SearchBar
              value={query}
              onValueChange={setQuery}
              label="Search reports"
              placeholder="Search report text"
              containerClassName="max-w-md"
            />

            {isLoading ? (
              <SkeletonRows rows={4} />
            ) : visible.length === 0 ? (
              <EmptyState
                kind="reports"
                title={reports.length === 0 ? "No reports yet" : "No matching reports"}
                description={
                  reports.length === 0
                    ? "Be the first to report conditions in your area using the form."
                    : "Try a different search term or widen the proximity filter."
                }
                actionLabel={reports.length > 0 ? "Clear search" : undefined}
                onAction={reports.length > 0 ? () => setQuery("") : undefined}
              />
            ) : (
              <ul className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {visible.map((report) => (
                    <li key={report.id}>
                      <CommunityReportCard report={report} />
                    </li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Reporting responsibly" subtitle="What helps and what does not">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-warning-container text-warning-container-foreground"
          >
            <WarningIcon className="size-5" />
          </span>
          <div className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            <p>
              Reports are unverified by default. Describe what you can observe —
              water depth, blocked roads, damaged structures — and include a rough
              time.
            </p>
            <p>
              Never enter a hazard zone to gather evidence, and do not rely on
              community reports as a substitute for official emergency instructions.
            </p>
          </div>
        </div>
      </Panel>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Submission form                                                            */
/* -------------------------------------------------------------------------- */

function ReportComposer({
  onSubmit,
  isSubmitting,
  error,
  isUsingFallback,
}: {
  onSubmit: (message: string) => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}) {
  // React Hook Form's handleSubmit returns callbacks that cannot be memoized,
  // so the React Compiler skips this component. This is a known limitation of
  // RHF, not a defect in this code.
  /* eslint-disable react-hooks/incompatible-library */
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: { message: "" },
  });

  const message = watch("message");
  const length = message.length;

  const onValid = handleSubmit(async (values) => {
    await onSubmit(values.message.trim());
    reset();
  });

  /* eslint-enable react-hooks/incompatible-library */

  const errorMessage =
    error instanceof ApiError
      ? (error.fieldMessages[0] ?? error.message)
      : error?.message;

  const pending = isSubmitting;

  return (
    <Panel
      title="Submit a report"
      subtitle="Attached to your current position"
      className="h-fit"
    >
      <form onSubmit={onValid} className="flex flex-col gap-4" noValidate>
        <div>
          <label
            htmlFor="report-message"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            What are you seeing?
          </label>

          <Textarea
            id="report-message"
            rows={5}
            placeholder="e.g. Standing water about 30 cm deep across the main road near the east bridge, impassable on foot."
            aria-invalid={Boolean(errors.message)}
            aria-describedby="report-message-help"
            className="min-h-32 rounded-field text-sm"
            {...register("message")}
          />

          <div className="mt-1.5 flex items-start justify-between gap-3">
            <p id="report-message-help" className="text-xs text-muted-foreground">
              {errors.message ? (
                <span role="alert" className="text-danger">
                  {errors.message.message}
                </span>
              ) : isUsingFallback ? (
                "Using the default regional centre — reports are not tied to you."
              ) : (
                "Your position is attached automatically."
              )}
            </p>

            <span
              aria-live="polite"
              className={cn(
                "shrink-0 text-xs tabular-nums",
                length > MESSAGE_MAX ? "text-danger" : "text-muted-foreground",
              )}
            >
              {length} / {MESSAGE_MAX}
            </span>
          </div>
        </div>

        {errorMessage ? <ErrorState kind="api" description={errorMessage} /> : null}

        <Button type="submit" disabled={pending} className="w-full gap-2">
          {pending ? (
            <SpinnerGapIcon className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <PaperPlaneRightIcon
              className="size-4"
              weight="fill"
              aria-hidden="true"
            />
          )}
          {pending ? "Submitting…" : "Submit report"}
        </Button>
      </form>
    </Panel>
  );
}
