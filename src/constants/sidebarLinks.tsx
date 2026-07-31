import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  UserRound,
  Receipt,
  ShieldCheck,
  CreditCard,
  Wallet,
  Tag,
  UsersRound,
  WalletCards,
  ArrowDownToLine,
  CalendarDays,
  Store,
  LineChart,
  PieChart,
  Scale,
  Headphones,
  Bell,
  Construction,
  Settings,
  FileText,
} from "lucide-react";

export interface SidebarLinkItem {
  name: string;
  link: string;
  icon: LucideIcon;
  sublinks: { name: string; link: string; icon?: LucideIcon }[];
}

export const Sidebar_links: SidebarLinkItem[] = [
  { name: "Dashboard", link: "/dashboard", icon: LayoutGrid, sublinks: [] },
  { name: "User Management", link: "/user/management", icon: UserRound, sublinks: [] },
  { name: "Transactions", link: "/transaction", icon: Receipt, sublinks: [] },
  { name: "Daily activity", link: "/daily-activity", icon: CalendarDays, sublinks: [] },
  { name: "Reconciliation", link: "/reconciliation", icon: Scale, sublinks: [] },
  { name: "KYC", link: "/kyc", icon: ShieldCheck, sublinks: [] },
  { name: "Virtual Cards", link: "/virtual-cards", icon: CreditCard, sublinks: [] },
  {
    name: "Terms & privacy (mobile app)",
    link: "/legal/virtual-card",
    icon: FileText,
    sublinks: [],
  },
  { name: "Wallet Management", link: "/wallet-management", icon: Wallet, sublinks: [] },
  { name: "Rates", link: "/rates", icon: Tag, sublinks: [] },
  {
    name: "Visa card rates",
    link: "/rates/visa-virtual-card",
    icon: Tag,
    sublinks: [],
  },
  { name: "Bill Payments", link: "/bill-payments", icon: UsersRound, sublinks: [] },
  { name: "Master Wallet", link: "/master-wallet", icon: WalletCards, sublinks: [] },
  { name: "Received crypto", link: "/received-crypto", icon: ArrowDownToLine, sublinks: [] },
  { name: "Crypto vendors", link: "/crypto-vendors", icon: Store, sublinks: [] },
  { name: "Pricing & Profit", link: "/profit", icon: PieChart, sublinks: [] },
  { name: "Analytics", link: "/analytics", icon: LineChart, sublinks: [] },
  { name: "Support", link: "/support", icon: Headphones, sublinks: [] },
  { name: "Notification", link: "/notification", icon: Bell, sublinks: [] },
  { name: "Service maintenance", link: "/maintenance", icon: Construction, sublinks: [] },
  { name: "Settings", link: "/settings", icon: Settings, sublinks: [] },
];
