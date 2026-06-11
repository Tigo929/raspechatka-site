import { redirect } from "next/navigation";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getManagedProducts, getBaseProducts } from "@/lib/product-repository";
import { getReviews, getFaq, getSettings, getContent, getCategories } from "@/lib/content-repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminConfigured() || !(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [products, baseProducts, categories, reviews, faqItems, settings, content] = await Promise.all([
    getManagedProducts(),
    getBaseProducts(),
    getCategories(),
    getReviews(),
    getFaq(),
    getSettings(),
    getContent(),
  ]);

  return (
    <AdminDashboard
      initialProducts={products}
      baseProducts={baseProducts}
      categories={categories}
      initialReviews={reviews}
      initialFaq={faqItems}
      initialSettings={settings}
      initialContent={content}
    />
  );
}
