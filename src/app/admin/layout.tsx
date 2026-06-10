import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Управление каталогом",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-admin-root className="min-h-dvh bg-[#f3f4f6] text-[#171717]">
      {children}
    </div>
  );
}
