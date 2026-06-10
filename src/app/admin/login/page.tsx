import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/admin/AdminLoginForm";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-extrabold">
            Распечат<span className="text-accent">ка</span>
          </p>
          <h1 className="mt-6 text-xl font-bold">Управление каталогом</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Войдите, чтобы добавлять и редактировать готовые принты.
          </p>
        </div>
        {isAdminConfigured() ? (
          <AdminLoginForm />
        ) : (
          <div className="border-line rounded-lg border bg-white p-5 text-sm shadow-sm">
            <p className="font-semibold">Нужна первоначальная настройка</p>
            <p className="mt-2 leading-relaxed text-neutral-600">
              Добавьте переменные <code>ADMIN_PASSWORD</code> и
              <code className="ml-1">ADMIN_SESSION_SECRET</code> длиной от 12
              символов, затем перезапустите приложение.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
