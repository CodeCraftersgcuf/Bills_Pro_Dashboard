import React from "react";
import type { User } from "../data/users";
import WalletPanel from "./WalletPanel";

export interface UserProfileWalletTabProps {
  user: User;
}

const UserProfileWalletTab: React.FC<UserProfileWalletTabProps> = ({ user }) => {
  return <WalletPanel user={user} />;
};

export default UserProfileWalletTab;
