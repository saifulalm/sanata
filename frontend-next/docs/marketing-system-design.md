# Marketing System Design Document

**Version:** 1.0  
**Date:** September 2026  
**Project:** Construction Company CRM - Marketing Module

---

## Executive Summary

This document outlines the comprehensive design for a Marketing System integrated into the existing Construction Company CRM. The system will provide multi-channel marketing capabilities including WhatsApp Business API, Instagram Integration, Email Marketing, Offer/Promotion Management, Lead Management, and Analytics Dashboard.

The design builds upon the existing broadcast infrastructure (Prisma models, Express backend, Next.js frontend) and extends it with enterprise-grade marketing features tailored for construction company needs.

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
+------------------------------------------------------------------+
|                           ADMIN DASHBOARD                          |
|  +------------+  +------------+  +------------+  +------------+    |
|  | WhatsApp   |  | Instagram  |  | Email     |  | Offers &   |    |
|  | Center     |  | Center     |  | Marketing |  | Promotions |    |
|  +------------+  +------------+  +------------+  +------------+    |
|  +------------+  +------------+  +------------+                   |
|  | Lead       |  | Analytics  |  | Templates |                   |
|  | Management |  | Dashboard  |  | Library   |                   |
|  +------------+  +------------+  +------------+                   |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                         MARKETING API GATEWAY                       |
|  +------------+  +------------+  +------------+  +------------+    |
|  | WhatsApp   |  | Instagram  |  | Email     |  | Offer      |    |
|  | Service    |  | Service    |  | Service   |  | Service    |    |
|  +------------+  +------------+  +------------+  +------------+    |
|  +------------+  +------------+  +------------+                   |
|  | Lead       |  | Analytics  |  | Template  |                   |
|  | Service    |  | Service    |  | Service   |                   |
|  +------------+  +------------+  +------------+                   |
+------------------------------------------------------------------+
                              |
         +--------------------+--------------------+
         |                                         |
         v                                         v
+-------------------------+          +-------------------------+
|    EXTERNAL APIS        |          |      DATABASE           |
|  +------------------+   |          |  +------------------+    |
|  | WhatsApp Cloud   |   |          |  | PostgreSQL       |    |
|  | (Meta Graph API) |   |          |  | (Prisma ORM)     |    |
|  +------------------+   |          |  +------------------+    |
|  +------------------+   |          |  | Redis (Cache)    |    |
|  | Instagram Graph  |   |          |  | (Optional)       |    |
|  | API              |   |          |  +------------------+    |
|  +------------------+   |          |  | SMTP Server      |    |
|  +------------------+   |          |  | (Email)          |    |
|  | SMTP / SendGrid  |   |          |  +------------------+    |
|  +------------------+   |          |                         |
+-------------------------+          +-------------------------+
```

### 1.2 Module Dependencies

```
Marketing System Modules
├── WhatsApp Integration
│   ├── Template Messages (requires WhatsApp Official API)
│   ├── Bulk Messaging
│   ├── Scheduled Messages
│   └── Chat Automation
├── Instagram Integration
│   ├── Post Scheduling (requires Meta Graph API)
│   ├── Story Posting
│   ├── DM Automation
│   └── Analytics Tracking
├── Email Marketing
│   ├── Newsletter Templates
│   ├── Campaign Management
│   ├── Subscriber Management
│   └── Automated Sequences
├── Offer Management
│   ├── Offer Creation
│   ├── Audience Targeting
│   ├── Multi-channel Distribution
│   └── Performance Tracking
├── Lead Management
│   ├── Lead Capture Forms
│   ├── Lead Scoring
│   ├── Lead Nurturing
│   └── Conversion Tracking
└── Analytics Dashboard
    ├── Campaign Performance
    ├── ROI Tracking
    ├── Engagement Metrics
    └── Customer Journey
```

---

## 2. Database Models

### 2.1 New Prisma Enums (Add to schema.prisma)

```prisma
// Marketing Campaign Types
enum MarketingCampaignType {
  WHATSAPP_BLAST
  WHATSAPP_TEMPLATE
  INSTAGRAM_POST
  INSTAGRAM_STORY
  EMAIL_NEWSLETTER
  EMAIL_AUTOMATED
  OFFER_PROMOTION
  MULTI_CHANNEL
}

// Lead Status
enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  PROPOSAL
  NEGOTIATION
  CONVERTED
  LOST
}

// Lead Source
enum LeadSource {
  WEBSITE_FORM
  WHATSAPP
  INSTAGRAM
  FACEBOOK
  REFERRAL
  WALK_IN
  PHONE_CALL
  GOOGLE_ADS
  FACEBOOK_ADS
  OTHER
}

