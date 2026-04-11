import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface SubLink {
  name: string;
  link: string;
  icon?: LucideIcon;
}

interface LinkCompProps {
  name: string;
  link: string;
  sub?: SubLink[];
  isActiveCheck: boolean;
  icon: LucideIcon;
  onClick: () => void;
  menuStatus: boolean;
}

function pathMatchesLink(pathname: string, link: string): boolean {
  if (pathname === link) return true;
  if (link !== "/" && pathname.startsWith(`${link}/`)) return true;
  return false;
}

const LinkComp: React.FC<LinkCompProps> = ({
  name,
  link,
  sub = [],
  isActiveCheck,
  icon: Icon,
  onClick,
  menuStatus,
}) => {
  const location = useLocation();
  const [isActive, setIsActive] = useState<boolean>(isActiveCheck);

  useEffect(() => {
    setIsActive(pathMatchesLink(location.pathname, link));
  }, [location.pathname, link, sub]);

  return (
    <div className="relative px-1">
      <Link
        to={link}
        onClick={onClick}
        className={`flex items-center gap-3 py-3 rounded-xl transition-all duration-200
          ${
            isActive
              ? "bg-[#E8E8EA] text-gray-900 px-3"
              : "text-white hover:bg-white/10 px-3"
          }`}
      >
        <Icon
          className={`w-5 h-5 shrink-0 ${isActive ? "text-gray-900" : "text-white"}`}
          strokeWidth={1.75}
        />
        {!menuStatus && <span className="font-medium text-[15px] leading-tight">{name}</span>}
      </Link>
    </div>
  );
};

export default LinkComp;
