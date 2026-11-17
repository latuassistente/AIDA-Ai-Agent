ALTER TABLE "EmailCampaignRecipient"
ADD COLUMN "sourceLeadId" TEXT;

CREATE INDEX "EmailCampaignRecipient_campaignId_sourceLeadId_idx"
ON "EmailCampaignRecipient"("campaignId", "sourceLeadId");