// Offer Status
enum OfferStatus {
  DRAFT
  ACTIVE
  SCHEDULED
  EXPIRED
  ARCHIVED
}

// Email Template Type
enum EmailTemplateType {
  NEWSLETTER
  WELCOME
  FOLLOW_UP
  PROMOTIONAL
  TRANSACTIONAL
}

// Analytics Event Type
enum AnalyticsEventType {
  CAMPAIGN_SENT
  MESSAGE_DELIVERED
  MESSAGE_OPENED
  MESSAGE_CLICKED
  LINK_CLICKED
  FORM_SUBMITTED
  OFFER_VIEWED
  OFFER_REDEEMED
  LEAD_CREATED
  LEAD_CONVERTED
}

// Schedule Status
enum ScheduleStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  FAILED
  CANCELLED
}
```

### 2.2 New Prisma Models

```prisma
// =============================================================================
// MARKETING - CAMPAIGNS
// =============================================================================

/// Multi-channel marketing campaigns with unified tracking
model MarketingCampaign {
  id              String               @id @default(cuid())
  name            String
  description     String?
  
  // Campaign Configuration
  type            MarketingCampaignType
  status          CampaignStatus       @default(DRAFT)
  
  // Scheduling
  scheduledAt     DateTime?
  startedAt      DateTime?
  completedAt     DateTime?
  
  // Targeting
  audienceType    String               @default("ALL")
  audienceFilter  Json?                // { tags: [], sources: [], score_min: 0 }
  
  // Content
  content         Json?                // { subject, body, image_url, cta_url, cta_text }
  
  // Multi-channel
  channels        Json?                // ["WHATSAPP", "EMAIL", "INSTAGRAM"]
  
  // Tracking
  totalRecipients Int                  @default(0)
  totalSent       Int                  @default(0)
  totalDelivered  Int                  @default(0)
  totalOpened     Int                  @default(0)
  totalClicked    Int                  @default(0)
  totalConverted  Int                  @default(0)
  
  // Costs
  estimatedCost   Decimal?             @db.Decimal(12, 2)
  actualCost      Decimal?             @db.Decimal(12, 2)
  
  // Relations
  createdById     String
  createdBy       User                 @relation(fields: [createdById], references: [id])
  
  messages        MarketingMessage[]
  offers          Offer[]
  analytics       AnalyticsEvent[]
  
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  
  @@index([type])
  @@index([status])
  @@index([scheduledAt])
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  RUNNING
  PAUSED
  COMPLETED
  CANCELLED
}

/// Individual messages sent within a campaign
model MarketingMessage {
  id              String                @id @default(cuid())
  campaignId      String
  campaign        MarketingCampaign     @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  // Recipient
  leadId          String?
  lead            Lead?                 @relation(fields: [leadId], references: [id], onDelete: SetNull)
  contactId       String?
  contact         BroadcastContact?     @relation(fields: [contactId], references: [id], onDelete: SetNull)
  
  // Channel
  channel         BroadcastChannel
  
  // Content
  subject         String?
  body            String
  mediaUrl        String?
  ctaUrl          String?
  ctaText         String?
  
  // Delivery Status
  status          MessageStatus         @default(PENDING)
  externalId      String?               // Message ID from provider
  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  
  // Errors
  errorMessage    String?
  
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  
  @@index([campaignId])
  @@index([leadId])
  @@index([status])
}

enum MessageStatus {
  PENDING
  QUEUED
  SENT
  DELIVERED
  OPENED
  CLICKED
  FAILED
  BOUNCED
  UNSUBSCRIBED
}

// =============================================================================
// MARKETING - WHATSAPP TEMPLATES
// =============================================================================

/// WhatsApp Business approved templates
model WhatsAppTemplate {
  id              String               @id @default(cuid())
  templateId      String?              // WhatsApp template ID from Meta
  name            String               @unique
  
  // Template Content
  language        String               @default("id")
  category        String               @default("MARKETING")
  
  // Components (header, body, footer, buttons)
  headerType      String?              // TEXT, IMAGE, VIDEO, DOCUMENT
  headerContent   String?
  headerMediaUrl  String?
  
  bodyContent     String               // Main message body with {{1}} placeholders
  footerContent   String?
  
  buttons         Json?                // [{ type, text, url?, phone_number? }]
  
  // Status
  status          TemplateStatus       @default(DRAFT)
  metaStatus      String?              // PENDING, APPROVED, REJECTED, FLAGGED
  
  // Usage
  usageCount      Int                  @default(0)
  lastUsedAt      DateTime?
  
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  
  @@index([status])
  @@index([name])
}

// =============================================================================
// MARKETING - LEADS
// =============================================================================

