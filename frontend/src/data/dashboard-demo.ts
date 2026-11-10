
/**
 * DEMONSTRATION DATA ONLY
 *
 * These values do not come from the backend.
 * Replace them with real API data in the CRUD phase.
 */

export const dashboardDemo = {
  metrics: {
    employees: 86,
    activeProjects: 18,
    clients: 24,
    completedProjects: 12,
  },

  monthlyActivity: [
    { month: "May", created: 5, completed: 1 },
    { month: "Jun", created: 7, completed: 2 },
    { month: "Jul", created: 6, completed: 1 },
    { month: "Aug", created: 9, completed: 3 },
    { month: "Sep", created: 8, completed: 2 },
    { month: "Oct", created: 5, completed: 3 },
  ],

  projectStatus: [
    { name: "Active", value: 18, color: "var(--chart-1)" },
    { name: "Completed", value: 12, color: "var(--chart-3)" },
    { name: "Planning", value: 6, color: "var(--chart-2)" },
    { name: "On hold", value: 4, color: "var(--chart-4)" },
  ],

  departments: [
    { name: "Engineering", employees: 30 },
    { name: "QA", employees: 18 },
    { name: "Design", employees: 15 },
    { name: "Operations", employees: 12 },
    { name: "Sales", employees: 11 },
  ],

  recentActivity: [
    {
      id: "activity-1",
      kind: "project",
      title: "Project Atlas moved to Active",
      description: "Project status updated",
      date: "Oct 28",
    },
    {
      id: "activity-2",
      kind: "employee",
      title: "New employee joined Engineering",
      description: "Employee onboarding",
      date: "Oct 27",
    },
    {
      id: "activity-3",
      kind: "client",
      title: "Client Mercury added",
      description: "New client registered",
      date: "Oct 25",
    },
    {
      id: "activity-4",
      kind: "project",
      title: "Project Beacon marked Complete",
      description: "Project milestone completed",
      date: "Oct 22",
    },
  ],
} as const;
