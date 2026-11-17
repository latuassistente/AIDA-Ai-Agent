CREATE TABLE "EmailCampaign" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT,
  "htmlContent" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "recipientSource" TEXT NOT NULL DEFAULT 'UPLOAD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailCampaignRecipient" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "normalizedEmail" TEXT NOT NULL,
  "companyName" TEXT,
  "contactName" TEXT,
  "legalReview" TEXT NOT NULL DEFAULT 'pending',
  "legalBasis" TEXT,
  "authorizationEvidenceId" TEXT,
  "suppressed" BOOLEAN NOT NULL DEFAULT false,
  "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
  "verificationStatus" TEXT NOT NULL DEFAULT 'unknown',
  "verificationProvider" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailCampaignRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailCampaignEvent" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "recipientId" TEXT,
  "eventType" TEXT NOT NULL,
  "providerEventId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "EmailCampaignEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailCampaign_tenantId_createdAt_idx" ON "EmailCampaign"("tenantId", "createdAt");
CREATE INDEX "EmailCampaign_tenantId_status_idx" ON "EmailCampaign"("tenantId", "status");
CREATE UNIQUE INDEX "EmailCampaignRecipient_campaignId_normalizedEmail_key" ON "EmailCampaignRecipient"("campaignId", "normalizedEmail");
CREATE INDEX "EmailCampaignRecipient_campaignId_verificationStatus_idx" ON "EmailCampaignRecipient"("campaignId", "verificationStatus");
CREATE INDEX "EmailCampaignRecipient_campaignId_legalReview_idx" ON "EmailCampaignRecipient"("campaignId", "legalReview");
CREATE UNIQUE INDEX "EmailCampaignEvent_campaignId_providerEventId_key" ON "EmailCampaignEvent"("campaignId", "providerEventId");
CREATE INDEX "EmailCampaignEvent_campaignId_eventType_idx" ON "EmailCampaignEvent"("campaignId", "eventType");
CREATE INDEX "EmailCampaignEvent_recipientId_occurredAt_idx" ON "EmailCampaignEvent"("recipientId", "occurredAt");

ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailCampaignRecipient" ADD CONSTRAINT "EmailCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailCampaignEvent" ADD CONSTRAINT "EmailCampaignEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailCampaignEvent" ADD CONSTRAINT "EmailCampaignEvent_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "EmailCampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