/// Marketing leads with scoring and nurturing
model Lead {
  id                String              @id @default(cuid())
  
  // Basic Info
  name              String
  email             String?
  phone             String?
  company           String?
  position          String?
  
  // Source Tracking
  source            LeadSource
  sourceDetails     String?             // UTM params, ad ID, etc.
  referrer          String?
  
  // Qualification
  status            LeadStatus          @default(NEW)
  score             Int                 @default(0)   // 0-100
  
  // Lead Score Breakdown (JSON for flexibility)
  scoreBreakdown    Json?               // { engagement: 20, intent: 30, demographic: 25, behavior: 25 }
  
  // Budget & Timeline
  estimatedBudget   Decimal?            @db.Decimal(15, 2)
  projectTimeline   String?             // IMMEDIATE, 1_3_MONTHS, 3_6_MONTHS, 6_12_MONTHS, EXPLORING
  
  // Project Type Interest
  projectTypes      String[]            // ["Rumah", "Apartemen", "Kantor", "Ruko"]
  
  // Location
  location          String?             // Project location
  
  // Communication Preferences
  preferredChannel  BroadcastChannel?
  whatsappConsent   Boolean             @default(false)
  emailConsent      Boolean             @default(false)
  smsConsent        Boolean             @default(false)
  
  // Nurturing
  nurturingStage    Int                 @default(0)   // 0-5
  lastContactedAt   DateTime?
  nextFollowUpAt    DateTime?
  notes             String?             @db.Text
  
  // Conversion
  convertedAt       DateTime?
  convertedToRabId  String?             // Linked to RAB if converted to project
  conversionValue   Decimal?             @db.Decimal(15, 2)
  
  // Relations
  assignedToId      String?
  assignedTo        User?                @relation(fields: [assignedToId], references: [id])
  
  tags              String[]
  messages          MarketingMessage[]
  activities        LeadActivity[]
  analytics         AnalyticsEvent[]
  offerInteractions OfferInteraction[]
  
  createdAt         DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  
  @@index([status])
  @@index([score])
  @@index([source])
  @@index([assignedToId])
}

/// Lead activity log for timeline tracking
model LeadActivity {
  id          String    @id @default(cuid())
  leadId      String
  lead        Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  type        String    // CALL, EMAIL, WHATSAPP, MEETING, NOTE, STAGE_CHANGE, SCORE_UPDATE
  channel     BroadcastChannel?
  
  subject     String?
  description String?   @db.Text
  
  // Score impact
  scoreDelta  Int       @default(0)
  
  // Related entities
  campaignId  String?
  messageId   String?
  offerId     String?
  
  // User who performed the activity
  performedById String?
  
  createdAt   DateTime  @default(now())
  
  @@index([leadId])
  @@index([type])
  @@index([createdAt])
}

// =============================================================================
// MARKETING - OFFERS & PROMOTIONS
// =============================================================================

/// Promotional offers and campaigns
model Offer {
  id              String           @id @default(cuid())
  
  // Basic Info
  title           String
  slug            String           @unique
  description     String?          @db.Text
  terms           String?          @db.Text
  
  // Offer Details
  type            OfferType       @default(DISCOUNT)
  discountType    DiscountType    @default(PERCENTAGE)
  discountValue   Decimal         @db.Decimal(10, 2)
  
  // Validity
  validFrom       DateTime
  validUntil      DateTime
  usageLimit      Int?            // Max total uses
  usageLimitPerUser Int?          // Max per customer
  redemptions     Int             @default(0)
  
  // Media
  imageUrl        String?
  thumbnailUrl    String?
  
  // Targeting
  targetAudience  Json?            // { tags: [], lead_status: [], score_min: 0 }
  channels        Json?            // ["WHATSAPP", "EMAIL", "WEBSITE"]
  
  // Tracking
  views           Int              @default(0)
  conversions     Int              @default(0)
  
  // Relation to Campaign
  campaignId      String?
  campaign        MarketingCampaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  
  // Status
  status          OfferStatus     @default(DRAFT)
  
  // Redemption Code
  redemptionCode  String?         @unique
  redemptionsList OfferInteraction[]
  
  createdAt       DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  
  @@index([status])
  @@index([validUntil])
}

enum OfferType {
  DISCOUNT
  FREE_CONSULTATION
  FREE_SURVEY
  FREE_QUOTE
  BUNDLE
  LOYALTY
  REFERRAL
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_ITEM
}

// =============================================================================
// MARKETING - OFFER INTERACTIONS
// =============================================================================

