import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  Wallet,
  Receipt,
  UsersRound,
  MessageCircleWarning,
  WalletCards,
  LineChart,
  Gift,
  Headphones,
  Bell,
  Settings,
} from "lucide-react";

export interface SidebarLinkItem {
  name: string;
  link: string;
  icon: LucideIcon;
  sublinks: { name: string; link: string; icon?: LucideIcon }[];
}

export const Sidebar_links: SidebarLinkItem[] = [
  { name: "Dashboard", link: "/dashboard", icon: LayoutDashboard, sublinks: [] },
  { name: "User Management", link: "/user/management", icon: Users, sublinks: [] },
  { name: "Transactions", link: "/transaction", icon: ArrowLeftRight, sublinks: [] },
  { name: "KYC", link: "/kyc", icon: ShieldCheck, sublinks: [] },
  { name: "Wallet Management", link: "/wallet-management", icon: Wallet, sublinks: [] },
  { name: "Rates", link: "/rates", icon: Receipt, sublinks: [] },
  { name: "Peer to Peer (P2P)", link: "/p2p", icon: UsersRound, sublinks: [] },
  { name: "Chat Appeals", link: "/chat-appeals", icon: MessageCircleWarning, sublinks: [] },
  { name: "Master Wallet", link: "/master-wallet", icon: WalletCards, sublinks: [] },
  { name: "Analytics", link: "/analytics", icon: LineChart, sublinks: [] },
  { name: "Rewards", link: "/rewards", icon: Gift, sublinks: [] },
  { name: "Support", link: "/support", icon: Headphones, sublinks: [] },
  { name: "notification", link: "/notification", icon: Bell, sublinks: [] },
  { name: "Settings", link: "/settings", icon: Settings, sublinks: [] },
];
