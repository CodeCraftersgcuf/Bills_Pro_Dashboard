import React from "react";
import { CircleUserRound } from "lucide-react";

interface ProfileProps {
  name?: string;
}

const Profile: React.FC<ProfileProps> = ({ name = "Admin" }) => {
  return (
    <div className="flex items-center gap-4">
      <CircleUserRound
        className="text-white/90 shrink-0"
        strokeWidth={1.5}
        style={{ width: "44px", height: "44px" }}
      />
      <h2 className="text-white text-lg" style={{ fontWeight: 400 }}>
        Hey {name}
      </h2>
    </div>
  );
};

export default Profile;
