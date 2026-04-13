import React from "react";
import type { User } from "../data/users";
import VirtualCardsPanel from "./VirtualCardsPanel";

export interface UserProfileVirtualCardsTabProps {
  user: User;
}

/** User Management → Virtual Cards tab — same workspace as main Virtual Cards page modal. */
const UserProfileVirtualCardsTab: React.FC<UserProfileVirtualCardsTabProps> = ({ user }) => {
  return <VirtualCardsPanel user={user} />;
};

export default UserProfileVirtualCardsTab;
