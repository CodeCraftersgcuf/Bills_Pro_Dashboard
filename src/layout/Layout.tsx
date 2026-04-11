import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Profile from "./components/Profile";

const MAIN_BG = "#F4F5F7";
const HEADER_BG = "#FFFFFF";

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <div
      className="flex h-full min-h-0 w-full max-h-full overflow-hidden"
      style={{ backgroundColor: MAIN_BG }}
    >
      {/* Sidebar */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-30 h-full max-h-full w-fit shrink-0 transition-transform duration-300 ease-out lg:static lg:z-auto lg:h-full lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar setMobileOpen={setMobileOpen} />
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main column — only <main> scrolls */}
      <div
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        style={{ backgroundColor: MAIN_BG }}
      >
        <header
          className="flex h-[70px] min-h-[70px] shrink-0 items-center justify-between border-b border-gray-200/80 px-4 shadow-sm md:px-8"
          style={{ backgroundColor: HEADER_BG }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="block rounded-lg p-1 text-gray-800 hover:bg-gray-100 hover:text-[#1B800F] lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Open menu"
            >
              <Menu className="h-8 w-8" strokeWidth={2} />
            </button>
          </div>
          <Profile />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
