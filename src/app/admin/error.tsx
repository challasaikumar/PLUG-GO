"use client";

import { AdminDenied } from "@/components/admin/AdminChrome";

export default function AdminError({ error }: { error: Error }) {
  return <AdminDenied title="Permission denied or admin error" body={error.message} />;
}
