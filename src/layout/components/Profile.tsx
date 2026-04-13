import React from "react";
import { getAdminUser } from "../../api/authSession";
import { avatarUrlForName } from "../../utils/avatarUrl";

const Profile: React.FC = () => {
  const u = getAdminUser();
  const name =
    u?.name?.trim() ||
    [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
    u?.email?.split("@")[0] ||
    "Admin";
  const avatarUrl = avatarUrlForName(name);

  return (
    <div className="flex items-center gap-3">
      <img
        src={avatarUrl}
        alt=""
        className="rounded-full object-cover shrink-0 ring-2 ring-gray-100"
        width={44}
        height={44}
      />
      <h2 className="text-base font-normal text-gray-900 md:text-lg">Hey {name}</h2>
    </div>
  );
};

export default Profile;
