import {
  ChartLineUpIcon,
  HouseIcon,
  MapTrifoldIcon,
  SirenIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
  UsersThreeIcon,
  type Icon,
} from "@phosphor-icons/react";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  /** Short label used by the mobile bottom bar. */
  shortLabel: string;
  description: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Home",
    icon: HouseIcon,
    description: "Your current situation at a glance",
  },
  {
    href: "/map",
    label: "Live map",
    shortLabel: "Map",
    icon: MapTrifoldIcon,
    description: "Fullscreen hazard and resource map",
  },
  {
    href: "/alerts",
    label: "Alerts",
    shortLabel: "Alerts",
    icon: SirenIcon,
    description: "Live alert feed with severity filters",
  },
  {
    href: "/resources",
    label: "Resources",
    shortLabel: "Resources",
    icon: SquaresFourIcon,
    description: "Shelters, hospitals and aid points nearby",
  },
  {
    href: "/reports",
    label: "Community reports",
    shortLabel: "Reports",
    icon: UsersThreeIcon,
    description: "Citizen reports arriving in real time",
  },
  {
    href: "/analytics",
    label: "Analytics",
    shortLabel: "Analytics",
    icon: ChartLineUpIcon,
    description: "Risk, rainfall and response metrics",
  },
  {
    href: "/settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: SlidersHorizontalIcon,
    description: "Theme, language and simulation controls",
  },
] as const;

/** Route segment → page title, used for breadcrumbs and document titles. */
export const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/map": "Live map",
  "/alerts": "Alerts",
  "/resources": "Resources",
  "/reports": "Community reports",
  "/analytics": "Analytics",
  "/settings": "Settings",
};
