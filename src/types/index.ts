/** Общие типы домена сайта «Распечатка». */

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  priceFrom: number;
  rating: number;
  reviewsCount: number;
  category: string;
  image: string;
  imageAlt: string;
  colors: ProductColor[];
  material: string;
  printMethod: string;
  badge?: string;
  published?: boolean;
  managed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedProduct extends Product {
  managed: true;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  slug: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

export type ReviewSource = "yandex" | "avito" | "manual";

export interface Review {
  name: string;
  context: string;
  rating: number;
  text: string;
  date: string;
  source?: ReviewSource;
}

export interface ManagedReview extends Review {
  id: string;
  source: ReviewSource;
  published: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ManagedFaqItem extends FaqItem {
  id: string;
  order: number;
  published: boolean;
}

export interface ManagedSettings {
  phone: string;
  email: string;
  address: string;
  hours: string;
  telegram: string;
  max: string;
  yandexMetrikaId: string;
}

export interface AnalyticsEvent {
  id: string;
  type: "pageview" | "session_end";
  page: string;
  sessionId: string;
  duration?: number;
  device: "mobile" | "desktop" | "tablet";
  referrer?: string;
  timestamp: string;
}

export type ContactMethod = "telegram" | "max" | "phone";

export interface SubmissionContact {
  method: ContactMethod;
  value: string;
}

export type SubmissionStatus = "pending" | "delivered" | "failed";

export interface SubmissionFile {
  key: "frontImage" | "backImage" | "frontPreview" | "backPreview";
  originalName: string;
  storedPath: string;
  mimeType: string;
  size: number;
}

export interface StoredSubmission {
  id: string;
  reference: string;
  kind: "lead" | "order";
  status: SubmissionStatus;
  name: string;
  contact: SubmissionContact;
  comment?: string;
  orderDetails?: Record<string, unknown>;
  files: SubmissionFile[];
  personalDataConsent: true;
  imageRightsConsent?: boolean;
  consentAcceptedAt: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export interface Benefit {
  icon: string;
  title: string;
  text: string;
}

export interface Step {
  title: string;
  text: string;
}

export interface UseCase {
  title: string;
  text: string;
  image: string;
  imageAlt: string;
}

export interface PricingTier {
  name: string;
  price: number;
  oldPrice: number | null;
  badge: string | null;
  note: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured: boolean;
}

export interface ManagedContent {
  pricing: PricingTier[];
  benefits: Benefit[];
  steps: Step[];
  trustbar: string[];
  useCases: UseCase[];
}

export interface SeoLanding {
  slug: string;
  heading: string;
  metaTitle: string;
  metaDescription: string;
  keyword: string;
  intro: string;
  sellingPoints: { title: string; text: string }[];
  productSlugs: string[];
  faq: FaqItem[];
}
