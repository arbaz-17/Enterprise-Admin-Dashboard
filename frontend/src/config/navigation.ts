import {
  LayoutDashboard,
  Settings2,
  Building2,
  UsersRound,
  BriefcaseBusiness,
  FolderKanban,
  ShieldCheck,
  ScrollText,
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

export interface NavigationBreadcrumb {
  label: string;
  href?: string;
}

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
        label: "Employees",
        href: "/employees",
        icon: UsersRound,
        permission: "employees:read",
      },
      {
        label: "Departments",
        href: "/departments",
        icon: Building2,
        permission: "departments:read",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        permission: "projects:read",
      },
      {
        label: "Clients",
        href: "/clients",
        icon: BriefcaseBusiness,
        permission: "clients:read",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users & Roles",
        href: "/users",
        icon: ShieldCheck,
        permission: "users:manage",
      },

      {
      label: "Audit Logs",
      href: "/audits",
      icon: ScrollText,
      permission: "audits:read",
    },
    ],
  },
];

export const accountNavigation: NavigationItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings2,
  },
];

export function isNavigationActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavigationItem(pathname: string) {
  for (const group of navigationGroups) {
    const item = group.items.find((entry) =>
      isNavigationActive(pathname, entry.href),
    );

    if (item) {
      return {
        group: group.label,
        item,
      };
    }
  }

  const accountItem = accountNavigation.find((entry) =>
    isNavigationActive(pathname, entry.href),
  );

  if (accountItem) {
    return {
      group: "Account",
      item: accountItem,
    };
  }

  return null;
}

export function getNavigationBreadcrumbs(
  pathname: string,
): NavigationBreadcrumb[] {
  const page = findNavigationItem(pathname);

  if (!page) {
    return [{ label: "Workspace" }];
  }

  const breadcrumbs: NavigationBreadcrumb[] = [{ label: page.group }];

  if (/^\/projects\/[^/]+\/team\/?$/.test(pathname)) {
    breadcrumbs.push({
      label: "Projects",
      href: "/projects",
    });

    breadcrumbs.push({
      label: "Project team",
    });
  } else {
    breadcrumbs.push({
      label: page.item.label,
    });
  }

  return breadcrumbs;
}
