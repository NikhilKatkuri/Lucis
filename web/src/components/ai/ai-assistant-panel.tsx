"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  PaperPlaneRightIcon,
  RobotIcon,
  SparkleIcon,
  SpinnerGapIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffectiveCoordinates } from "@/hooks/use-user-location";
import { aiService } from "@/services/ai.service";
import { ApiError } from "@/services/api.client";
import { cn } from "@/lib/utils";

const MESSAGE_MIN = 3;
const MESSAGE_MAX = 400;

const messageSchema = z.object({
  message: z
    .string()
    .min(MESSAGE_MIN, `Ask a question of at least ${MESSAGE_MIN} characters.`)
    .max(MESSAGE_MAX, `Keep it under ${MESSAGE_MAX} characters.`),
});

type MessageForm = z.infer<typeof messageSchema>;

interface Turn {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * Situational Q&A over the server's own context bundle.
 *
 * The assistant can only see the JSON context Lucis assembles for the user's
 * coordinates, and every answer is prefixed as machine-generated — the same
 * human-in-the-loop framing the prototype carries.
 */
export function AiAssistantPanel({ className }: { className?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { coordinates } = useEffectiveCoordinates();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const prompt = values.message.trim();
    const turnId = crypto.randomUUID();

    setTurns((previous) => [
      ...previous,
      { id: `user-${turnId}`, role: "user", content: prompt },
    ]);
    reset();

    try {
      const response = await aiService.chat({
        message: prompt,
        location: coordinates,
        radiusKm: 10,
      });

      setTurns((previous) => [
        ...previous,
        {
          id: `assistant-${turnId}`,
          role: "assistant",
          content: response.content,
        },
      ]);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "The assistant is unavailable right now.";

      setTurns((previous) => [
        ...previous,
        { id: `assistant-${turnId}`, role: "assistant", content: message },
      ]);
    }
  });

  return (
    <>
      {/* Launcher */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed right-4 bottom-20 z-30 gap-2 shadow-elevation-4 md:right-6 md:bottom-6",
          className,
        )}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <RobotIcon className="size-5" weight="fill" aria-hidden="true" />
        Ask Lucis
      </Button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="ai-panel"
            role="dialog"
            aria-modal="false"
            aria-label="Ask Lucis"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.05, 0.7, 0.1, 1] }}
            className={cn(
              "fixed inset-x-3 bottom-3 z-40 flex max-h-[70dvh] flex-col overflow-hidden",
              "rounded-sheet border border-border bg-surface shadow-elevation-5",
              "sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]",
            )}
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-container text-primary-container-foreground"
                >
                  <SparkleIcon className="size-4" weight="fill" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Ask Lucis
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Answers from live situational context
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsOpen(false)}
                aria-label="Close the assistant"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </Button>
            </header>

            <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {turns.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                  <RobotIcon
                    aria-hidden="true"
                    className="size-8 text-muted-foreground"
                  />
                  <p className="text-sm font-medium text-foreground">
                    What is happening near me?
                  </p>
                  <p className="max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
                    Lucis answers using only the alerts, risk zones, weather and
                    resources recorded for your coordinates. It cannot direct an
                    evacuation.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {turns.map((turn) => (
                      <motion.li
                        key={turn.id}
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                          turn.role === "user"
                            ? "self-end rounded-br-sm bg-primary text-primary-foreground"
                            : "self-start rounded-bl-sm bg-muted text-foreground",
                        )}
                      >
                        {turn.content}
                      </motion.li>
                    ))}
                  </AnimatePresence>

                  {isSubmitting ? (
                    <li className="flex items-center gap-2 self-start rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-xs text-muted-foreground">
                      <SpinnerGapIcon
                        aria-hidden="true"
                        className="size-3.5 animate-spin"
                      />
                      Consulting the context service…
                    </li>
                  ) : null}
                </ul>
              )}
            </div>

            <form
              onSubmit={onSubmit}
              className="border-t border-border p-3"
              noValidate
            >
              <label htmlFor="ai-message" className="sr-only">
                Your question
              </label>
              <Textarea
                id="ai-message"
                rows={2}
                placeholder="e.g. Which shelter is closest and is it open?"
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "ai-message-error" : undefined}
                className="min-h-16 resize-none rounded-field text-sm"
                {...register("message")}
              />

              {errors.message ? (
                <p
                  id="ai-message-error"
                  role="alert"
                  className="mt-1.5 text-xs text-danger"
                >
                  {errors.message.message}
                </p>
              ) : null}

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] text-muted-foreground">
                  Machine-generated — verify before acting.
                </p>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  {isSubmitting ? (
                    <SpinnerGapIcon className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <PaperPlaneRightIcon
                      className="size-4"
                      weight="fill"
                      aria-hidden="true"
                    />
                  )}
                  Send
                </Button>
              </div>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
