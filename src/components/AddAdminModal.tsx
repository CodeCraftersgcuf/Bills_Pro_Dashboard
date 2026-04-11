import React, { useEffect, useState } from "react";
import { X, Pencil, Eye, EyeOff, ChevronDown } from "lucide-react";

const GREEN = "#1B800F";

const defaultAvatar =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face";

const inputClass =
  "w-full rounded-2xl border-0 bg-[#DCDCDE] px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/35";

export interface AddAdminModalProps {
  open: boolean;
  onClose: () => void;
}

const AddAdminModal: React.FC<AddAdminModalProps> = ({ open, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(defaultAvatar);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setShowPassword(false);
      setFirstName("");
      setLastName("");
      setRole("");
      setLoginEmail("");
      setLoginPassword("");
      setAvatarPreview(defaultAvatar);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-admin-modal-title"
        className="relative z-[1] w-full max-w-[480px] overflow-hidden rounded-3xl bg-[#EBEBED] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-300/80 px-6 pb-4 pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id="add-admin-modal-title" className="text-xl font-bold text-gray-900">
              Add New Admin
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-300/90 text-gray-700 transition-colors hover:bg-gray-400"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="px-6 pb-6 pt-5">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="h-28 w-28 overflow-hidden rounded-full bg-white shadow-md ring-4 ring-white">
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" width={112} height={112} />
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-white shadow-md transition-opacity hover:opacity-90"
                aria-label="Change photo"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="add-admin-first" className="mb-2 block text-sm font-bold text-gray-900">
                First name
              </label>
              <input
                id="add-admin-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className={inputClass}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="add-admin-last" className="mb-2 block text-sm font-bold text-gray-900">
                Last name
              </label>
              <input
                id="add-admin-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className={inputClass}
                autoComplete="family-name"
              />
            </div>
            <div>
              <label htmlFor="add-admin-role" className="mb-2 block text-sm font-bold text-gray-900">
                Role
              </label>
              <div className="relative">
                <select
                  id="add-admin-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer pr-11`}
                  aria-label="Select role"
                >
                  <option value="">Select role</option>
                  <option value="Owner">Owner</option>
                  <option value="Admin">Admin</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600"
                  strokeWidth={2}
                />
              </div>
            </div>
            <div>
              <label htmlFor="add-admin-email" className="mb-2 block text-sm font-bold text-gray-900">
                Login Email
              </label>
              <input
                id="add-admin-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter login email"
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="add-admin-password" className="mb-2 block text-sm font-bold text-gray-900">
                Login Password
              </label>
              <div className="relative">
                <input
                  id="add-admin-password"
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter login password"
                  className={`${inputClass} pr-12`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-600 hover:bg-black/5 hover:text-gray-900"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-full py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B800F]/50"
            style={{ backgroundColor: GREEN }}
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAdminModal;