/// Track offer views, shares, and redemptions
model OfferInteraction {
  id          String        @id @default(cuid())
  offerId     String
  offer       Offer        @relation(fields: [offerId], references: [id], onDelete: Cascade)
  
  // Who interacted
  leadId      String?
  lead        Lead?        @relation(fields: [leadId], references: [id], onDelete: SetNull)
  email       String?      // For non-lead users
  
  // Interaction Type
  type        InteractionType
  channel     BroadcastChannel?
  
  // Tracking
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  
  // Redemption
  redemptionCode String?
  redeemedAt  DateTime?
  
  createdAt   DateTime      @default(now())
  
  @@index([offerId])
  @@index([leadId])
}

enum InteractionType {
  VIEWED
  CLICKED
  SHARED
  REDEEMED
}

// =============================================================================
// MARKETING - EMAIL TEMPLATES
// =============================================================================

/// Reusable email templates
model EmailTemplate {
  id              String           @id @default(cuid())
  name            String           @unique
  description     String?
  
  type            EmailTemplateType @default(NEWSLETTER)
  
  // Subject Line
  subjectTemplate String
  
  // Preheader (preview text)
  preheaderText   String?
  
  // Email Structure
  headerImageUrl  String?
  headerText      String?
  
  bodyContent     String           @db.Text  // HTML with {{placeholders}}
  
  footerText      String?
  footerImageUrl  String?
  
  // Styling
  primaryColor    String           @default("#1e40af")
  accentColor     String           @default("#3b82f6")
  backgroundColor String           @default("#ffffff")
  textColor       String           @default("#1f2937")
  
  // Unsubscribe
  includeUnsubscribe Boolean       @default(true)
  
  // Variables supported
  variables       String[]         // ["{{name}}", "{{company}}", "{{offer_link}}"]
  
  // Usage
  usageCount      Int              @default(0)
  lastUsedAt      DateTime?
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@index([type])
}

// =============================================================================
// MARKETING - EMAIL AUTOMATED SEQUENCES
// =============================================================================

/// Automated email sequences (drip campaigns)
model EmailSequence {
  id            String           @id @default(cuid())
  name          String           @unique
  description   String?
  
  // Trigger
  triggerType  SequenceTrigger  @default(SUBSCRIPTION)
  triggerConfig Json?            // { tag: "new_lead", days_after: 0 }
  
  // Steps
  steps        EmailSequenceStep[]
  
  status       SequenceStatus   @default(DRAFT)
  
  // Metrics
  totalEnrolled Int             @default(0)
  totalCompleted Int            @default(0)
  totalUnsubscribed Int         @default(0)
  
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  
  @@index([status])
}

enum SequenceTrigger {
  SUBSCRIPTION
  TAG_ADDED
  FORM_SUBMISSION
  CAMPAIGN_OPENED
  CAMPAIGN_CLICKED
  OFFER_VIEWED
  MANUAL
}

enum SequenceStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
}

model EmailSequenceStep {
  id          String         @id @default(cuid())
  sequenceId  String
  sequence    EmailSequence @relation(fields: [sequenceId], references: [id], onDelete: Cascade)
  
  order       Int
  delayDays   Int           @default(0)   // Days after trigger
  delayHours  Int           @default(0)   // Additional hours
  
  // Email
  templateId  String?
  template    EmailTemplate? @relation(fields: [templateId], references: [id])
  
  subjectOverride String?
  bodyOverride    String?   @db.Text
  
  // Condition
  conditionType   String?   // OPENED, CLICKED, REPLIED, NONE
  
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  
  @@index([sequenceId])
}

// =============================================================================
// MARKETING - SCHEDULED CONTENT
// =============================================================================

/// Scheduled social media posts
model ScheduledContent {
  id          String         @id @default(cuid())
  
  // Platform
  platform    BroadcastChannel // INSTAGRAM or FACEBOOK
  
  // Content Type
  contentType ContentPostType @default(POST)
  
  // Content
  caption     String         @db.Text
  mediaUrls   String[]       // Array of media URLs
  location    String?
  
  // Media Details
  altText     String?
  
  // Story-specific
  linkUrl     String?        // Website link for stories
  mentionTags String[]       // @mentions
  
  // Schedule
  scheduledAt DateTime
  publishedAt DateTime?
  
  // Status
  status      ScheduleStatus @default(DRAFT)
  
  // Source (repost from campaign)
  campaignId  String?
  
  // Instagram-specific
  instagramPostId String?
  
  // Metrics (populated after publish)
  likesCount  Int            @default(0)
  commentsCount Int          @default(0)
  sharesCount Int           @default(0)
  reachCount  Int           @default(0)
  impressionsCount Int      @default(0)
  
  createdById String
  createdBy   User          @relation(fields: [createdById], references: [id])
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  @@index([platform])
  @@index([status])
  @@index([scheduledAt])
}

