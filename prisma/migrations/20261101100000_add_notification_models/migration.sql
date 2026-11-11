-- CreateEnum
CREATE TYPE "SubjectChannel" AS ENUM ('ALL', 'JAVASCRIPT', 'OPERATING_SYSTEMS', 'JAVA', 'COMPUTER_NETWORKS', 'BACKEND', 'FRONTEND');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED');

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subject" "SubjectChannel" NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedEpisode" (
    "id" TEXT NOT NULL,
    "subject" "SubjectChannel" NOT NULL,
    "episodeId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "releaseCommitSha" TEXT NOT NULL,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" TIMESTAMP(3),

    CONSTRAINT "PublishedEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_userId_key" ON "Subscriber"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_verificationToken_key" ON "Subscriber"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_unsubscribeToken_key" ON "Subscriber"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "Subscriber_status_isVerified_idx" ON "Subscriber"("status", "isVerified");

-- CreateIndex
CREATE INDEX "Subscription_subject_idx" ON "Subscription"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscriberId_subject_key" ON "Subscription"("subscriberId", "subject");

-- CreateIndex
CREATE INDEX "PublishedEpisode_subject_episodeId_idx" ON "PublishedEpisode"("subject", "episodeId");

-- CreateIndex
CREATE INDEX "PublishedEpisode_releaseCommitSha_idx" ON "PublishedEpisode"("releaseCommitSha");

-- CreateIndex
CREATE INDEX "PublishedEpisode_publishedAt_idx" ON "PublishedEpisode"("publishedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PublishedEpisode_subject_episodeId_key" ON "PublishedEpisode"("subject", "episodeId");

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
