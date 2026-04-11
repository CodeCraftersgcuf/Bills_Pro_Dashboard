export type AdminStatus = "Active" | "Inactive";

export interface AdminActivityRow {
  id: string;
  activity: string;
  date: string;
}

export interface Admin {
  id: number;
  /** Short name in management table */
  name: string;
  profileFullName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: AdminStatus;
  /** Shown in Admin Management date column */
  tableDate: string;
  avatar: string;
  daysActive: string;
  dateRegistered: string;
  lastLogin: string;
  activities: AdminActivityRow[];
}

export const ADMINS: Admin[] = [
  {
    id: 1,
    name: "Zoya Patel",
    profileFullName: "Zoya Anika Patel",
    firstName: "Zoya",
    lastName: "Patel",
    email: "zoya.patel@billspro.com",
    role: "Owner",
    status: "Active",
    tableDate: "10/22/25 - 07:30 AM",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    daysActive: "142",
    dateRegistered: "06/02/25",
    lastLogin: "11/09/25 - 07:22 AM",
    activities: [
      { id: "a1", activity: "Account Created", date: "11/09/25 - 07:22 AM" },
      { id: "a2", activity: "Password updated", date: "10/15/25 - 02:10 PM" },
      { id: "a3", activity: "Role verified", date: "09/01/25 - 09:00 AM" },
    ],
  },
  {
    id: 2,
    name: "Marcus Chen",
    profileFullName: "Marcus Wei Chen",
    firstName: "Marcus",
    lastName: "Chen",
    email: "marcus.chen@billspro.com",
    role: "Admin",
    status: "Active",
    tableDate: "10/21/25 - 04:15 PM",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    daysActive: "98",
    dateRegistered: "07/14/25",
    lastLogin: "11/08/25 - 06:45 PM",
    activities: [
      { id: "a1", activity: "Account Created", date: "07/14/25 - 10:00 AM" },
      { id: "a2", activity: "Login from new device", date: "11/08/25 - 06:45 PM" },
    ],
  },
  {
    id: 3,
    name: "Alex Rivera",
    profileFullName: "Alex Jordan Rivera",
    firstName: "Alex",
    lastName: "Rivera",
    email: "alex.rivera@billspro.com",
    role: "Admin",
    status: "Inactive",
    tableDate: "10/20/25 - 11:00 AM",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    daysActive: "45",
    dateRegistered: "08/05/25",
    lastLogin: "10/18/25 - 08:30 AM",
    activities: [{ id: "a1", activity: "Account Created", date: "08/05/25 - 03:15 PM" }],
  },
  {
    id: 4,
    name: "Priya Sharma",
    profileFullName: "Priya Sharma",
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.sharma@billspro.com",
    role: "Owner",
    status: "Active",
    tableDate: "10/19/25 - 09:45 AM",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    daysActive: "210",
    dateRegistered: "04/11/25",
    lastLogin: "11/09/25 - 08:12 AM",
    activities: [
      { id: "a1", activity: "Account Created", date: "04/11/25 - 11:00 AM" },
      { id: "a2", activity: "Security review completed", date: "11/09/25 - 07:22 AM" },
    ],
  },
  {
    id: 5,
    name: "Sam Okonkwo",
    profileFullName: "Samuel Chidi Okonkwo",
    firstName: "Samuel",
    lastName: "Okonkwo",
    email: "sam.okonkwo@billspro.com",
    role: "Admin",
    status: "Active",
    tableDate: "10/18/25 - 02:20 PM",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    daysActive: "76",
    dateRegistered: "07/22/25",
    lastLogin: "11/07/25 - 04:00 PM",
    activities: [{ id: "a1", activity: "Account Created", date: "07/22/25 - 09:30 AM" }],
  },
];

export function getAdminById(id: string): Admin | undefined {
  return ADMINS.find((a) => String(a.id) === id);
}