enum ContentPostType {
  POST
  STORY
  REEL
  CAROUSEL
}

// =============================================================================
// MARKETING - ANALYTICS
// =============================================================================

/// Analytics events for tracking
model AnalyticsEvent {
  id            String             @id @default(cuid())
  
  // Event Classification
  eventType     AnalyticsEventType
  
  // Who
  leadId        String?
  lead          Lead?               @relation(fields: [leadId], references: [id], onDelete: SetNull)
  contactId     String?
  contact       BroadcastContact?  @relation(fields: [contactId], references: [id], onDelete: SetNull)
  
  // What
  campaignId    String?
  campaign      MarketingCampaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  messageId     String?
  offerId       String?
  
  // Channel
  channel       BroadcastChannel?
  
  // Details
  metadata      Json?              // { url, email_subject, click_url, etc. }
  
  // Source tracking
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  utmContent    String?
  utmTerm       String?
  
  // Device/Location
  userAgent     String?
  ipAddress     String?
  country       String?
  city          String?
  
  createdAt     DateTime          @default(now())
  
  @@index([eventType])
  @@index([leadId])
  @@index([campaignId])
  @@index([createdAt])
  @@index([utmSource])
  @@index([utmCampaign])
}

// =============================================================================
// MARKETING - SUBSCRIBERS (for email marketing)
// =============================================================================

/// Email subscribers with preferences
model EmailSubscriber {
  id            String           @id @default(cuid())
  email         String           @unique
  
  // Profile
  name          String?
  company       String?
  
  // Preferences
  preferences   Json?            // { frequency: \"weekly\", topics: [\"projects\", \"offers\"] }
  
  // Status
  status        SubscriberStatus @default(ACTIVE)
  confirmedAt   DateTime?
  unsubscribedAt DateTime?
  
  // Source
  source        String?
  sourceUrl     String?
  
  // Consent
  consentGiven  Boolean          @default(true)
  consentAt     DateTime?
  
  // Engagement
  lastEmailAt   DateTime?
  emailOpens    Int              @default(0)
  emailClicks   Int              @default(0)
  
  // Relations
  contactId     String?
  contact       BroadcastContact? @relation(fields: [contactId], references: [id], onDelete: SetNull)
  
  // Sequences
  enrolledSequences Json?       // [{ sequenceId, enrolledAt, completedAt }]
  
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  
  @@index([status])
  @@index([email])
}

enum SubscriberStatus {
  ACTIVE
  UNSUBSCRIBED
  BOUNCED
  SPAM
}

// =============================================================================
// MARKETING - WEBHOOK LOGS
// =============================================================================

/// Log incoming webhooks from external services
model WebhookLog {
  id          String   @id @default(cuid())
  provider    String   // META, SENDGRID, TWILIO, etc.
  
  eventType   String
  payload     Json
  
  // Processing
  processed   Boolean  @default(false)
  processedAt DateTime?
  error       String?
  
  createdAt   DateTime @default(now())
  
  @@index([provider])
  @@index([eventType])
  @@index([processed])
}

---

## 3. WhatsApp Business API Integration

### 3.1 Overview

The WhatsApp integration extends the existing Baileys gateway support with the official WhatsApp Business API for template messages and enhanced features.

### 3.2 Features

#### 3.2.1 Template Messages (WhatsApp Official API)

Template messages allow businesses to send notifications outside the 24-hour customer service window.

**Supported Template Categories:**
- MARKETING: Promotional offers, announcements
- UTILITY: Transaction updates, alerts
- AUTHENTICATION: OTP, verification codes
- ACCOUNT_UPDATE: Account changes

#### 3.2.2 Bulk Message Sending

Features:
- Multi-account sending with round-robin
- Rate limiting per account
- Deduplication
- Personalization with merge tags
- Scheduled delivery
- Delivery confirmation tracking

#### 3.2.3 Contact Management

- Contact import (CSV, manual)
- Contact segmentation by tags, behavior
- Opt-in/opt-out management
- Consent tracking per contact
- Contact profile with interaction history

#### 3.2.4 Message Scheduling

- Schedule campaigns in advance
- Timezone-aware delivery
- Best time optimization
- Recurring campaigns
- A/B testing for send times

#### 3.2.5 Delivery Tracking

Metrics tracked:
- Sent
- Delivered
- Read (if available)
- Replied
- Failed
- Unsubscribed

### 3.3 Implementation

