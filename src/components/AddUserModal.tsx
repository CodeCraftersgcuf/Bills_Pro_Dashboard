import React, { useEffect, useState } from "react";
import { X, Pencil, Eye, EyeOff } from "lucide-react";
import type { User } from "../data/users";

const GREEN_ADD = "#1B800F";
const GREEN_SAVE = "#42AC36";

const defaultAvatar =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face";

const inputClass =
  "w-full rounded-xl border-0 bg-[#DCDCDE] px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/35";

export interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  /** `add` — empty form (User Management). `edit` — requires `user`. */
  mode?: "add" | "edit";
  /** Current user record; used when `mode === "edit"` (same fields you’ll get from API). */
  user?: User | null;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onClose, mode = "add", user = null }) => {
  const isEdit = mode === "edit";
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
      setEmail("");
      setPhone("");
      setPassword("");
      setAvatarPreview(defaultAvatar);
      return;
    }
    if (isEdit && user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setPhone(user.phone);
      setPassword("");
      setAvatarPreview(user.avatarUrl || defaultAvatar);
    } else if (!isEdit) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setAvatarPreview(defaultAvatar);
    }
  }, [open, isEdit, user]);

  if (!open) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call API with { firstName, lastName, email, phone, password?, avatar? }
    onClose();
  };

  const title = isEdit ? "Edit Details" : "Add New User";
  const titleId = isEdit ? "edit-user-modal-title" : "add-user-modal-title";
  const saveColor = isEdit ? GREEN_SAVE : GREEN_ADD;
  const idPrefix = isEdit ? "edit-user" : "add-user";

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
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-[480px] overflow-hidden rounded-3xl bg-[#EBEBED] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-300/80 px-6 pb-4 pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-xl font-bold text-gray-900">
              {title}
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

          <div className="space-y-4">
            <div>
              <label htmlFor={`${idPrefix}-first`} className="mb-1.5 block text-sm font-bold text-gray-900">
                First name
              </label>
              <input
                id={`${idPrefix}-first`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className={inputClass}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-last`} className="mb-1.5 block text-sm font-bold text-gray-900">
                Last name
              </label>
              <input
                id={`${idPrefix}-last`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className={inputClass}
                autoComplete="family-name"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-email`} className="mb-1.5 block text-sm font-bold text-gray-900">
                Email
              </label>
              <input
                id={`${idPrefix}-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-phone`} className="mb-1.5 block text-sm font-bold text-gray-900">
                Phone Number
              </label>
              <input
                id={`${idPrefix}-phone`}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className={inputClass}
                autoComplete="tel"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-password`} className="mb-1.5 block text-sm font-bold text-gray-900">
                Password
              </label>
              <div className="relative">
                <input
                  id={`${idPrefix}-password`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
                  className={`${inputClass} pr-12`}
                  autoComplete={isEdit ? "current-password" : "new-password"}
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
            className="mt-8 w-full rounded-2xl py-3.5 text-base font-bold text-white shadow-md transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B800F]/50"
            style={{ backgroundColor: saveColor }}
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
