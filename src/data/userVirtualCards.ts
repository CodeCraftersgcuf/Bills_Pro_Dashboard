/**
 * Profile → Virtual Cards tab. Replace with API by user id.
 */

export type VirtualCardUiStatus = "active" | "frozen";

export interface UserVirtualCard {
  id: string;
  userId: string;
  /** e.g. "Card 1" */
  shortName: string;
  title: string;
  balanceDisplay: string;
  lastFour: string;
  status: VirtualCardUiStatus;
  /** Pill "Card Details" accent */
  detailsButtonVariant: "green" | "orange" | "pink";
  /** API `card_color` — tint over shared card background image */
  cardColor?: string;
}

export type VirtualCardTxKind = "deposit" | "withdrawal" | "payment";

export interface VirtualCardTxRow {
  id: string;
  userId: string;
  amount: string;
  status: "Successful" | "Pending" | "Failed";
  cardLabel: string;
  subType: string;
  date: string;
  kind: VirtualCardTxKind;
  /** Present when row comes from API (stable table key) */
  databaseId?: number;
}

export const USER_VIRTUAL_CARDS: UserVirtualCard[] = [
  {
    id: "vc-u1-1",
    userId: "1",
    shortName: "Card 1",
    title: "Online Payment Virtual Card - Card 1",
    balanceDisplay: "$10,000.00",
    lastFour: "1234",
    status: "active",
    detailsButtonVariant: "green",
    cardColor: "green",
  },
  {
    id: "vc-u1-2",
    userId: "1",
    shortName: "Card 2",
    title: "Online Payment Virtual Card - Card 2",
    balanceDisplay: "$4,250.50",
    lastFour: "8891",
    status: "active",
    detailsButtonVariant: "orange",
    cardColor: "brown",
  },
  {
    id: "vc-u1-3",
    userId: "1",
    shortName: "Card 3",
    title: "Online Payment Virtual Card - Card 3",
    balanceDisplay: "$890.00",
    lastFour: "4420",
    status: "frozen",
    detailsButtonVariant: "pink",
    cardColor: "purple",
  },
  {
    id: "vc-u2-1",
    userId: "2",
    shortName: "Card 1",
    title: "Online Payment Virtual Card - Card 1",
    balanceDisplay: "$2,100.00",
    lastFour: "5512",
    status: "active",
    detailsButtonVariant: "green",
    cardColor: "green",
  },
  {
    id: "vc-u2-2",
    userId: "2",
    shortName: "Card 2",
    title: "Online Payment Virtual Card - Card 2",
    balanceDisplay: "$600.00",
    lastFour: "9012",
    status: "frozen",
    detailsButtonVariant: "orange",
    cardColor: "brown",
  },
];

export const VIRTUAL_CARD_TRANSACTIONS: VirtualCardTxRow[] = [
  {
    id: "aqij123452345224",
    userId: "1",
    amount: "N20,000",
    status: "Successful",
    cardLabel: "Card 1",
    subType: "Deposit",
    date: "10/22/25 - 07:30 AM",
    kind: "deposit",
  },
  {
    id: "bqij223452345225",
    userId: "1",
    amount: "N15,000",
    status: "Pending",
    cardLabel: "Card 2",
    subType: "Deposit",
    date: "10/21/25 - 02:15 PM",
    kind: "deposit",
  },
  {
    id: "cqij323452345226",
    userId: "1",
    amount: "N8,500",
    status: "Failed",
    cardLabel: "Card 1",
    subType: "Payment",
    date: "10/20/25 - 11:00 AM",
    kind: "payment",
  },
  {
    id: "dqij423452345227",
    userId: "1",
    amount: "N3,200",
    status: "Successful",
    cardLabel: "Card 3",
    subType: "Withdrawal",
    date: "10/19/25 - 09:45 AM",
    kind: "withdrawal",
  },
  {
    id: "eqij523452345228",
    userId: "1",
    amount: "N12,000",
    status: "Successful",
    cardLabel: "Card 2",
    subType: "Deposit",
    date: "10/18/25 - 04:00 PM",
    kind: "deposit",
  },
  {
    id: "fqij623452345229",
    userId: "2",
    amount: "N5,000",
    status: "Successful",
    cardLabel: "Card 1",
    subType: "Deposit",
    date: "10/17/25 - 08:20 AM",
    kind: "deposit",
  },
];

export function getVirtualCardsForUser(userId: string): UserVirtualCard[] {
  return USER_VIRTUAL_CARDS.filter((c) => c.userId === userId);
}

export function getVirtualCardTransactionsForUser(userId: string): VirtualCardTxRow[] {
  return VIRTUAL_CARD_TRANSACTIONS.filter((t) => t.userId === userId);
}