`	ypescript
// backend/src/services/whatsapp.service.ts

interface WhatsAppTemplateMessage {
  phoneNumber: string;
  templateName: string;
  languageCode?: string;
  headerData?: string;
  bodyData: string[];
  buttonsData?: ButtonData[];
}

interface WhatsAppBroadcastOptions {
  campaignId: string;
  contacts: BroadcastContact[];
  templateId: string;
  scheduledAt?: Date;
  variables?: Record<string, string>;
}

class WhatsAppService {
  async sendTemplateMessage(options: WhatsAppTemplateMessage): Promise<string>;
  async sendBulkMessages(options: WhatsAppBroadcastOptions): Promise<BulkSendResult>;
  async scheduleMessages(options: WhatsAppBroadcastOptions): Promise<string>;
  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
  async syncContacts(): Promise<ContactSyncResult>;
}
`

---

## 4. Instagram Integration

### 4.1 Overview

Instagram integration uses the Meta Graph API for business account management, post scheduling, story posting, and analytics.

### 4.2 Features

#### 4.2.1 Business Account Connection

Requirements:
- Instagram Business or Creator account
- Facebook Page linked to Instagram
- Meta App with required permissions

Permissions needed:
- instagram_basic
- instagram_content_publish
- instagram_manage_insights
- pages_read_engagement

#### 4.2.2 Post Scheduling

Features:
- Schedule posts up to 6 months in advance
- Support for: Single image/video posts, Carousel posts, Reels
- Caption with hashtags optimization
- Location tagging
- User tagging

#### 4.2.3 Story Posting

Features:
- Image/video stories
- Link stickers
- Mention tags
- Location tags
- Countdown stickers

#### 4.2.4 DM Automation

Features:
- Automated replies to DMs
- Welcome messages
- Keyword-based responses
- Lead capture in DMs

#### 4.2.5 Analytics Tracking

Metrics collected:
- Reach, Impressions
- Engagement rate
- Follower growth
- Story views
- Profile visits
- Website clicks

---

## 5. Email Marketing

### 5.1 Overview

Email marketing module provides campaign management, subscriber management, template creation, and automated sequences.

### 5.2 Features

#### 5.2.1 Newsletter Templates

Template types:
- Newsletter (regular updates)
- Welcome series
- Follow-up emails
- Promotional offers
- Transactional emails

#### 5.2.2 Campaign Management

Campaign workflow:
1. Create campaign
2. Design/select template
3. Define audience
4. Set schedule
5. Preview and test
6. Launch
7. Monitor results

A/B testing capabilities:
- Subject line variants
- Send time optimization
- Content variations

#### 5.2.3 Subscriber Management

Features:
- Double opt-in
- Preference center
- Segmentation
- Tags and custom fields
- Import/export
- Suppression lists

#### 5.2.4 Automated Sequences

Sequence triggers:
- New subscriber
- Tag added/removed
- Form submission
- Campaign opened/clicked
- Offer viewed
- Manual enrollment

---

## 6. Offer/Promotion Management

### 6.1 Overview

Promotional offers system for creating, distributing, and tracking marketing offers across multiple channels.

### 6.2 Features

#### 6.2.1 Offer Creation

Offer types:
- Percentage discount
- Fixed amount discount
- Free consultation
- Free survey
- Free quote
- Bundle offers
- Loyalty rewards
- Referral programs

Features:
- Rich text description
- Image upload
- Terms and conditions
- Validity period
- Usage limits
- Unique redemption codes

#### 6.2.2 Target Audience Selection

Targeting options:
- Lead status
- Lead score threshold
- Tags
- Source
- Project type interest
- Location
- Budget range

#### 6.2.3 Multi-channel Distribution

Channels:
- WhatsApp
- Email
- Instagram
- Website (landing page)
- SMS (future)

#### 6.2.4 Performance Tracking

Metrics:
- Views, Clicks, Conversions
- Redemption rate
- Revenue generated
- Cost per acquisition
- ROI

---

## 7. Lead Management

### 7.1 Overview

Comprehensive lead management with scoring, nurturing, and conversion tracking for construction projects.

### 7.2 Features

#### 7.2.1 Lead Capture Forms

Form types:
- Website contact form
- Landing page forms
- Popup forms
- Embedded forms
- WhatsApp click-to-chat

Fields customizable:
- Name, Email, Phone
- Company, Position
- Project type, Budget, Timeline, Location

#### 7.2.2 Lead Scoring

Score components:
- **Engagement (30 points)**: Email opens, clicks, website visits
- **Intent (40 points)**: Form submission, offer redemption, quote request
- **Demographic (15 points)**: Company, budget, timeline
- **Behavior (15 points)**: Referral, repeated visits

#### 7.2.3 Lead Nurturing

Nurturing stages:
- **Stage 0**: New - Welcome sequence
- **Stage 1**: Engaged - Educational content
- **Stage 2**: Interested - Project information
- **Stage 3**: Qualified - Consultation offer
- **Stage 4**: Proposal - Quote preparation
- **Stage 5**: Ready - Close follow-up

