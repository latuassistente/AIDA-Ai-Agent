CREATE TABLE "B2BLead" ("id" TEXT NOT NULL,"tenantId" TEXT NOT NULL,"source" TEXT NOT NULL,"sourceRecordId" TEXT,"sourceUrl" TEXT,"sourceKey" TEXT NOT NULL,"category" TEXT,"companyName" TEXT,"legalName" TEXT,"firstName" TEXT,"lastName" TEXT,"streetAddress" TEXT,"street" TEXT,"streetNumber" TEXT,"postalCode" TEXT,"city" TEXT,"province" TEXT,"region" TEXT,"country" TEXT NOT NULL DEFAULT 'IT',"mobilePhone" TEXT,"landlinePhone" TEXT,"email" TEXT,"website" TEXT,"socialProfiles" JSONB,"vatNumber" TEXT,"latitude" DOUBLE PRECISION,"longitude" DOUBLE PRECISION,"sourceFields" JSONB,"fieldProvenance" JSONB,"qualityStatus" TEXT NOT NULL DEFAULT 'RAW',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "B2BLead_pkey" PRIMARY KEY ("id"),CONSTRAINT "B2BLead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX "B2BLead_tenantId_sourceKey_key" ON "B2BLead"("tenantId","sourceKey");
CREATE INDEX "B2BLead_tenantId_category_idx" ON "B2BLead"("tenantId","category");
CREATE INDEX "B2BLead_tenantId_postalCode_idx" ON "B2BLead"("tenantId","postalCode");
CREATE INDEX "B2BLead_tenantId_city_idx" ON "B2BLead"("tenantId","city");
CREATE INDEX "B2BLead_tenantId_mobilePhone_idx" ON "B2BLead"("tenantId","mobilePhone");
CREATE INDEX "B2BLead_tenantId_landlinePhone_idx" ON "B2BLead"("tenantId","landlinePhone");
CREATE INDEX "B2BLead_tenantId_email_idx" ON "B2BLead"("tenantId","email");
CREATE INDEX "B2BLead_tenantId_companyName_idx" ON "B2BLead"("tenantId","companyName");