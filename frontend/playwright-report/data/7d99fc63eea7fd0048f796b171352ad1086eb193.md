# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> Application navigation — Browser Workflows >> admin navigates across all main modules and loads their records
- Location: e2e\navigation.spec.ts:46:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Active projects')
Expected: visible
Error: strict mode violation: getByText('Active projects') resolved to 2 elements:
    1) <p class="min-w-0 truncate text-sm font-medium text-muted-foreground">Active projects</p> aka getByText('Active projects', { exact: true })
    2) <p class="mt-1 text-xs text-muted-foreground">0 active projects</p> aka getByText('0 active projects')

Call log:
  - Expect "toBeVisible" getByText('Active projects') with timeout 10000ms
  - waiting for getByText('Active projects')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - link "Skip to main content" [ref=e4] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e7]:
      - link "Optimus Fox — go to overview" [ref=e10] [cursor=pointer]:
        - /url: /
        - generic [ref=e15]:
          - paragraph [ref=e16]: Optimus Fox
          - paragraph [ref=e17]: Project Management System
      - navigation "Main navigation" [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: Workspace
          - list [ref=e23]:
            - listitem [ref=e24]:
              - link "Overview" [ref=e25] [cursor=pointer]:
                - /url: /
        - generic [ref=e33]:
          - generic [ref=e34]: Organization
          - list [ref=e36]:
            - listitem [ref=e37]:
              - link "Employees" [ref=e38] [cursor=pointer]:
                - /url: /employees
            - listitem [ref=e44]:
              - link "Departments" [ref=e45] [cursor=pointer]:
                - /url: /departments
        - generic [ref=e51]:
          - generic [ref=e52]: Operations
          - list [ref=e54]:
            - listitem [ref=e55]:
              - link "Projects" [ref=e56] [cursor=pointer]:
                - /url: /projects
            - listitem [ref=e60]:
              - link "Clients" [ref=e61] [cursor=pointer]:
                - /url: /clients
        - generic [ref=e67]:
          - generic [ref=e68]: Administration
          - list [ref=e70]:
            - listitem [ref=e71]:
              - link "Users & Roles" [ref=e72] [cursor=pointer]:
                - /url: /users
            - listitem [ref=e77]:
              - link "Audit Logs" [ref=e78] [cursor=pointer]:
                - /url: /audits
      - navigation "Account navigation" [ref=e84]:
        - list [ref=e85]:
          - listitem [ref=e86]:
            - button "Sign out" [ref=e87]
      - button "Toggle Sidebar" [ref=e92]
    - main [ref=e93]:
      - generic [ref=e94]:
        - generic [ref=e95]:
          - button "Toggle Sidebar" [ref=e96]
          - navigation "Breadcrumb" [ref=e98]:
            - list [ref=e99]:
              - listitem [ref=e100]:
                - generic [ref=e101]: Workspace
              - listitem [ref=e102]:
                - generic [ref=e105]: Overview
        - generic [ref=e106]:
          - 'button "Change theme. Current: system" [ref=e107]'
          - generic "E2E Administrator — Admin (e2e.admin@example.test)" [ref=e108]:
            - generic [aria-hidden] [ref=e109]: EA
            - generic [ref=e110]: E2E Administrator
      - generic [ref=e113]:
        - generic [ref=e114]:
          - generic [ref=e115]:
            - heading "Overview" [level=1] [ref=e116]
            - paragraph [ref=e117]: Current organization overview and operational insights.
          - button "Refresh" [ref=e119]
        - region "Key performance indicators" [ref=e120]:
          - generic [ref=e122]:
            - paragraph [ref=e124]: Total employees
            - paragraph [ref=e129]: "1"
            - paragraph [ref=e130]: Across 1 departments
          - generic [ref=e132]:
            - paragraph [ref=e134]: Active projects
            - paragraph [ref=e137]: "0"
            - paragraph [ref=e138]: Of 0 total projects
          - generic [ref=e140]:
            - paragraph [ref=e142]: Total clients
            - paragraph [ref=e147]: "0"
            - paragraph [ref=e148]: Active and inactive client accounts
          - generic [ref=e150]:
            - paragraph [ref=e152]: Completed projects
            - paragraph [ref=e156]: "0"
            - paragraph [ref=e157]: Projects currently marked complete
        - region "Project analytics" [ref=e158]:
          - generic [ref=e161]:
            - generic [ref=e162]:
              - heading "Monthly project activity" [level=2] [ref=e164]
              - generic [ref=e165]: Projects created and completed over the past six months.
            - generic [ref=e166]:
              - application [ref=e170]
              - generic [ref=e174]:
                - generic [ref=e175]: Created
                - generic [ref=e177]: Completed
          - generic [ref=e181]:
            - generic [ref=e182]:
              - heading "Project status" [level=2] [ref=e184]
              - generic [ref=e185]: Distribution of projects by current status.
            - generic [ref=e186]:
              - generic [ref=e187]:
                - application [ref=e191]
                - generic:
                  - generic: "0"
                  - generic: Projects
              - list
        - region "Priority and workforce distributions" [ref=e192]:
          - generic [ref=e195]:
            - generic [ref=e196]:
              - heading "Project priority" [level=2] [ref=e198]
              - generic [ref=e199]: Open projects grouped by priority.
            - paragraph [ref=e201]: No unfinished projects to summarize.
          - generic [ref=e204]:
            - generic [ref=e205]:
              - heading "Employee status" [level=2] [ref=e207]
              - generic [ref=e208]: Current workforce composition by employment status.
            - generic [ref=e209]:
              - generic [ref=e210]:
                - application [ref=e214]
                - generic:
                  - generic: "1"
                  - generic: Employees
              - list [ref=e215]:
                - listitem [ref=e216]:
                  - generic [ref=e218]: Active
                  - generic [ref=e219]: "1"
                - listitem [ref=e220]:
                  - generic [ref=e222]: On leave
                  - generic [ref=e223]: "0"
                - listitem [ref=e224]:
                  - generic [ref=e226]: Inactive
                  - generic [ref=e227]: "0"
        - region "Organization insights" [ref=e228]:
          - generic [ref=e258]:
            - generic [ref=e259]:
              - heading "Recently updated projects" [level=2] [ref=e261]
              - generic [ref=e262]: Latest project records by update time. This is not an audit log.
            - paragraph [ref=e264]: No projects have been created yet.
        - region "Project health" [ref=e265]:
          - generic [ref=e266]:
            - generic [ref=e267]:
              - heading "Project health" [level=2] [ref=e269]
              - generic [ref=e270]: Deadlines, progress, and projects requiring attention.
            - generic [ref=e271]:
              - generic [ref=e272]:
                - generic [ref=e273]:
                  - generic [ref=e274]: Overdue projects
                  - paragraph [ref=e278]: "0"
                  - paragraph [ref=e279]: Unfinished and past due date
                - generic [ref=e280]:
                  - generic [ref=e281]: Due in 7 days
                  - paragraph [ref=e287]: "0"
                  - paragraph [ref=e288]: Unfinished, due today or next 6 days
                - generic [ref=e289]:
                  - generic [ref=e290]: Average progress
                  - paragraph [ref=e296]: 0%
                  - paragraph [ref=e297]: 0 active projects
              - generic [ref=e298]:
                - generic [ref=e299]:
                  - heading "Projects needing attention" [level=3] [ref=e300]
                  - generic [ref=e301]: Top 5
                - paragraph [ref=e302]: No overdue, on-hold, unassigned, or near-due projects.
                - link "View project directory" [ref=e304] [cursor=pointer]:
                  - /url: /projects
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | 
  2   | import { test, expect } from "@playwright/test";
  3   | import type { Page } from "@playwright/test";
  4   | 
  5   | import {
  6   |   E2E_ACCOUNTS,
  7   |   installRoleMocks,
  8   | } from "./mocks/roles";
  9   | 
  10  | import {
  11  |   installNavigationMocks,
  12  | } from "./mocks/navigation";
  13  | 
  14  | async function loginAsAdmin(page: Page) {
  15  |   await page.goto("/");
  16  | 
  17  |   await expect(page).toHaveURL(/\/login$/);
  18  | 
  19  |   await page
  20  |     .getByRole("textbox", {
  21  |       name: "Email address",
  22  |     })
  23  |     .fill(E2E_ACCOUNTS.admin.email);
  24  | 
  25  |   await page
  26  |     .locator('input[name="password"]')
  27  |     .fill(E2E_ACCOUNTS.admin.password);
  28  | 
  29  |   await page
  30  |     .getByRole("button", {
  31  |       name: "Sign in",
  32  |     })
  33  |     .click();
  34  | 
  35  |   await expect(page).toHaveURL(/\/$/);
  36  | 
  37  |   await expect(
  38  |     page.getByRole("heading", {
  39  |       name: "Overview",
  40  |       exact: true,
  41  |     }),
  42  |   ).toBeVisible();
  43  | }
  44  | 
  45  | test.describe("Application navigation — Browser Workflows", () => {
  46  |   test("admin navigates across all main modules and loads their records", async ({
  47  |     page,
  48  |   }) => {
  49  |     // Role mocks: auth, dashboard, employees,
  50  |     // departments.
  51  |     const auth = await installRoleMocks(page);
  52  | 
  53  |     // Additional module mocks: clients, projects,
  54  |     // users, audit logs.
  55  |     const navigation =
  56  |       await installNavigationMocks(page);
  57  | 
  58  |     await loginAsAdmin(page);
  59  | 
  60  |     const mainNav = page.getByRole("navigation", {
  61  |       name: "Main navigation",
  62  |     });
  63  | 
  64  |     // -----------------------------------
  65  |     // 1. Dashboard is loaded
  66  |     // -----------------------------------
  67  | 
  68  |     await expect(
  69  |       page.getByText("Total employees"),
  70  |     ).toBeVisible();
  71  | 
  72  |     await expect(
  73  |       page.getByText("Active projects"),
> 74  |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  75  | 
  76  |     // -----------------------------------
  77  |     // 2. Employees
  78  |     // -----------------------------------
  79  | 
  80  |     await mainNav
  81  |       .getByRole("link", { name: "Employees" })
  82  |       .click();
  83  | 
  84  |     await expect(page).toHaveURL(/\/employees$/);
  85  | 
  86  |     await expect(
  87  |       page.getByRole("heading", {
  88  |         name: "Employees",
  89  |         exact: true,
  90  |       }),
  91  |     ).toBeVisible();
  92  | 
  93  |     await expect(
  94  |       page
  95  |         .getByRole("table", { name: "Employees" })
  96  |         .getByText("E2E Browser Employee"),
  97  |     ).toBeVisible();
  98  | 
  99  |     // -----------------------------------
  100 |     // 3. Departments
  101 |     // -----------------------------------
  102 | 
  103 |     await mainNav
  104 |       .getByRole("link", { name: "Departments" })
  105 |       .click();
  106 | 
  107 |     await expect(page).toHaveURL(/\/departments$/);
  108 | 
  109 |     await expect(
  110 |       page.getByRole("heading", {
  111 |         name: "Departments",
  112 |         exact: true,
  113 |       }),
  114 |     ).toBeVisible();
  115 | 
  116 |     await expect(
  117 |       page
  118 |         .getByRole("table", { name: "Departments" })
  119 |         .getByText("Engineering"),
  120 |     ).toBeVisible();
  121 | 
  122 |     // -----------------------------------
  123 |     // 4. Clients
  124 |     // -----------------------------------
  125 | 
  126 |     await mainNav
  127 |       .getByRole("link", { name: "Clients" })
  128 |       .click();
  129 | 
  130 |     await expect(page).toHaveURL(/\/clients$/);
  131 | 
  132 |     await expect(
  133 |       page.getByRole("heading", {
  134 |         name: "Clients",
  135 |         exact: true,
  136 |       }),
  137 |     ).toBeVisible();
  138 | 
  139 |     await expect(
  140 |       page
  141 |         .getByRole("table", { name: "Clients" })
  142 |         .getByText("E2E Smoke Client"),
  143 |     ).toBeVisible();
  144 | 
  145 |     // -----------------------------------
  146 |     // 5. Projects
  147 |     // -----------------------------------
  148 | 
  149 |     await mainNav
  150 |       .getByRole("link", { name: "Projects" })
  151 |       .click();
  152 | 
  153 |     await expect(page).toHaveURL(/\/projects$/);
  154 | 
  155 |     await expect(
  156 |       page.getByRole("heading", {
  157 |         name: "Projects",
  158 |         exact: true,
  159 |       }),
  160 |     ).toBeVisible();
  161 | 
  162 |     await expect(
  163 |       page
  164 |         .getByRole("table", { name: "Projects" })
  165 |         .getByText("E2E Smoke Project"),
  166 |     ).toBeVisible();
  167 | 
  168 |     // -----------------------------------
  169 |     // 6. Users & Roles
  170 |     // -----------------------------------
  171 | 
  172 |     await mainNav
  173 |       .getByRole("link", { name: "Users & Roles" })
  174 |       .click();
```