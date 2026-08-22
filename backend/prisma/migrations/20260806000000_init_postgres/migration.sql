-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'USER');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BroadcastChannel" AS ENUM ('EMAIL', 'TELEGRAM', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "BroadcastConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "BroadcastProvider" AS ENUM ('EMAIL_SMTP', 'TELEGRAM_BOT', 'WHATSAPP_BAILEYS', 'WHATSAPP_OFFICIAL', 'WHATSAPP_WAHA', 'WHATSAPP_EVOLUTION', 'INSTAGRAM_META', 'FACEBOOK_META');

-- CreateEnum
CREATE TYPE "BroadcastConnectionMode" AS ENUM ('PRODUCTION', 'EXPERIMENTAL');

-- CreateEnum
CREATE TYPE "BroadcastCampaignStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BroadcastDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('PAGE', 'POST');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('LABOR', 'MATERIAL', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "RabStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "type" "ContentType" NOT NULL DEFAULT 'POST',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "coverImage" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "focusKeyword" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "compareAtPrice" DECIMAL(12,2),
    "sku" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "service" TEXT,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "preferredChannel" "BroadcastChannel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "telegramChatId" TEXT,
    "instagramHandle" TEXT,
    "facebookPageScopedId" TEXT,
    "preferredChannel" "BroadcastChannel",
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "consentSource" TEXT,
    "tags" JSONB,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inquiryId" TEXT,

    CONSTRAINT "BroadcastContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastChannelConnection" (
    "id" TEXT NOT NULL,
    "channel" "BroadcastChannel" NOT NULL,
    "provider" "BroadcastProvider" NOT NULL,
    "mode" "BroadcastConnectionMode" NOT NULL DEFAULT 'PRODUCTION',
    "accountKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "senderIdentity" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "dailyLimit" INTEGER,
    "hourlyLimit" INTEGER,
    "status" "BroadcastConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "statusMessage" TEXT,
    "config" JSONB,
    "cooldownUntil" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastChannelConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" "BroadcastChannel" NOT NULL,
    "status" "BroadcastCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "audienceType" TEXT NOT NULL DEFAULT 'ALL_CONTACTS',
    "audienceFilter" JSONB,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "connectionId" TEXT,

    CONSTRAINT "BroadcastCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastDelivery" (
    "id" TEXT NOT NULL,
    "channel" "BroadcastChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "BroadcastDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT,
    "connectionId" TEXT,

    CONSTRAINT "BroadcastDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "order" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SiteCollectionItem" (
    "id" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "body" TEXT,
    "icon" TEXT,
    "imageUrl" TEXT,
    "href" TEXT,
    "meta" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteCollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ahsp" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT,
    "overheadPct" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ahsp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AhspComponent" (
    "id" TEXT NOT NULL,
    "ahspId" TEXT NOT NULL,
    "priceItemId" TEXT NOT NULL,
    "coefficient" DECIMAL(12,4) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AhspComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rab" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientName" TEXT,
    "location" TEXT,
    "projectDate" TIMESTAMP(3),
    "status" "RabStatus" NOT NULL DEFAULT 'DRAFT',
    "taxPct" DECIMAL(5,2) NOT NULL DEFAULT 11,
    "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Rab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RabSection" (
    "id" TEXT NOT NULL,
    "rabId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RabSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "rabId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientCompany" TEXT,
    "clientAddress" TEXT,
    "attentionTo" TEXT,
    "subject" TEXT NOT NULL,
    "openingNote" TEXT,
    "closingNote" TEXT,
    "terms" TEXT,
    "paymentTerms" JSONB,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "signerName" TEXT NOT NULL,
    "signerTitle" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "discountAmount" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RabItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "ahspId" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "volume" DECIMAL(15,3) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RabItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Content_slug_key" ON "Content"("slug");

-- CreateIndex
CREATE INDEX "Content_status_idx" ON "Content"("status");

-- CreateIndex
CREATE INDEX "Content_type_idx" ON "Content"("type");

-- CreateIndex
CREATE INDEX "Content_categoryId_idx" ON "Content"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastContact_inquiryId_key" ON "BroadcastContact"("inquiryId");

-- CreateIndex
CREATE INDEX "BroadcastContact_isActive_idx" ON "BroadcastContact"("isActive");

-- CreateIndex
CREATE INDEX "BroadcastContact_preferredChannel_idx" ON "BroadcastContact"("preferredChannel");

-- CreateIndex
CREATE INDEX "BroadcastChannelConnection_channel_isEnabled_idx" ON "BroadcastChannelConnection"("channel", "isEnabled");

-- CreateIndex
CREATE INDEX "BroadcastChannelConnection_channel_provider_idx" ON "BroadcastChannelConnection"("channel", "provider");

-- CreateIndex
CREATE INDEX "BroadcastChannelConnection_channel_isPrimary_priority_idx" ON "BroadcastChannelConnection"("channel", "isPrimary", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastChannelConnection_channel_accountKey_key" ON "BroadcastChannelConnection"("channel", "accountKey");

-- CreateIndex
CREATE INDEX "BroadcastCampaign_channel_idx" ON "BroadcastCampaign"("channel");

-- CreateIndex
CREATE INDEX "BroadcastCampaign_status_idx" ON "BroadcastCampaign"("status");

-- CreateIndex
CREATE INDEX "BroadcastCampaign_createdById_idx" ON "BroadcastCampaign"("createdById");

-- CreateIndex
CREATE INDEX "BroadcastDelivery_campaignId_status_idx" ON "BroadcastDelivery"("campaignId", "status");

-- CreateIndex
CREATE INDEX "BroadcastDelivery_contactId_idx" ON "BroadcastDelivery"("contactId");

-- CreateIndex
CREATE INDEX "BroadcastDelivery_connectionId_idx" ON "BroadcastDelivery"("connectionId");

-- CreateIndex
CREATE INDEX "SiteSetting_group_order_idx" ON "SiteSetting"("group", "order");

-- CreateIndex
CREATE INDEX "SiteCollectionItem_collection_order_idx" ON "SiteCollectionItem"("collection", "order");

-- CreateIndex
CREATE INDEX "SiteCollectionItem_isActive_idx" ON "SiteCollectionItem"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PriceItem_code_key" ON "PriceItem"("code");

-- CreateIndex
CREATE INDEX "PriceItem_type_idx" ON "PriceItem"("type");

-- CreateIndex
CREATE INDEX "PriceItem_isActive_idx" ON "PriceItem"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Ahsp_code_key" ON "Ahsp"("code");

-- CreateIndex
CREATE INDEX "Ahsp_category_idx" ON "Ahsp"("category");

-- CreateIndex
CREATE INDEX "Ahsp_isActive_idx" ON "Ahsp"("isActive");

-- CreateIndex
CREATE INDEX "AhspComponent_ahspId_idx" ON "AhspComponent"("ahspId");

-- CreateIndex
CREATE INDEX "AhspComponent_priceItemId_idx" ON "AhspComponent"("priceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Rab_number_key" ON "Rab"("number");

-- CreateIndex
CREATE INDEX "Rab_status_idx" ON "Rab"("status");

-- CreateIndex
CREATE INDEX "Rab_createdById_idx" ON "Rab"("createdById");

-- CreateIndex
CREATE INDEX "RabSection_rabId_idx" ON "RabSection"("rabId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_number_key" ON "Quotation"("number");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_rabId_idx" ON "Quotation"("rabId");

-- CreateIndex
CREATE INDEX "Quotation_createdById_idx" ON "Quotation"("createdById");

-- CreateIndex
CREATE INDEX "RabItem_sectionId_idx" ON "RabItem"("sectionId");

-- CreateIndex
CREATE INDEX "RabItem_ahspId_idx" ON "RabItem"("ahspId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastContact" ADD CONSTRAINT "BroadcastContact_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastCampaign" ADD CONSTRAINT "BroadcastCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastCampaign" ADD CONSTRAINT "BroadcastCampaign_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "BroadcastChannelConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastDelivery" ADD CONSTRAINT "BroadcastDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BroadcastCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastDelivery" ADD CONSTRAINT "BroadcastDelivery_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "BroadcastContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastDelivery" ADD CONSTRAINT "BroadcastDelivery_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "BroadcastChannelConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AhspComponent" ADD CONSTRAINT "AhspComponent_ahspId_fkey" FOREIGN KEY ("ahspId") REFERENCES "Ahsp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AhspComponent" ADD CONSTRAINT "AhspComponent_priceItemId_fkey" FOREIGN KEY ("priceItemId") REFERENCES "PriceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rab" ADD CONSTRAINT "Rab_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RabSection" ADD CONSTRAINT "RabSection_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RabItem" ADD CONSTRAINT "RabItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "RabSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RabItem" ADD CONSTRAINT "RabItem_ahspId_fkey" FOREIGN KEY ("ahspId") REFERENCES "Ahsp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