#### 7.2.4 Conversion Tracking

Conversion events:
- Quote requested
- Proposal accepted
- Contract signed
- Project started

Attribution tracking:
- First touch
- Last touch
- Multi-touch

---

## 8. Analytics Dashboard

### 8.1 Overview

Comprehensive analytics dashboard for tracking campaign performance, ROI, engagement, and customer journey.

### 8.2 Dashboard Sections

#### 8.2.1 Campaign Performance

Metrics:
- Total campaigns
- Active campaigns
- Campaign success rate
- Average open rate
- Average click rate
- Conversion rate

Charts:
- Campaign timeline
- Channel comparison
- Audience growth
- Top performing campaigns

#### 8.2.2 ROI Tracking

Metrics:
- Marketing spend
- Revenue generated
- ROI percentage
- Cost per lead
- Cost per acquisition
- Customer lifetime value

#### 8.2.3 Engagement Metrics

By channel:
- WhatsApp: sent, delivered, read, replied
- Email: sent, delivered, opened, clicked, bounced
- Instagram: reach, impressions, engagement, followers

#### 8.2.4 Customer Journey

Funnel visualization:
- Visitors
- Leads captured
- Qualified leads
- Proposals sent
- Conversions

---

## 9. API Endpoints

### 9.1 Marketing Campaign Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/marketing/campaigns | Create campaign |
| GET | /api/marketing/campaigns | List campaigns |
| GET | /api/marketing/campaigns/:id | Get campaign details |
| PATCH | /api/marketing/campaigns/:id | Update campaign |
| DELETE | /api/marketing/campaigns/:id | Delete campaign |
| POST | /api/marketing/campaigns/:id/send | Send campaign |
| POST | /api/marketing/campaigns/:id/pause | Pause campaign |

### 9.2 WhatsApp Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/marketing/whatsapp/templates | List templates |
| POST | /api/marketing/whatsapp/templates | Create template |
| POST | /api/marketing/whatsapp/templates/:id/submit | Submit to Meta |
| POST | /api/marketing/whatsapp/send | Send single message |
| POST | /api/marketing/whatsapp/broadcast | Send broadcast |

### 9.3 Instagram Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/marketing/instagram/posts | Create post |
| GET | /api/marketing/instagram/scheduled | List scheduled |
| POST | /api/marketing/instagram/scheduled | Schedule post |
| POST | /api/marketing/instagram/stories | Create story |
| GET | /api/marketing/instagram/insights | Account insights |

### 9.4 Email Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/marketing/email/templates | List templates |
| POST | /api/marketing/email/templates | Create template |
| GET | /api/marketing/email/sequences | List sequences |
| POST | /api/marketing/email/sequences | Create sequence |
| GET | /api/marketing/email/subscribers | List subscribers |
| POST | /api/marketing/email/subscribers/import | Import subscribers |

### 9.5 Lead Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/marketing/leads | List leads |
| POST | /api/marketing/leads | Create lead |
| GET | /api/marketing/leads/:id | Get lead details |
| PATCH | /api/marketing/leads/:id | Update lead |
| POST | /api/marketing/leads/:id/assign | Assign lead |
| POST | /api/marketing/leads/:id/convert | Convert to client |

### 9.6 Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/marketing/analytics/overview | Dashboard overview |
| GET | /api/marketing/analytics/campaigns | Campaign analytics |
| GET | /api/marketing/analytics/channels | Channel comparison |
| GET | /api/marketing/analytics/roi | ROI tracking |

---

## 10. Frontend Pages

### 10.1 Page Structure

`
frontend-next/src/app/admin/(dashboard)/
marketing/
├── page.tsx                    # Marketing dashboard overview
├── campaigns/
│   ├── page.tsx               # Campaign list
│   ├── new/page.tsx           # Create campaign
│   └── [id]/page.tsx          # Campaign details
├── whatsapp/
│   ├── page.tsx               # WhatsApp center
│   ├── templates/page.tsx     # Template management
│   └── messages/page.tsx      # Message history
├── instagram/
│   ├── page.tsx               # Instagram center
│   ├── posts/page.tsx         # Post management
│   ├── scheduled/page.tsx     # Scheduled content
│   └── insights/page.tsx      # Analytics
├── email/
│   ├── page.tsx               # Email marketing center
│   ├── templates/page.tsx     # Template editor
│   ├── sequences/page.tsx     # Automated sequences
│   └── subscribers/page.tsx   # Subscriber management
├── offers/
│   ├── page.tsx               # Offers list
│   ├── new/page.tsx           # Create offer
│   └── [id]/page.tsx          # Offer details
├── leads/
│   ├── page.tsx               # Leads list
│   ├── new/page.tsx           # Add lead
│   ├── [id]/page.tsx          # Lead details
│   └── segments/page.tsx       # Lead segments
└── analytics/
    ├── page.tsx               # Analytics dashboard
    ├── campaigns/page.tsx     # Campaign reports
    └── roi/page.tsx           # ROI tracking
`

