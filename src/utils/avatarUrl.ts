/** Placeholder avatar when API does not return a photo URL. */
export function avatarUrlForName(name: string): string {
  const n = name.trim() || "?";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=1B800F&color=fff&size=128`;
}
