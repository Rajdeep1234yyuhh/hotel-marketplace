const FIXED_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Emails in SUPER_ADMIN_EMAILS are always ADMIN on Google sign-in and can't
// be deleted or demoted from the admin panel — see api/auth/bridge and
// api/admin/users/[id].
export function isFixedSuperAdmin(email: string): boolean {
  return FIXED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
