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
    setIsActive(location.pathname.split("/")[1] === link.split("/")[1]);
  }, [location.pathname, link, sub]);

  return (
    <div className="relative">
      <Link
        to={link}
        onClick={onClick}
        className={`flex items-center gap-3 py-3 rounded-lg transition-all duration-200 relative
          ${
            isActive
              ? "text-gray-900 pl-5 pr-4"
              : "text-white/70 hover:text-white hover:bg-white/10 px-4"
          }`}
        style={
          isActive
            ? {
                background: "linear-gradient(90deg, #FFFFFF 0%, #1DB61D 100%)",
              }
            : {}
        }
      >
        {isActive && (
          <div className="absolute left-1 top-[9%] h-[85%] w-[6px] bg-black rounded z-10" />
        )}
        <div className="flex items-center gap-3 relative z-20">
          <Icon
            className="w-5 h-5 shrink-0"
            strokeWidth={2}
            style={
              isActive
                ? {
                    color: "#0f172a",
                  }
                : { opacity: 0.85 }
            }
          />
          {!menuStatus && <span className="font-medium">{name}</span>}
        </div>
      </Link>
    </div>
  );
};

export default LinkComp;
