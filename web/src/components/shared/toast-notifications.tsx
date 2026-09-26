"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useSocket } from "@/providers/socket.provider";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { SEVERITY_LABEL } from "@/lib/format";
import {
  canUseBrowserNotifications,
  requestBrowserNotifications,
  showBrowserNotification,
} from "@/lib/browser-notifications";

const seenAlerts = new Set<string>();

/**
 * Bridges socket activity into toast notifications.
 *
 * Mounted once in the app shell. Alerts are de-duplicated by id so a
 * change-gated `alert` event does not re-notify on every re-render.
 */
export function ToastNotifications() {
  const { alerts, status, safeMessage, dismissSafeMessage } = useSocket();
  const isOnline = useOnlineStatus();
  const previousStatus = useRef(status);

  // New critical and high alerts.
  useEffect(() => {
    for (const alert of Object.values(alerts)) {
      if (seenAlerts.has(alert.id)) continue;
      seenAlerts.add(alert.id);

      if (alert.severity === "CRITICAL" || alert.severity === "HIGH") {
        const description = `${SEVERITY_LABEL[alert.severity]} · ${alert.evidence.length} evidence sources`;
        const nativeShown = showBrowserNotification(alert.title, description, alert.id);
        toast.error(alert.title, {
          description,
          duration: 8000,
          action: !nativeShown && canUseBrowserNotifications()
            ? {
                label: "Enable alerts",
                onClick: () => void requestBrowserNotifications(),
              }
            : undefined,
        });
      }
    }
  }, [alerts]);

  // Reconnection notices.
  useEffect(() => {
    if (previousStatus.current !== "connected" && status === "connected") {
      toast.success("Live updates restored");
    }

    if (
      previousStatus.current === "connected" &&
      (status === "disconnected" || status === "reconnecting")
    ) {
      toast.warning("Live updates interrupted", {
        description: "Reconnecting automatically.",
      });
    }

    previousStatus.current = status;
  }, [status]);

  // Back-end "you are outside the risk zone" message.
  useEffect(() => {
    if (!safeMessage) return;
    toast.success(safeMessage.message, {
      description: "No monitored risk zone within range.",
      onDismiss: dismissSafeMessage,
    });
    dismissSafeMessage();
  }, [safeMessage, dismissSafeMessage]);

  // Offline notice.
  useEffect(() => {
    if (!isOnline) {
      toast.warning("You are offline", {
        description: "Showing the last known alerts and weather.",
        id: "offline",
      });
    }
  }, [isOnline]);

  return null;
}
