import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import {
  createAdminBanner,
  createAdminNotification,
  deleteAdminBanner,
  deleteAdminNotification,
  fetchAdminBanners,
  fetchAdminNotifications,
  type AdminBanner,
  type AdminPushNotification,
} from "../../api/adminNotifications";

const GREEN = "#1B800F";

const audienceOptions = [
  { value: "all", label: "All users" },
  { value: "active", label: "Active users" },
  { value: "banned", label: "Banned users" },
  { value: "kyc_pending", label: "KYC pending" },
  { value: "kyc_verified", label: "KYC verified" },
  { value: "new_users_30d", label: "New users (30d)" },
] as const;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

const Notification: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<(typeof audienceOptions)[number]["value"]>("all");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  const notificationsQ = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => fetchAdminNotifications({ per_page: 100 }),
  });
  const bannersQ = useQuery({
    queryKey: ["admin", "notification-banners"],
    queryFn: () => fetchAdminBanners({ per_page: 20 }),
  });

  const createPushMut = useMutation({
    mutationFn: createAdminNotification,
    onSuccess: async () => {
      setShowNotificationModal(false);
      setSubject("");
      setMessage("");
      setAudience("all");
      setAttachment(null);
      await qc.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
  });
  const createBannerMut = useMutation({
    mutationFn: createAdminBanner,
    onSuccess: async () => {
      setShowBannerModal(false);
      setBannerImage(null);
      await qc.invalidateQueries({ queryKey: ["admin", "notification-banners"] });
    },
  });
  const delPushMut = useMutation({
    mutationFn: deleteAdminNotification,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
  });
  const delBannerMut = useMutation({
    mutationFn: deleteAdminBanner,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "notification-banners"] });
    },
  });

  const notifications = notificationsQ.data?.data ?? [];
  const banners = bannersQ.data?.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter(
      (n) =>
        n.subject.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.audience.toLowerCase().includes(q)
    );
  }, [notifications, search]);

  const savePush = () => {
    if (!subject.trim() || !message.trim()) return;
    createPushMut.mutate({
      subject: subject.trim(),
      message: message.trim(),
      audience,
      attachment,
    });
  };

  const saveBanner = () => {
    if (!bannerImage) return;
    createBannerMut.mutate({ image: bannerImage, is_active: true });
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <section className="rounded-3xl p-5 text-white shadow-md md:p-6" style={{ backgroundColor: GREEN }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-sm text-white/80">Active Banners</p>
          </div>
          <button
            type="button"
            onClick={() => setShowBannerModal(true)}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-800"
          >
            + New Banner
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {banners.length === 0 ? (
            <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/80">No banners yet.</div>
          ) : (
            banners.slice(0, 3).map((b: AdminBanner) => (
              <div key={b.id} className="overflow-hidden rounded-2xl bg-white/10">
                <img src={b.image} alt={`Banner ${b.id}`} className="h-28 w-full object-cover" />
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-white/80">{formatDate(b.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => delBannerMut.mutate(b.id)}
                    className="rounded-full p-1.5 text-red-200 hover:bg-white/10"
                    aria-label="Delete banner"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div className="flex items-center justify-between bg-[#34B233] px-5 py-4 text-white">
          <h2 className="text-lg font-semibold">Notification</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-full border-0 bg-white/20 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/80 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setShowNotificationModal(true)}
              className="rounded-full bg-[#34B233] px-4 py-2 text-xs font-semibold text-white"
            >
              + New Notification
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#EBEBEB] text-gray-700">
                <tr>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No notifications found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((n: AdminPushNotification, i: number) => (
                    <tr key={n.id} className={i % 2 === 0 ? "bg-[#F9F9F9]" : "bg-[#EDEDED]"}>
                      <td className="px-4 py-3 font-medium text-gray-900">{n.subject}</td>
                      <td className="px-4 py-3 max-w-[320px] truncate text-gray-700">{n.message}</td>
                      <td className="px-4 py-3 text-gray-700">{n.audience}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(n.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" className="rounded-full bg-white p-2 text-gray-600" aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => delPushMut.mutate(n.id)}
                            className="rounded-full bg-white p-2 text-red-500"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showNotificationModal ? (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#F3F4F6] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">New Notification</h3>
              <button type="button" onClick={() => setShowNotificationModal(false)}>
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-700">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border-0 bg-[#E5E7EB] px-3 py-2.5 text-sm"
                  placeholder="Subject"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-700">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="h-28 w-full rounded-xl border-0 bg-[#E5E7EB] px-3 py-2.5 text-sm"
                  placeholder="Type message"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-700">Audience</label>
                <div className="relative">
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as (typeof audienceOptions)[number]["value"])}
                    className="w-full appearance-none rounded-xl border-0 bg-[#E5E7EB] px-3 py-2.5 text-sm"
                  >
                    {audienceOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-700">Attachment</label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#E5E7EB] px-3 py-2 text-sm">
                  <Upload className="h-4 w-4" />
                  {attachment ? "Attachment selected" : "Upload file"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const b64 = await fileToBase64(f);
                      setAttachment(b64);
                    }}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={savePush}
                disabled={createPushMut.isPending || !subject.trim() || !message.trim()}
                className="w-full rounded-full bg-[#42B833] py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showBannerModal ? (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#F3F4F6] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">New Banner</h3>
              <button type="button" onClick={() => setShowBannerModal(false)}>
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl bg-[#E5E7EB] text-sm text-gray-600">
              <Upload className="mb-2 h-5 w-5" />
              Click to upload banner
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const b64 = await fileToBase64(f);
                  setBannerImage(b64);
                }}
              />
            </label>
            {bannerImage ? <img src={bannerImage} alt="banner preview" className="mt-3 h-24 w-full rounded-lg object-cover" /> : null}
            <button
              type="button"
              onClick={saveBanner}
              disabled={createBannerMut.isPending || !bannerImage}
              className="mt-4 w-full rounded-full bg-[#42B833] py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Notification;