### 10.2 UI Components

Key components to create:
- MarketingDashboard
- CampaignBuilder
- TemplateEditor
- LeadKanban
- OfferCard
- AnalyticsCharts
- ScheduleCalendar

---

## 11. Integration Points

### 11.1 External Services

| Service | Purpose | API |
|---------|---------|-----|
| Meta WhatsApp Business API | WhatsApp Official messages | graph.facebook.com |
| Meta Instagram Graph API | Instagram management | graph.facebook.com |
| SendGrid / SMTP | Email delivery | sendgrid.com / SMTP |
| Twilio | SMS (future) | api.twilio.com |
| Google Analytics | Web analytics | analytics.google.com |

### 11.2 Internal Modules

| Module | Integration |
|--------|-------------|
| Client Portal | Share offers, project updates |
| RAB/Estimasi | Convert leads to quotes |
| Project Management | Track project milestones |
| Notification System | Alert users |
| Audit Log | Track all marketing activities |

### 11.3 Webhook Handlers

`	ypescript
POST /api/webhooks/meta/whatsapp     // WhatsApp message status
POST /api/webhooks/meta/instagram    // Instagram mentions, DMs
POST /api/webhooks/email/delivery    // Email delivery events
POST /api/webhooks/email/engagement  // Opens, clicks
`

---

## 12. Implementation Roadmap

### Phase 1: Foundation (2 weeks)
- Add new Prisma models and enums
- Create marketing service layer
- Implement base API routes
- Set up webhook handlers

### Phase 2: WhatsApp Enhancement (2 weeks)
- WhatsApp Official API integration
- Template management
- Enhanced broadcast capabilities

### Phase 3: Email Marketing (2 weeks)
- Email template builder
- Campaign management
- Subscriber system
- Automated sequences

### Phase 4: Lead Management (2 weeks)
- Lead capture forms
- Scoring system
- Nurturing workflows
- Conversion tracking

### Phase 5: Instagram Integration (2 weeks)
- Meta Graph API connection
- Post scheduling
- Story posting
- Analytics sync

### Phase 6: Offers and Promotions (1 week)
- Offer creation and management
- Multi-channel distribution
- Redemption tracking

### Phase 7: Analytics Dashboard (1 week)
- Campaign reporting
- ROI calculation
- Custom dashboards

### Phase 8: Testing and Polish (1 week)
- Integration testing
- UI/UX refinements
- Documentation

**Total Estimated Time: 13 weeks**

---

## Appendix A: Database Schema Summary

### New Tables/Models
1. MarketingCampaign - Campaign management
2. MarketingMessage - Individual messages
3. WhatsAppTemplate - WhatsApp templates
4. Lead - Marketing leads
5. LeadActivity - Activity tracking
6. Offer - Promotional offers
7. OfferInteraction - Offer engagement
8. EmailTemplate - Email templates
9. EmailSequence - Automated sequences
10. EmailSequenceStep - Sequence steps
11. ScheduledContent - Social media scheduling
12. AnalyticsEvent - Analytics tracking
13. EmailSubscriber - Email subscribers
14. WebhookLog - Webhook logging

### New Enums
1. MarketingCampaignType
2. CampaignStatus
3. MessageStatus
4. LeadStatus
5. LeadSource
6. OfferStatus
7. OfferType
8. DiscountType
9. InteractionType
10. EmailTemplateType
11. SequenceTrigger
12. SequenceStatus
13. ContentPostType
14. SubscriberStatus
15. TemplateStatus

---

## Appendix B: Configuration

### Environment Variables

`ash
# Meta / WhatsApp / Instagram
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=

# SMTP (alternative)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# Analytics
GOOGLE_ANALYTICS_ID=
`

---

## Appendix C: Security Considerations

1. **Data Protection**
   - Encrypt sensitive data at rest
   - Use HTTPS for all API calls
   - Implement rate limiting

2. **Consent Management**
   - GDPR-compliant consent collection
   - Easy opt-out mechanisms
   - Consent audit trail

3. **Access Control**
   - Role-based permissions
   - Marketing admin vs viewer roles
   - API key rotation

4. **Compliance**
   - WhatsApp Business Policy compliance
   - Email marketing regulations
   - Data retention policies

---

*Document Version: 1.0*  
*Last Updated: September 2026*  
*Prepared for: Construction Company CRM Development Team*
