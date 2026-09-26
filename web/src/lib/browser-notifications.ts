export function canUseBrowserNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestBrowserNotifications(): Promise<NotificationPermission | "unsupported"> {
  if (!canUseBrowserNotifications()) return "unsupported";
  return Notification.requestPermission();
}

export function showBrowserNotification(title: string, body: string, tag: string): boolean {
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") return false;

  const notification = new Notification(title, { body, tag });
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  return true;
}
