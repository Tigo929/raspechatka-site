import { redirect } from "next/navigation";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { categories } from "@/data/categories";
import { baseProducts } from "@/data/products";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getManagedProducts } from "@/lib/product-repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminConfigured() || !(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <AdminDashboard
      initialProducts={await getManagedProducts()}
      baseProducts={baseProducts}
      categories={categories}
    />
  );
}
