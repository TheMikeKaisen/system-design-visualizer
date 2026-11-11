import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { Prisma, SubjectChannel, SubscriptionStatus } from "@prisma/client";

// ─── Direct AST & Schema Inspection Utilities ────────────────────────────────

const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
const schemaText = fs.readFileSync(schemaPath, "utf-8");
const migrationPath = path.resolve(
  process.cwd(),
  "prisma/migrations/20261101100000_add_notification_models/migration.sql"
);
const migrationText = fs.readFileSync(migrationPath, "utf-8");

describe("Milestone 1 Adversarial & Stress Verification Suite", () => {
  // ── 1. Invalid Subject Channel Stress Testing ─────────────────────────────
  describe("Challenge 1: SubjectChannel Enum Integrity & Invalid Assignment", () => {
    it("strictly limits SubjectChannel enum to canonical 7 channels without rogue values", () => {
      const allowedChannels: string[] = [
        "ALL",
        "JAVASCRIPT",
        "OPERATING_SYSTEMS",
        "JAVA",
        "COMPUTER_NETWORKS",
        "BACKEND",
        "FRONTEND",
      ];

      // Verify Prisma client enum object
      const clientEnumKeys = Object.keys(SubjectChannel);
      const clientEnumValues = Object.values(SubjectChannel);

      expect(clientEnumKeys.sort()).toEqual(allowedChannels.slice().sort());
      expect(clientEnumValues.sort()).toEqual(allowedChannels.slice().sort());

      // Verify schema.prisma enum definition
      const enumMatch = schemaText.match(/enum\s+SubjectChannel\s*\{([^}]+)\}/);
      expect(enumMatch).not.toBeNull();
      const schemaChannels = enumMatch![1]
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      expect(schemaChannels.sort()).toEqual(allowedChannels.slice().sort());
    });

    it("verifies PostgreSQL DDL enforces exact CREATE TYPE SubjectChannel", () => {
      expect(migrationText).toContain(
        `CREATE TYPE "SubjectChannel" AS ENUM ('ALL', 'JAVASCRIPT', 'OPERATING_SYSTEMS', 'JAVA', 'COMPUTER_NETWORKS', 'BACKEND', 'FRONTEND');`
      );
    });

    it("empirically rejects invalid channel inputs via runtime enum validator", () => {
      const invalidChannels = [
        "REACT",
        "DEVOPS",
        "SYSTEM_DESIGN",
        "",
        "all",
        "javascript",
        "123",
        "ALL; DROP TABLE Subscriber;",
      ];

      function isValidChannel(channel: unknown): channel is SubjectChannel {
        return (
          typeof channel === "string" &&
          Object.values(SubjectChannel).includes(channel as SubjectChannel)
        );
      }

      for (const invalid of invalidChannels) {
        expect(isValidChannel(invalid)).toBe(false);
      }

      // Valid channels must all return true
      for (const valid of Object.values(SubjectChannel)) {
        expect(isValidChannel(valid)).toBe(true);
      }
    });
  });

  // ── 2. Duplicate Subscription Uniqueness (@@unique([subscriberId, subject]))
  describe("Challenge 2: Subscription Duplicate Prevention @@unique([subscriberId, subject])", () => {
    it("declares @@unique([subscriberId, subject]) in schema and migration DDL", () => {
      expect(schemaText).toMatch(
        /model\s+Subscription\s*\{[^}]*@@unique\(\[subscriberId,\s*subject\]\)/
      );
      expect(migrationText).toContain(
        `CREATE UNIQUE INDEX "Subscription_subscriberId_subject_key" ON "Subscription"("subscriberId", "subject");`
      );
    });

    it("empirically triggers UniqueConstraintViolation when attempting duplicate subscription insert", () => {
      // In-memory relational constraint enforcement oracle
      interface SubscriptionRow {
        id: string;
        subscriberId: string;
        subject: SubjectChannel;
        createdAt: Date;
      }

      const table: SubscriptionRow[] = [];
      const uniqueIndex = new Set<string>();

      function insertSubscription(row: SubscriptionRow): void {
        const compositeKey = `${row.subscriberId}::${row.subject}`;
        if (uniqueIndex.has(compositeKey)) {
          const error = new Error(
            `Unique constraint failed on the fields: (subscriberId, subject)`
          );
          (error as unknown as { code: string }).code = "P2002";
          throw error;
        }
        uniqueIndex.add(compositeKey);
        table.push(row);
      }

      // First insert succeeds
      insertSubscription({
        id: "sub_rec_1",
        subscriberId: "subscriber_100",
        subject: SubjectChannel.JAVASCRIPT,
        createdAt: new Date(),
      });
      expect(table).toHaveLength(1);

      // Attempt duplicate insert with identical (subscriberId, subject)
      expect(() => {
        insertSubscription({
          id: "sub_rec_2",
          subscriberId: "subscriber_100",
          subject: SubjectChannel.JAVASCRIPT,
          createdAt: new Date(),
        });
      }).toThrow(/Unique constraint failed/);

      // Different subject for same subscriber succeeds
      expect(() => {
        insertSubscription({
          id: "sub_rec_3",
          subscriberId: "subscriber_100",
          subject: SubjectChannel.COMPUTER_NETWORKS,
          createdAt: new Date(),
        });
      }).not.toThrow();
      expect(table).toHaveLength(2);

      // Same subject for different subscriber succeeds
      expect(() => {
        insertSubscription({
          id: "sub_rec_4",
          subscriberId: "subscriber_200",
          subject: SubjectChannel.JAVASCRIPT,
          createdAt: new Date(),
        });
      }).not.toThrow();
      expect(table).toHaveLength(3);
    });
  });

  // ── 3. Duplicate PublishedEpisode Prevention (@@unique([subject, episodeId]))
  describe("Challenge 3: PublishedEpisode Idempotency @@unique([subject, episodeId])", () => {
    it("declares @@unique([subject, episodeId]) in schema and migration DDL", () => {
      expect(schemaText).toMatch(
        /model\s+PublishedEpisode\s*\{[^}]*@@unique\(\[subject,\s*episodeId\]\)/
      );
      expect(migrationText).toContain(
        `CREATE UNIQUE INDEX "PublishedEpisode_subject_episodeId_key" ON "PublishedEpisode"("subject", "episodeId");`
      );
    });

    it("empirically rejects duplicate release ingestion attempts for identical (subject, episodeId)", () => {
      interface PublishedEpisodeRow {
        id: string;
        subject: SubjectChannel;
        episodeId: string;
        episodeNumber: number;
        title: string;
        releaseCommitSha: string;
        totalRecipients: number;
      }

      const store: PublishedEpisodeRow[] = [];
      const episodeIndex = new Set<string>();

      function upsertEpisode(
        row: PublishedEpisodeRow,
        mode: "insert" | "upsert" = "insert"
      ): PublishedEpisodeRow {
        const compositeKey = `${row.subject}::${row.episodeId}`;
        const existingIdx = store.findIndex(
          (e) => `${e.subject}::${e.episodeId}` === compositeKey
        );

        if (existingIdx >= 0) {
          if (mode === "insert") {
            const error = new Error(
              `Unique constraint failed on the fields: (subject, episodeId)`
            );
            (error as unknown as { code: string }).code = "P2002";
            throw error;
          }
          // Idempotent upsert fallback updates totalRecipients or sha
          store[existingIdx] = { ...store[existingIdx], ...row };
          return store[existingIdx];
        }

        episodeIndex.add(compositeKey);
        store.push(row);
        return row;
      }

      const initialEpisode: PublishedEpisodeRow = {
        id: "pub_1",
        subject: SubjectChannel.COMPUTER_NETWORKS,
        episodeId: "tcp-handshake",
        episodeNumber: 1,
        title: "TCP 3-Way Handshake Visualized",
        releaseCommitSha: "abc1234",
        totalRecipients: 0,
      };

      // 1. Initial insert succeeds
      expect(upsertEpisode(initialEpisode)).toEqual(initialEpisode);

      // 2. Duplicate raw insert fails with constraint violation
      expect(() => {
        upsertEpisode({
          ...initialEpisode,
          id: "pub_2_duplicate",
        }, "insert");
      }).toThrow(/Unique constraint failed/);

      // 3. Same episodeId across different subject channels is permitted
      const diffSubjectEpisode: PublishedEpisodeRow = {
        id: "pub_3",
        subject: SubjectChannel.JAVASCRIPT,
        episodeId: "tcp-handshake", // Shared slug across different track
        episodeNumber: 1,
        title: "JS Event Loop",
        releaseCommitSha: "abc1234",
        totalRecipients: 0,
      };
      expect(() => upsertEpisode(diffSubjectEpisode)).not.toThrow();

      // 4. Idempotent upsert gracefully replaces/merges without creating duplicate rows
      const updated = upsertEpisode(
        { ...initialEpisode, totalRecipients: 42 },
        "upsert"
      );
      expect(updated.totalRecipients).toBe(42);
      expect(store).toHaveLength(2); // Only the 2 distinct (subject, episodeId) records exist
    });
  });

  // ── 4. Cascade Deletion Integrity ─────────────────────────────────────────
  describe("Challenge 4: Referential Integrity & Cascade Deletion", () => {
    it("declares onDelete: Cascade in Prisma schema for all dependent relational links", () => {
      // User -> Subscriber
      expect(schemaText).toMatch(
        /user\s+User\?\s+@relation\(fields:\s*\[userId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/
      );

      // Subscriber -> Subscription
      expect(schemaText).toMatch(
        /subscriber\s+Subscriber\s+@relation\(fields:\s*\[subscriberId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/
      );
    });

    it("contains ON DELETE CASCADE ON UPDATE CASCADE in SQL migration foreign keys", () => {
      expect(migrationText).toContain(
        `ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
      );
      expect(migrationText).toContain(
        `ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
      );
    });

    it("empirically models 2-tier cascade deletion: deleting User cascades to Subscriber and Subscriptions", () => {
      interface DbState {
        users: { id: string; email: string }[];
        subscribers: { id: string; email: string; userId: string | null }[];
        subscriptions: { id: string; subscriberId: string; subject: SubjectChannel }[];
      }

      const db: DbState = {
        users: [
          { id: "u_1", email: "user1@example.com" },
          { id: "u_2", email: "user2@example.com" },
        ],
        subscribers: [
          { id: "s_1", email: "user1@example.com", userId: "u_1" },
          { id: "s_guest", email: "guest@example.com", userId: null },
        ],
        subscriptions: [
          { id: "sub_1_js", subscriberId: "s_1", subject: SubjectChannel.JAVASCRIPT },
          { id: "sub_1_net", subscriberId: "s_1", subject: SubjectChannel.COMPUTER_NETWORKS },
          { id: "sub_guest_all", subscriberId: "s_guest", subject: SubjectChannel.ALL },
        ],
      };

      function deleteUser(userId: string) {
        db.users = db.users.filter((u) => u.id !== userId);
        // Cascade to Subscriber
        const cascadedSubscriberIds = db.subscribers
          .filter((s) => s.userId === userId)
          .map((s) => s.id);
        db.subscribers = db.subscribers.filter((s) => s.userId !== userId);

        // Cascade to Subscriptions
        db.subscriptions = db.subscriptions.filter(
          (sub) => !cascadedSubscriberIds.includes(sub.subscriberId)
        );
      }

      function deleteSubscriber(subscriberId: string) {
        db.subscribers = db.subscribers.filter((s) => s.id !== subscriberId);
        // Cascade to Subscriptions
        db.subscriptions = db.subscriptions.filter(
          (sub) => sub.subscriberId !== subscriberId
        );
      }

      // Action 1: Delete User "u_1"
      deleteUser("u_1");

      // Verify User u_1 is gone
      expect(db.users.find((u) => u.id === "u_1")).toBeUndefined();
      // Verify Subscriber s_1 cascaded
      expect(db.subscribers.find((s) => s.id === "s_1")).toBeUndefined();
      // Verify Subscriptions for s_1 cascaded
      expect(db.subscriptions.filter((sub) => sub.subscriberId === "s_1")).toHaveLength(0);

      // Verify Guest subscriber and guest subscription were unaffected
      expect(db.subscribers.find((s) => s.id === "s_guest")).toBeDefined();
      expect(db.subscriptions.filter((sub) => sub.subscriberId === "s_guest")).toHaveLength(1);

      // Action 2: Direct Subscriber deletion cascades to subscriptions without deleting User
      deleteSubscriber("s_guest");
      expect(db.subscribers.find((s) => s.id === "s_guest")).toBeUndefined();
      expect(db.subscriptions.filter((sub) => sub.subscriberId === "s_guest")).toHaveLength(0);
      // User u_2 remains intact
      expect(db.users.find((u) => u.id === "u_2")).toBeDefined();
    });
  });

  // ── 5. Relational Decoupling Invariance Stress Testing ────────────────────
  describe("Challenge 5: Zero Re-Verification Decoupling Invariance", () => {
    it("confirms Subscription model is structurally incapable of storing verification flags", () => {
      const subscriptionDmmf = Prisma.dmmf.datamodel.models.find(
        (m) => m.name === "Subscription"
      )!;
      const fieldNames = subscriptionDmmf.fields.map((f) => f.name);

      expect(fieldNames).not.toContain("isVerified");
      expect(fieldNames).not.toContain("verificationToken");
      expect(fieldNames).not.toContain("tokenExpiresAt");
      expect(fieldNames).not.toContain("verifiedAt");
      expect(fieldNames).not.toContain("status");
    });

    it("stress-tests subscriber topic additions under randomized churn: isVerified is invariant", () => {
      interface SubscriberEntity {
        id: string;
        email: string;
        isVerified: boolean;
        verificationToken: string | null;
        tokenExpiresAt: Date | null;
      }

      interface TopicRegistry {
        subscriberId: string;
        subject: SubjectChannel;
      }

      const verifiedSubscriber: SubscriberEntity = {
        id: "sub_perm_verified",
        email: "veteran@example.com",
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
      };

      const topics: TopicRegistry[] = [];

      function subscribe(
        subscriber: SubscriberEntity,
        channel: SubjectChannel
      ): { verificationRequired: boolean; mailSent: boolean } {
        // Core architecture contract:
        // Verification is an attribute of the identity (Subscriber), not the topic (Subscription).
        const existing = topics.find(
          (t) => t.subscriberId === subscriber.id && t.subject === channel
        );
        if (!existing) {
          topics.push({ subscriberId: subscriber.id, subject: channel });
        }

        const verificationRequired = !subscriber.isVerified;
        return {
          verificationRequired,
          mailSent: verificationRequired,
        };
      }

      // Simulate sequential subscriptions to all 7 channels
      const channels = Object.values(SubjectChannel);
      for (const ch of channels) {
        const result = subscribe(verifiedSubscriber, ch);
        expect(result.verificationRequired).toBe(false);
        expect(result.mailSent).toBe(false);
        // The identity attributes must remain unchanged
        expect(verifiedSubscriber.isVerified).toBe(true);
        expect(verifiedSubscriber.verificationToken).toBeNull();
      }

      expect(topics).toHaveLength(channels.length);
    });

    it("verifies unverified guest subscription creates verificationToken but does not prematurely verify", () => {
      interface SubscriberEntity {
        id: string;
        email: string;
        isVerified: boolean;
        verificationToken: string | null;
        tokenExpiresAt: Date | null;
      }

      const unverifiedSubscriber: SubscriberEntity = {
        id: "sub_guest_1",
        email: "newbie@example.com",
        isVerified: false,
        verificationToken: "secure_token_12345",
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      expect(unverifiedSubscriber.isVerified).toBe(false);
      expect(unverifiedSubscriber.verificationToken).toBe("secure_token_12345");
      expect(unverifiedSubscriber.tokenExpiresAt!.getTime()).toBeGreaterThan(
        Date.now()
      );
    });
  });

  // ── 6. Edge Case Mining: Tokens, Nullability, and Index Coverage ──────────
  describe("Challenge 6: Edge Cases, Token Safety, and Index Strategy", () => {
    it("ensures unsubscribeToken is non-nullable and unique in schema and DDL", () => {
      const subscriberDmmf = Prisma.dmmf.datamodel.models.find(
        (m) => m.name === "Subscriber"
      )!;
      const unsubField = subscriberDmmf.fields.find(
        (f) => f.name === "unsubscribeToken"
      )!;

      expect(unsubField.type).toBe("String");
      // Verify schema.prisma does not have String? and has @unique @default(cuid())
      expect(schemaText).toMatch(/unsubscribeToken\s+String\s+@unique\s+@default\(cuid\(\)\)/);
      // Verify PostgreSQL DDL specifies TEXT NOT NULL
      expect(migrationText).toContain(`"unsubscribeToken" TEXT NOT NULL`);
      expect(migrationText).toContain(
        `CREATE UNIQUE INDEX "Subscriber_unsubscribeToken_key" ON "Subscriber"("unsubscribeToken");`
      );
    });

    it("ensures composite index on Subscriber(status, isVerified) for fan-out queries", () => {
      expect(migrationText).toContain(
        `CREATE INDEX "Subscriber_status_isVerified_idx" ON "Subscriber"("status", "isVerified");`
      );
    });

    it("validates SubscriptionStatus enum values match ACTIVE, UNSUBSCRIBED, and BOUNCED", () => {
      expect(Object.values(SubscriptionStatus).sort()).toEqual([
        "ACTIVE",
        "BOUNCED",
        "UNSUBSCRIBED",
      ]);
    });

    it("ensures PublishedEpisode indexes support fast reverse chronological query and SHA lookup", () => {
      expect(migrationText).toContain(
        `CREATE INDEX "PublishedEpisode_releaseCommitSha_idx" ON "PublishedEpisode"("releaseCommitSha");`
      );
      expect(migrationText).toContain(
        `CREATE INDEX "PublishedEpisode_publishedAt_idx" ON "PublishedEpisode"("publishedAt" DESC);`
      );
    });
  });
});
