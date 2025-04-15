"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertMessageSchema = exports.insertBusinessSchema = exports.insertUserSchema = exports.messages = exports.businesses = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
// Define the industry matching rules schema
const industryRuleSchema = zod_1.z.object({
    keywords: zod_1.z.array(zod_1.z.string()),
    priority: zod_1.z.number().min(1).max(10),
    requirements: zod_1.z.array(zod_1.z.string()),
    specializations: zod_1.z.array(zod_1.z.string()),
});
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    type: (0, pg_core_1.text)("type", { enum: ["business", "consumer"] }).notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
});
exports.businesses = (0, pg_core_1.pgTable)("businesses", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    name: (0, pg_core_1.integer)("name").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    location: (0, pg_core_1.text)("location").notNull(),
    services: (0, pg_core_1.text)("services").array().notNull(),
    industryRules: (0, pg_core_1.jsonb)("industry_rules").notNull(), // New field for industry-specific matching rules
    matchingScore: (0, pg_core_1.integer)("matching_score").notNull().default(0), // Base matching score
});
exports.messages = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    fromId: (0, pg_core_1.integer)("from_id").notNull(),
    toId: (0, pg_core_1.integer)("to_id").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    timestamp: (0, pg_core_1.timestamp)("timestamp").notNull().defaultNow(),
    isAiAssistant: (0, pg_core_1.boolean)("is_ai_assistant").notNull().default(false),
});
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).pick({
    username: true,
    password: true,
    type: true,
    name: true,
});
exports.insertBusinessSchema = (0, drizzle_zod_1.createInsertSchema)(exports.businesses)
    .pick({
    description: true,
    category: true,
    location: true,
    services: true,
})
    .extend({
    industryRules: industryRuleSchema,
});
exports.insertMessageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.messages).pick({
    fromId: true,
    toId: true,
    content: true,
    isAiAssistant: true,
});
