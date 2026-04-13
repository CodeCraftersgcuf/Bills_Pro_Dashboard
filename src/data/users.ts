/**
 * User domain types + seed data.
 * Replace fetch calls later with API responses matching these shapes.
 */

export type KycStatus = "verified" | "pending" | "rejected";

export interface User {
  id: string;
  /** Shown in lists/tables (e.g. Latest Users) */
  publicName: string;
  /** Large headline on profile card */
  profileFullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Formatted for UI; API might send minor units + currency code */
  walletBalanceDisplay: string;
  avatarUrl: string;
  kycStatus: KycStatus;
  /** ISO 8601 — same shape expected from API */
  dateRegistered: string;
  lastLogin: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  activity: string;
  /** ISO 8601 from API; rendered in table after formatting */
  occurredAt: string;
}

/** Linked bank accounts for withdrawals (admin view). */
export interface WithdrawalAccount {
  id: string;
  userId: string;
  /** Card title, e.g. "Account 1" */
  label: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  isDefault: boolean;
}

export const USERS: User[] = [
  {
    id: "1",
    publicName: "Qamardeen Malik",
    profileFullName: "Qamardeen Abdul Malik",
    firstName: "Abdul malik",
    lastName: "Qamardeen",
    email: "absofthh@gmail.com",
    phone: "07012456789",
    walletBalanceDisplay: "N25,000",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    kycStatus: "verified",
    dateRegistered: "2025-10-09T07:22:00.000Z",
    lastLogin: "2025-10-09T07:22:00.000Z",
  },
  {
    id: "2",
    publicName: "Chioma Okafor",
    profileFullName: "Chioma Ada Okafor",
    firstName: "Chioma",
    lastName: "Okafor",
    email: "chioma.okafor@email.com",
    phone: "08098765432",
    walletBalanceDisplay: "N18,500",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    kycStatus: "verified",
    dateRegistered: "2025-09-15T14:30:00.000Z",
    lastLogin: "2025-11-01T09:15:00.000Z",
  },
  {
    id: "3",
    publicName: "James Peterson",
    profileFullName: "James Oliver Peterson",
    firstName: "James",
    lastName: "Peterson",
    email: "j.peterson@email.com",
    phone: "07011223344",
    walletBalanceDisplay: "N42,000",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    kycStatus: "verified",
    dateRegistered: "2025-08-20T11:00:00.000Z",
    lastLogin: "2025-10-28T18:45:00.000Z",
  },
  {
    id: "4",
    publicName: "Amina Hassan",
    profileFullName: "Amina Hassan",
    firstName: "Amina",
    lastName: "Hassan",
    email: "amina.hassan@email.com",
    phone: "08155667788",
    walletBalanceDisplay: "N9,200",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    kycStatus: "pending",
    dateRegistered: "2025-11-05T08:00:00.000Z",
    lastLogin: "2025-11-05T08:00:00.000Z",
  },
];

export const WITHDRAWAL_ACCOUNTS: WithdrawalAccount[] = [
  {
    id: "wa-1-1",
    userId: "1",
    label: "Account 1",
    accountHolderName: "Qamardeen Abdul Malik",
    bankName: "Access Bank",
    accountNumber: "1234567890",
    isDefault: true,
  },
  {
    id: "wa-1-2",
    userId: "1",
    label: "Account 2",
    accountHolderName: "Qamardeen Abdul Malik",
    bankName: "GTBank",
    accountNumber: "0123456789",
    isDefault: false,
  },
  {
    id: "wa-1-3",
    userId: "1",
    label: "Account 3",
    accountHolderName: "Qamardeen Abdul Malik",
    bankName: "First Bank",
    accountNumber: "3088123456",
    isDefault: false,
  },
  {
    id: "wa-2-1",
    userId: "2",
    label: "Account 1",
    accountHolderName: "Chioma Ada Okafor",
    bankName: "Zenith Bank",
    accountNumber: "2087654321",
    isDefault: true,
  },
];

export const USER_ACTIVITIES: UserActivity[] = [
  {
    id: "act-1-1",
    userId: "1",
    activity: "Account Created",
    occurredAt: "2025-09-11T07:22:00.000Z",
  },
  {
    id: "act-1-2",
    userId: "1",
    activity: "KYC Submitted",
    occurredAt: "2025-09-12T10:00:00.000Z",
  },
  {
    id: "act-1-3",
    userId: "1",
    activity: "Wallet Funded",
    occurredAt: "2025-10-01T16:20:00.000Z",
  },
  {
    id: "act-2-1",
    userId: "2",
    activity: "Account Created",
    occurredAt: "2025-09-15T14:30:00.000Z",
  },
  {
    id: "act-2-2",
    userId: "2",
    activity: "Login from new device",
    occurredAt: "2025-11-01T09:15:00.000Z",
  },
  {
    id: "act-3-1",
    userId: "3",
    activity: "Account Created",
    occurredAt: "2025-08-20T11:00:00.000Z",
  },
  {
    id: "act-4-1",
    userId: "4",
    activity: "Account Created",
    occurredAt: "2025-11-05T08:00:00.000Z",
  },
];

export function getUserById(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}

export function getActivitiesForUser(userId: string): UserActivity[] {
  return USER_ACTIVITIES.filter((a) => a.userId === userId).sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}

export function getWithdrawalAccountsForUser(userId: string): WithdrawalAccount[] {
  return WITHDRAWAL_ACCOUNTS.filter((a) => a.userId === userId);
}

/** Profile detail grid — e.g. "09 Oct, 2025 - 07:22 AM" */
export function formatProfileDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.toLocaleString("en-GB", { day: "2-digit" });
  const mon = d.toLocaleString("en-GB", { month: "short" });
  const year = d.getFullYear();
  const time = d.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${day} ${mon}, ${year} - ${time}`;
}

/** Activity table — e.g. "11/09/25 - 07:22 AM" */
export function formatActivityDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const time = d.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${dd}/${mm}/${yy} - ${time}`;
}
