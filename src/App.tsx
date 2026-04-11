import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import "./App.css";

import Login from "./auth/Login";
import Register from "./auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import UserManagement from "./pages/userManagement/UserManagement";
import Transaction from "./pages/transaction/Transaction";
import KYC from "./pages/kyc/KYC";
import WalletManagement from "./pages/walletManagement/WalletManagement";
import Rates from "./pages/rates/Rates";
import P2P from "./pages/p2p/P2P";
import ChatAppeals from "./pages/chatAppeals/ChatAppeals";
import MasterWallet from "./pages/masterWallet/MasterWallet";
import Rewards from "./pages/rewards/Rewards";
import Analytics from "./pages/analytics/Analytics";
import Support from "./pages/support/Support";
import Notification from "./pages/notification/Notification";
import Setting from "./pages/setting/Setting";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="user/management" element={<UserManagement />} />
          <Route path="transaction" element={<Transaction />} />
          <Route path="kyc" element={<KYC />} />
          <Route path="wallet-management" element={<WalletManagement />} />
          <Route path="rates" element={<Rates />} />
          <Route path="p2p" element={<P2P />} />
          <Route path="chat-appeals" element={<ChatAppeals />} />
          <Route path="master-wallet" element={<MasterWallet />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="support" element={<Support />} />
          <Route path="notification" element={<Notification />} />
          <Route path="settings" element={<Setting />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
