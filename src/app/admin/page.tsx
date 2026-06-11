import { redirect } from "next/navigation";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { categories } from "@/data/categories";
import { baseProducts } from "@/data/products";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getManagedProducts } from "@/lib/product-repository";
import { getReviews, getFaq, getSettings } from "@/lib/content-repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminConfigured() || !(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [products, reviews, faqItems, settings] = await Promise.all([
    getManagedProducts(),
    getReviews(),
    getFaq(),
    getSettings(),
  ]);

  return (
    <AdminDashboard
      initialProducts={products}
      baseProducts={baseProducts}
      categories={categories}
      initialReviews={reviews}
      initialFaq={faqItems}
      initialSettings={settings}
    />
  );
}
