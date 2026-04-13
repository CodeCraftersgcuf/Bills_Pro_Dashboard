/**
 * Profile → Transactions tab. Replace with API by user id.
 */

export type ProfileTxStatus = "Successful" | "Pending" | "Failed";
export type ProfileTxAsset = "Naira" | "Crypto";

export interface ProfileTxRow {
  id: string;
  userId: string;
  amount: string;
  status: ProfileTxStatus;
  type: ProfileTxAsset;
  subType: string;
  date: string;
  /** Used when Type === Crypto for "Crypto Tx Type" filter */
  cryptoTxKind?: "deposit" | "withdraw" | "buy" | "sell";
  /** Bill / airtime receipt (when subType is Bill Payments, etc.) */
  billerType?: string;
  billPhone?: string;
  /** Detail row "Transaction type", e.g. Airtime Recharge */
  billTransactionTypeLabel?: string;
}

export const PROFILE_TRANSACTIONS: ProfileTxRow[] = [
  {
    id: "aqjj123452345224",
    userId: "1",
    amount: "₦20,000",
    status: "Successful",
    type: "Naira",
    subType: "Deposit",
    date: "10/22/25 - 07:30 AM",
  },
  {
    id: "2348hf8283hfc92eni",
    userId: "1",
    amount: "₦200,000",
    status: "Successful",
    type: "Naira",
    subType: "Deposit",
    date: "22/10/25 - 07:30 AM",
  },
  {
    id: "bqkk234563456335wd01",
    userId: "1",
    amount: "₦15,500",
    status: "Pending",
    type: "Naira",
    subType: "Withdrawal",
    date: "21/10/25 - 02:15 PM",
  },
  {
    id: "crll345674567446ch01",
    userId: "1",
    amount: "0.42 BTC",
    status: "Failed",
    type: "Crypto",
    subType: "Deposit",
    date: "20/10/25 - 11:00 AM",
    cryptoTxKind: "deposit",
  },
  {
    id: "dsmm456785678557bp01",
    userId: "1",
    amount: "₦5,000",
    status: "Successful",
    type: "Naira",
    subType: "Bill Payments",
    date: "19/10/25 - 09:45 AM",
    billerType: "MTN",
    billPhone: "070123456789",
    billTransactionTypeLabel: "Airtime Recharge",
  },
  {
    id: "ethwd88291",
    userId: "1",
    amount: "0.5 ETH",
    status: "Pending",
    type: "Crypto",
    subType: "Withdrawal",
    date: "18/10/25 - 04:00 PM",
    cryptoTxKind: "withdraw",
  },
  {
    id: "usdtbuy001",
    userId: "1",
    amount: "1,000 USDT",
    status: "Successful",
    type: "Crypto",
    subType: "Buy",
    date: "17/10/25 - 10:00 AM",
    cryptoTxKind: "buy",
  },
  {
    id: "usdtsell002",
    userId: "1",
    amount: "500 USDT",
    status: "Successful",
    type: "Crypto",
    subType: "Sell",
    date: "16/10/25 - 02:00 PM",
    cryptoTxKind: "sell",
  },
  {
    id: "chioma-tx-1",
    userId: "2",
    amount: "₦50,000",
    status: "Successful",
    type: "Naira",
    subType: "Deposit",
    date: "12/10/25 - 09:00 AM",
  },
];

export function getProfileTransactionsForUser(userId: string): ProfileTxRow[] {
  return PROFILE_TRANSACTIONS.filter((t) => t.userId === userId);
}
