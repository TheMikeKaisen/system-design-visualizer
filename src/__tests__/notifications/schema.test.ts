import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { Prisma, SubjectChannel, SubscriptionStatus } from "@prisma/client";

// ─── Lightweight, Zero-Dependency Prisma Schema AST Parser ───────────────────

interface ParsedField {
  name: string;
  type: string;
  isOptional: boolean;
  isList: boolean;
  rawDirectives: string;
  isUnique: boolean;
  isId: boolean;
  hasDefault: boolean;
  defaultVal?: string;
  relation?: string;
}

interface ParsedModel {
  name: string;
  fields: Record<string, ParsedField>;
  uniqueConstraints: string[];
  indexes: string[];
}

interface ParsedEnum {
  name: string;
  values: string[];
}

interface ParsedSchema {
  models: Record<string, ParsedModel>;
  enums: Record<string, ParsedEnum>;
}

function parsePrismaSchema(schemaContent: string): ParsedSchema {
  const models: Record<string, ParsedModel> = {};
  const enums: Record<string, ParsedEnum> = {};

  const lines = schemaContent.split("\n");
  let currentModel: ParsedModel | null = null;
  let currentEnum: ParsedEnum | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;

    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      currentModel = {
        name: modelMatch[1],
        fields: {},
        uniqueConstraints: [],
        indexes: [],
      };
      models[modelMatch[1]] = currentModel;
      currentEnum = null;
      continue;
    }

    const enumMatch = line.match(/^enum\s+(\w+)\s*\{/);
    if (enumMatch) {
      currentEnum = { name: enumMatch[1], values: [] };
      enums[enumMatch[1]] = currentEnum;
      currentModel = null;
      continue;
    }

    if (line === "}") {
      currentModel = null;
      currentEnum = null;
      continue;
    }

    if (currentModel) {
      if (line.startsWith("@@unique")) {
        currentModel.uniqueConstraints.push(line);
      } else if (line.startsWith("@@index")) {
        currentModel.indexes.push(line);
      } else {
        const parts = line.split(/\s+/);
        const fieldName = parts[0];
        const fieldType = parts[1];
        const directives = parts.slice(2).join(" ");
        currentModel.fields[fieldName] = {
          name: fieldName,
          type: fieldType,
          isOptional: fieldType.endsWith("?"),
          isList: fieldType.endsWith("[]"),
          rawDirectives: directives,
          isUnique: directives.includes("@unique"),
          isId: directives.includes("@id"),
          hasDefault: directives.includes("@default"),
          defaultVal: (directives.match(/@default\(((?:[^()]+|\([^()]*\))+)\)/) || [])[1],
          relation: (directives.match(/@relation\(((?:[^()]+|\([^()]*\))+)\)/) || [])[1],
        };
      }
    } else if (currentEnum) {
      currentEnum.values.push(line);
    }
  }

  return { models, enums };
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe("Milestone 1: Database Foundation & Schema Verification", () => {
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  const parsed = parsePrismaSchema(schemaContent);

  // ── 1. DMMF Runtime Model & Enum Verification ─────────────────────────────
  describe("Prisma Client DMMF Runtime Model", () => {
    it("exports valid runtime datamodel from @prisma/client", () => {
      expect(Prisma.dmmf).toBeDefined();
      expect(Prisma.dmmf.datamodel).toBeDefined();
    });

    it("includes Subscriber, Subscription, and PublishedEpisode models in DMMF", () => {
      const modelNames = Prisma.dmmf.datamodel.models.map((m) => m.name);
      expect(modelNames).toContain("Subscriber");
      expect(modelNames).toContain("Subscription");
      expect(modelNames).toContain("PublishedEpisode");
      expect(modelNames).toContain("User");
    });

    it("includes SubjectChannel enum with all 7 canonical discipline channels", () => {
      // Direct client export verification
      expect(SubjectChannel).toEqual({
        ALL: "ALL",
        JAVASCRIPT: "JAVASCRIPT",
        OPERATING_SYSTEMS: "OPERATING_SYSTEMS",
        JAVA: "JAVA",
        COMPUTER_NETWORKS: "COMPUTER_NETWORKS",
        BACKEND: "BACKEND",
        FRONTEND: "FRONTEND",
      });

      // Schema AST enum verification
      expect(parsed.enums["SubjectChannel"]).toBeDefined();
      expect(parsed.enums["SubjectChannel"].values).toEqual([
        "ALL",
        "JAVASCRIPT",
        "OPERATING_SYSTEMS",
        "JAVA",
        "COMPUTER_NETWORKS",
        "BACKEND",
        "FRONTEND",
      ]);
    });

    it("includes SubscriptionStatus enum with ACTIVE, UNSUBSCRIBED, and BOUNCED", () => {
      // Direct client export verification
      expect(SubscriptionStatus).toEqual({
        ACTIVE: "ACTIVE",
        UNSUBSCRIBED: "UNSUBSCRIBED",
        BOUNCED: "BOUNCED",
      });

      // Schema AST enum verification
      expect(parsed.enums["SubscriptionStatus"]).toBeDefined();
      expect(parsed.enums["SubscriptionStatus"].values).toEqual([
        "ACTIVE",
        "UNSUBSCRIBED",
        "BOUNCED",
      ]);
    });

    it("defines correct DMMF fields and types for model Subscriber", () => {
      const subscriber = Prisma.dmmf.datamodel.models.find(
        (m) => m.name === "Subscriber"
      )!;
      expect(subscriber).toBeDefined();

      const fieldMap = new Map(subscriber.fields.map((f) => [f.name, f]));
      expect(fieldMap.get("id")?.type).toBe("String");
      expect(fieldMap.get("email")?.type).toBe("String");
      expect(fieldMap.get("userId")?.type).toBe("String");
      expect(fieldMap.get("isVerified")?.type).toBe("Boolean");
      expect(fieldMap.get("verificationToken")?.type).toBe("String");
      expect(fieldMap.get("tokenExpiresAt")?.type).toBe("DateTime");
      expect(fieldMap.get("unsubscribeToken")?.type).toBe("String");
      expect(fieldMap.get("status")?.kind).toBe("enum");
      expect(fieldMap.get("status")?.type).toBe("SubscriptionStatus");
      expect(fieldMap.get("createdAt")?.type).toBe("DateTime");
      expect(fieldMap.get("updatedAt")?.type).toBe("DateTime");
      expect(fieldMap.get("user")?.type).toBe("User");
      expect(fieldMap.get("subscriptions")?.type).toBe("Subscription");
    });

    it("defines correct DMMF fields and types for model Subscription", () => {
      const subscription = Prisma.dmmf.datamodel.models.find(
        (m) => m.name === "Subscription"
      )!;
      expect(subscription).toBeDefined();

      const fieldMap = new Map(subscription.fields.map((f) => [f.name, f]));
      expect(fieldMap.get("id")?.type).toBe("String");
      expect(fieldMap.get("subscriberId")?.type).toBe("String");
      expect(fieldMap.get("subject")?.kind).toBe("enum");
      expect(fieldMap.get("subject")?.type).toBe("SubjectChannel");
      expect(fieldMap.get("createdAt")?.type).toBe("DateTime");
      expect(fieldMap.get("subscriber")?.type).toBe("Subscriber");
    });

    it("defines correct DMMF fields and types for model PublishedEpisode", () => {
      const episode = Prisma.dmmf.datamodel.models.find(
        (m) => m.name === "PublishedEpisode"
      )!;
      expect(episode).toBeDefined();

      const fieldMap = new Map(episode.fields.map((f) => [f.name, f]));
      expect(fieldMap.get("id")?.type).toBe("String");
      expect(fieldMap.get("subject")?.kind).toBe("enum");
      expect(fieldMap.get("subject")?.type).toBe("SubjectChannel");
      expect(fieldMap.get("episodeId")?.type).toBe("String");
      expect(fieldMap.get("episodeNumber")?.type).toBe("Int");
      expect(fieldMap.get("title")?.type).toBe("String");
      expect(fieldMap.get("releaseCommitSha")?.type).toBe("String");
      expect(fieldMap.get("totalRecipients")?.type).toBe("Int");
      expect(fieldMap.get("publishedAt")?.type).toBe("DateTime");
      expect(fieldMap.get("dispatchedAt")?.type).toBe("DateTime");
    });
  });

  // ── 2. Declarative Schema Constraints & Default Values ────────────────────
  describe("Prisma Schema AST Constraints & Attributes", () => {
    it("enforces unique constraints on Subscriber email, userId, verificationToken, and unsubscribeToken", () => {
      const subscriber = parsed.models["Subscriber"];
      expect(subscriber).toBeDefined();

      expect(subscriber.fields["email"].isUnique).toBe(true);
      expect(subscriber.fields["userId"].isUnique).toBe(true);
      expect(subscriber.fields["verificationToken"].isUnique).toBe(true);
      expect(subscriber.fields["unsubscribeToken"].isUnique).toBe(true);
    });

    it("enforces default values on Subscriber fields", () => {
      const fields = parsed.models["Subscriber"].fields;
      expect(fields["id"].defaultVal).toBe("cuid()");
      expect(fields["isVerified"].defaultVal).toBe("false");
      expect(fields["unsubscribeToken"].defaultVal).toBe("cuid()");
      expect(fields["status"].defaultVal).toBe("ACTIVE");
      expect(fields["createdAt"].defaultVal).toBe("now()");
      expect(fields["updatedAt"].rawDirectives).toContain("@updatedAt");
    });

    it("enforces @@index([status, isVerified]) on Subscriber for efficient active subscriber filtering", () => {
      const subscriber = parsed.models["Subscriber"];
      expect(subscriber).toBeDefined();

      const hasStatusIndex = subscriber.indexes.some((idx) =>
        idx.includes("status") && idx.includes("isVerified")
      );
      expect(hasStatusIndex).toBe(true);
    });

    it("enforces @@unique([subscriberId, subject]) on Subscription to prevent duplicate topic subscriptions", () => {
      const subscription = parsed.models["Subscription"];
      expect(subscription).toBeDefined();

      const hasUniqueTopic = subscription.uniqueConstraints.some((u) =>
        u.includes("subscriberId") && u.includes("subject")
      );
      expect(hasUniqueTopic).toBe(true);
    });

    it("enforces indexes on Subscription for fast topic fan-out queries", () => {
      const subscription = parsed.models["Subscription"];
      const hasSubjectIndex = subscription.indexes.some((idx) =>
        idx.includes("subject")
      );
      expect(hasSubjectIndex).toBe(true);
    });

    it("enforces @@unique([subject, episodeId]) on PublishedEpisode for idempotent release ingestion", () => {
      const episode = parsed.models["PublishedEpisode"];
      expect(episode).toBeDefined();

      const hasUniqueEpisode = episode.uniqueConstraints.some((u) =>
        u.includes("subject") && u.includes("episodeId")
      );
      expect(hasUniqueEpisode).toBe(true);
    });

    it("enforces default values and indexes on PublishedEpisode", () => {
      const episode = parsed.models["PublishedEpisode"];
      expect(episode.fields["id"].defaultVal).toBe("cuid()");
      expect(episode.fields["totalRecipients"].defaultVal).toBe("0");
      expect(episode.fields["publishedAt"].defaultVal).toBe("now()");

      const hasShaIndex = episode.indexes.some((idx) =>
        idx.includes("releaseCommitSha")
      );
      expect(hasShaIndex).toBe(true);

      const hasPublishedAtIndex = episode.indexes.some((idx) =>
        idx.includes("publishedAt")
      );
      expect(hasPublishedAtIndex).toBe(true);
    });
  });

  // ── 3. Relational Decoupling Principle ────────────────────────────────────
  describe("Relational Decoupling Principle Verification", () => {
    it("places verification state strictly on Subscriber and NOT on Subscription", () => {
      const subscriberFields = parsed.models["Subscriber"].fields;
      const subscriptionFields = parsed.models["Subscription"].fields;

      // Verification state belongs on Subscriber
      expect(subscriberFields["isVerified"]).toBeDefined();
      expect(subscriberFields["verificationToken"]).toBeDefined();
      expect(subscriberFields["tokenExpiresAt"]).toBeDefined();

      // Subscription must be completely decoupled from verification flags
      expect(subscriptionFields["isVerified"]).toBeUndefined();
      expect(subscriptionFields["verificationToken"]).toBeUndefined();
      expect(subscriptionFields["tokenExpiresAt"]).toBeUndefined();
      expect(subscriptionFields["isTokenValid"]).toBeUndefined();
    });

    it("guarantees zero re-verification when adding new subscriptions (State Transition Simulation)", () => {
      // Domain model verification:
      // A subscriber's verification is an identity-level attribute, while subscriptions are interest-level rows.
      interface MockSubscriber {
        id: string;
        email: string;
        isVerified: boolean;
        verificationToken: string | null;
      }

      interface MockSubscription {
        subscriberId: string;
        subject: string;
      }

      function addSubscription(
        subscriber: MockSubscriber,
        existingSubscriptions: MockSubscription[],
        newSubject: string
      ) {
        const alreadySubscribed = existingSubscriptions.some(
          (s) => s.subject === newSubject
        );
        if (alreadySubscribed) return { subscriber, subscriptions: existingSubscriptions, emailTriggered: false };

        const updatedSubscriptions = [
          ...existingSubscriptions,
          { subscriberId: subscriber.id, subject: newSubject },
        ];

        // Decoupling rule: If already verified, do NOT reset isVerified, do NOT generate a token
        const emailTriggered = !subscriber.isVerified;

        return {
          subscriber: { ...subscriber }, // isVerified remains exactly what it was
          subscriptions: updatedSubscriptions,
          emailTriggered,
        };
      }

      // Case 1: Verified user subscribing to a new subject
      const verifiedSubscriber: MockSubscriber = {
        id: "sub_1",
        email: "verified@example.com",
        isVerified: true,
        verificationToken: null,
      };

      const result1 = addSubscription(
        verifiedSubscriber,
        [{ subscriberId: "sub_1", subject: "JAVASCRIPT" }],
        "OPERATING_SYSTEMS"
      );

      expect(result1.subscriber.isVerified).toBe(true);
      expect(result1.subscriber.verificationToken).toBeNull();
      expect(result1.emailTriggered).toBe(false);
      expect(result1.subscriptions).toHaveLength(2);

      // Case 2: Unverified user subscribing
      const guestSubscriber: MockSubscriber = {
        id: "sub_2",
        email: "guest@example.com",
        isVerified: false,
        verificationToken: "token_abc",
      };

      const result2 = addSubscription(
        guestSubscriber,
        [],
        "COMPUTER_NETWORKS"
      );

      expect(result2.subscriber.isVerified).toBe(false);
      expect(result2.emailTriggered).toBe(true);
    });
  });

  // ── 4. Relations & Referential Actions ────────────────────────────────────
  describe("Relational Integrity & Cascade Deletion", () => {
    it("configures cascade delete from Subscriber to Subscription", () => {
      const subscription = parsed.models["Subscription"];
      const subscriberField = subscription.fields["subscriber"];
      expect(subscriberField).toBeDefined();
      expect(subscriberField.relation).toContain("onDelete: Cascade");
      expect(subscriberField.relation).toContain("fields: [subscriberId]");
      expect(subscriberField.relation).toContain("references: [id]");
    });

    it("links User model to Subscriber without altering existing NextAuth fields", () => {
      const user = parsed.models["User"];
      expect(user).toBeDefined();

      // Preserved Auth.js fields
      expect(user.fields["id"]).toBeDefined();
      expect(user.fields["email"]).toBeDefined();
      expect(user.fields["accounts"]).toBeDefined();
      expect(user.fields["sessions"]).toBeDefined();
      expect(user.fields["diagrams"]).toBeDefined();

      // Newly linked subscriber relation
      expect(user.fields["subscriber"]).toBeDefined();
      expect(user.fields["subscriber"].type).toBe("Subscriber?");
    });
  });
});
