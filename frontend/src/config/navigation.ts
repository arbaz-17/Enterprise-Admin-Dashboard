
import {
  LayoutDashboard,
  Settings2,
  Building2,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/features/auth/auth.types";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

// Main application navigation
export const navigationGroups: NavigationGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Overview",
        href: "/",
        icon: LayoutDashboard,
        permission: "dashboard:read",
      },
    ],
  },

{
  label: "Organization",
  items: [
    {
      label: "Departments",
      href: "/departments",
      icon: Building2,
      permission: "departments:read",
    },
  ],
},

];

// Account navigation
export const accountNavigation: NavigationItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings2,
  },
];

// Supports exact and nested route matching
export function isNavigationActive(
  pathname: string,
  href: string
): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

// Shared page metadata for the header
export function findNavigationItem(pathname: string) {
  for (const group of navigationGroups) {
    const item = group.items.find((entry) =>
      isNavigationActive(pathname, entry.href)
    );

    if (item) {
      return {
        group: group.label,
        item,
      };
    }
  }

  const accountItem = accountNavigation.find((entry) =>
    isNavigationActive(pathname, entry.href)
  );

  if (accountItem) {
    return {
      group: "Account",
      item: accountItem,
    };
  }

  return null;
}
