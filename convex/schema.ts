import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Better Auth tables
  users: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    expiresAt: v.number(),
    token: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("token", ["token"]),

  accounts: defineTable({
    userId: v.id("users"),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    password: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("accountId", ["accountId"]),

  verifications: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("identifier", ["identifier"]),

  // LuminaWeb specific tables
  userProfiles: defineTable({
    userId: v.id("users"),
    publicKey: v.string(),
    privateKeyEncrypted: v.string(),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  }).index("userId", ["userId"]),

  messages: defineTable({
    id: v.string(),
    type: v.string(),
    senderId: v.id("users"),
    recipientId: v.id("users"),
    content: v.object({
      encryptedData: v.string(),
      iv: v.string(),
      tag: v.string(),
    }),
    signature: v.string(),
    timestamp: v.string(),
    nonce: v.string(),
    metadata: v.optional(v.object({
      readAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
    })),
    createdAt: v.number(),
  })
    .index("senderId", ["senderId"])
    .index("recipientId", ["recipientId"])
    .index("timestamp", ["timestamp"]),

  keyExchanges: defineTable({
    userId1: v.id("users"),
    userId2: v.id("users"),
    sharedSecret: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("users", ["userId1", "userId2"]),
});