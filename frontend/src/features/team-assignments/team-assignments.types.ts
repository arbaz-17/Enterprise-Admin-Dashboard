export type EmployeeStatus = "active" | "on_leave" | "inactive";

export interface ProjectTeamMember {
  id: string;
  employeeId: string;
  fullName: string;
  workEmail: string;
  designation: string;
  status: EmployeeStatus;
  departmentName: string;
  assignedAt: string;
}

export interface TeamResponse {
  project: {
    id: string;
    name: string;
    clientName: string;
    canManageTeam: boolean;
  };
  data: ProjectTeamMember[];
}

export interface EmployeeOption {
  id: string;
  name: string;
  email: string;
  designation: string;
  departmentName: string;
}

export interface AvailableEmployeeResponse {
  data: EmployeeOption[];
}

export interface AddTeamMemberInput {
  projectId: string;
  employeeId: string;
}

export type RemoveTeamMemberInput = AddTeamMemberInput;
