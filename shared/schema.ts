import { pgTable, text, serial, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dids = pgTable("dids", {
  id: serial("id").primaryKey(),
  did: text("did").notNull().unique(),
  method: text("method").notNull(), // "did:key" or "did:web"
  keyType: text("key_type").notNull(), // "ed25519" or "secp256k1"
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  didDocument: jsonb("did_document").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const verifiableCredentials = pgTable("verifiable_credentials", {
  id: serial("id").primaryKey(),
  vcId: text("vc_id").notNull().unique(),
  issuer: text("issuer").notNull(),
  subject: text("subject").notNull(),
  credentialType: text("credential_type").notNull(),
  claims: jsonb("claims").notNull(),
  credential: jsonb("credential").notNull(),
  issuanceDate: timestamp("issuance_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDidSchema = createInsertSchema(dids).omit({
  id: true,
  createdAt: true,
});

export const insertVcSchema = createInsertSchema(verifiableCredentials).omit({
  id: true,
  createdAt: true,
});

export const registerDidSchema = z.object({
  keyType: z.enum(["ed25519", "secp256k1"]).default("ed25519"),
  method: z.enum(["did:key", "did:web"]).default("did:key"),
});

export const issueVcSchema = z.object({
  subjectDid: z.string().min(1, "Subject DID is required"),
  credentialType: z.string().min(1, "Credential type is required"),
  claims: z.record(z.any()),
});

export const verifyVcSchema = z.object({
  credential: z.record(z.any()),
});

export type InsertDid = z.infer<typeof insertDidSchema>;
export type Did = typeof dids.$inferSelect;

export type InsertVc = z.infer<typeof insertVcSchema>;
export type VerifiableCredential = typeof verifiableCredentials.$inferSelect;

export type RegisterDidRequest = z.infer<typeof registerDidSchema>;
export type IssueVcRequest = z.infer<typeof issueVcSchema>;
export type VerifyVcRequest = z.infer<typeof verifyVcSchema>;
