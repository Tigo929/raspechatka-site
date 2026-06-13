-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('lead', 'order');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('new', 'in_progress', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('telegram', 'max', 'phone');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('pending', 'processing', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "DeliveryStepState" AS ENUM ('pending', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "StorageBackend" AS ENUM ('local', 's3');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('pageview', 'session_end');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('mobile', 'desktop', 'tablet');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('yandex', 'avito', 'manual');

-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('running', 'idle', 'error');

-- CreateEnum
CREATE TYPE "RetentionRunStatus" AS ENUM ('running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "kind" "SubmissionKind" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'new',
    "name" TEXT NOT NULL,
    "contactMethod" "ContactMethod" NOT NULL,
    "contactValue" TEXT NOT NULL,
    "comment" TEXT,
    "orderDetails" JSONB,
    "personalDataConsent" BOOLEAN NOT NULL DEFAULT true,
    "imageRightsConsent" BOOLEAN,
    "consentAcceptedAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionFile" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "safeName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageBackend" "StorageBackend" NOT NULL DEFAULT 'local',
    "storageKey" TEXT NOT NULL,
    "bucket" TEXT,
    "checksumSha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SubmissionFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryOutboxJob" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "lastError" TEXT,
    "messageStatus" "DeliveryStepState" NOT NULL DEFAULT 'pending',
    "messageDeliveredAt" TIMESTAMP(3),
    "messageLastError" TEXT,
    "archiveRequired" BOOLEAN NOT NULL DEFAULT false,
    "archiveStatus" "DeliveryStepState" NOT NULL DEFAULT 'pending',
    "archiveDeliveredAt" TIMESTAMP(3),
    "archiveLastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryOutboxJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryAttempt" (
    "id" TEXT NOT NULL,
    "outboxJobId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "status" "DeliveryStepState" NOT NULL,
    "errorCode" TEXT,
    "errorMessageSanitized" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "page" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "device" "DeviceType" NOT NULL,
    "referrer" TEXT,
    "duration" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagedReview" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "source" "ReviewSource" NOT NULL DEFAULT 'manual',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagedReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "hours" TEXT NOT NULL DEFAULT '',
    "telegram" TEXT NOT NULL DEFAULT '',
    "max" TEXT NOT NULL DEFAULT '',
    "yandexMetrikaId" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Product" (
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceFrom" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "categorySlug" TEXT,
    "image" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "colors" JSONB NOT NULL,
    "material" TEXT NOT NULL,
    "printMethod" TEXT NOT NULL,
    "badge" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "version" BIGINT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "altText" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagedContent" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "pricing" JSONB NOT NULL DEFAULT '[]',
    "benefits" JSONB NOT NULL DEFAULT '[]',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "trustbar" JSONB NOT NULL DEFAULT '[]',
    "useCases" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "submissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerHeartbeat" (
    "workerName" TEXT NOT NULL,
    "status" "WorkerStatus" NOT NULL DEFAULT 'idle',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("workerName")
);

-- CreateTable
CREATE TABLE "RetentionRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "RetentionRunStatus" NOT NULL DEFAULT 'running',
    "deletedFiles" INTEGER NOT NULL DEFAULT 0,
    "failedFiles" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "RetentionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_reference_key" ON "Submission"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_idempotencyKey_key" ON "Submission"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Submission_status_createdAt_idx" ON "Submission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- CreateIndex
CREATE INDEX "Submission_processingStatus_createdAt_idx" ON "Submission"("processingStatus", "createdAt");

-- CreateIndex
CREATE INDEX "SubmissionFile_submissionId_idx" ON "SubmissionFile"("submissionId");

-- CreateIndex
CREATE INDEX "SubmissionFile_retentionUntil_deletedAt_idx" ON "SubmissionFile"("retentionUntil", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryOutboxJob_submissionId_key" ON "DeliveryOutboxJob"("submissionId");

-- CreateIndex
CREATE INDEX "DeliveryOutboxJob_status_nextAttemptAt_idx" ON "DeliveryOutboxJob"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "DeliveryOutboxJob_leaseUntil_idx" ON "DeliveryOutboxJob"("leaseUntil");

-- CreateIndex
CREATE INDEX "DeliveryAttempt_outboxJobId_idx" ON "DeliveryAttempt"("outboxJobId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_timestamp_idx" ON "AnalyticsEvent"("type", "timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_page_timestamp_idx" ON "AnalyticsEvent"("page", "timestamp");

-- CreateIndex
CREATE INDEX "ManagedReview_published_order_idx" ON "ManagedReview"("published", "order");

-- CreateIndex
CREATE INDEX "FaqItem_published_order_idx" ON "FaqItem"("published", "order");

-- CreateIndex
CREATE INDEX "Product_published_createdAt_idx" ON "Product"("published", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_path_key" ON "MediaAsset"("path");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actor_createdAt_idx" ON "AuditLog"("actor", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "SubmissionFile" ADD CONSTRAINT "SubmissionFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryOutboxJob" ADD CONSTRAINT "DeliveryOutboxJob_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAttempt" ADD CONSTRAINT "DeliveryAttempt_outboxJobId_fkey" FOREIGN KEY ("outboxJobId") REFERENCES "DeliveryOutboxJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES "Category"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
