import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import LinkComp from "./components/Link";
import { Sidebar_links } from "../constants/sidebarLinks";

const SIDEBAR_BG = "#1B800F";

interface SidebarProps {
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ setMobileOpen }) => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState<string>("/dashboard");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <style>
        {`
          .sidebar-scroll::-webkit-scrollbar { display: none; }
          .sidebar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>
      <div
        className={`flex h-full min-h-0 flex-col transition-all duration-300 ${menuOpen ? "w-[80px]" : "w-[280px]"} text-white`}
        style={{ backgroundColor: SIDEBAR_BG }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 min-h-[70px] flex-shrink-0 border-b border-black/15"
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          <div className="flex justify-end lg:hidden absolute right-4 top-1/2 -translate-y-1/2">
            <button
              type="button"
              className="text-xl cursor-pointer text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          {!menuOpen && (
            <h1 className="text-[1.35rem] font-bold tracking-tight leading-none w-full text-center lg:text-left pr-10 lg:pr-0">
              <span className="text-white">Bills</span>
              <span className="text-[#BEF264]">Pro</span>
            </h1>
          )}
          {menuOpen && (
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="mx-auto p-2 rounded-lg bg-black/15 text-white hover:bg-black/25"
              aria-label="Expand sidebar"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            </button>
          )}
        </div>

        <div
          className="flex-1 flex flex-col min-h-0 overflow-hidden sidebar-scroll border-r border-black/10"
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          <nav className="mt-3 px-3 flex-1 overflow-y-auto pb-2">
            <ul className="space-y-1">
              {Sidebar_links.map((x, index) => (
                <li key={index}>
                  <LinkComp
                    name={x.name}
                    link={x.link}
                    icon={x.icon}
                    sub={x.sublinks}
                    isActiveCheck={activeLink === x.link}
                    onClick={() => setActiveLink(x.link)}
                    menuStatus={menuOpen}
                  />
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-4 pt-2 pb-1">
            <div className="h-px bg-black/25" />
          </div>

          <div className="p-3 px-4 pb-5 flex-shrink-0">
            <button
              type="button"
              className="flex items-center gap-3 py-3 px-3 rounded-xl w-full text-white font-medium hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.75} />
              {!menuOpen && <span className="text-[15px]">Logout</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
