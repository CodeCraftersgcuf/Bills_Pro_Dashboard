import React from "react";

interface ProfileProps {
  name?: string;
  /** Optional avatar URL; defaults to a neutral placeholder */
  avatarUrl?: string;
}

const Profile: React.FC<ProfileProps> = ({
  name = "Admin",
  avatarUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&h=96&fit=crop&crop=face",
}) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src={avatarUrl}
        alt=""
        className="rounded-full object-cover shrink-0 ring-2 ring-gray-100"
        width={44}
        height={44}
      />
      <h2 className="text-gray-900 text-base md:text-lg font-normal">Hey {name}</h2>
    </div>
  );
};

export default Profile;
