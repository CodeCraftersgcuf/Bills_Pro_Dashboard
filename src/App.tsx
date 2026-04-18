import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import "./App.css";

import Login from "./auth/Login";
import RequireAuth from "./auth/RequireAuth";
import Dashboard from "./pages/dashboard/Dashboard";
import UserManagement from "./pages/userManagement/UserManagement";
import UserProfile from "./pages/userManagement/UserProfile";
import Transaction from "./pages/transaction/Transaction";
import KYC from "./pages/kyc/KYC";
import VirtualCards from "./pages/virtualCards/VirtualCards";
import WalletManagement from "./pages/walletManagement/WalletManagement";
import Rates from "./pages/rates/Rates";
import BillPayments from "./pages/billPayments/BillPayments";
import MasterWallet from "./pages/masterWallet/MasterWallet";
import ReceivedCrypto from "./pages/receivedCrypto/ReceivedCrypto";
import CryptoVendors from "./pages/cryptoVendors/CryptoVendors";
import ProfitCenter from "./pages/profit/ProfitCenter";
import Analytics from "./pages/analytics/Analytics";
import Support from "./pages/support/Support";
import Notification from "./pages/notification/Notification";
import Setting from "./pages/setting/Setting";
import AdminDetail from "./pages/setting/AdminDetail";
import VirtualCardLegal from "./pages/legal/VirtualCardLegal";

const App: React.FC = () => {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <BrowserRouter>
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="user/management" element={<UserManagement />} />
                <Route path="user/management/profile/:userId" element={<UserProfile />} />
                <Route path="transaction" element={<Transaction />} />
                <Route path="kyc" element={<KYC />} />
                <Route path="virtual-cards" element={<VirtualCards />} />
                <Route path="legal/virtual-card" element={<VirtualCardLegal />} />
                <Route path="wallet-management" element={<WalletManagement />} />
                <Route path="rates" element={<Rates />} />
                <Route path="bill-payments" element={<BillPayments />} />
                <Route path="master-wallet" element={<MasterWallet />} />
                <Route path="received-crypto" element={<ReceivedCrypto />} />
                <Route path="crypto-vendors" element={<CryptoVendors />} />
                <Route path="profit" element={<ProfitCenter />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="support" element={<Support />} />
                <Route path="notification" element={<Notification />} />
                <Route path="settings" element={<Setting />} />
                <Route path="settings/admin/:adminId" element={<AdminDetail />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
};

export default App;
