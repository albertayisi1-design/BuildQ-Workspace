import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table storing authenticated users mapped to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull().default(''),
  role: text('role').notNull().default('project_manager'), // admin, project_manager, site_supervisor, cost_estimator, safety_officer
  clientId: text('client_id'),
  avatar: text('avatar'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Documents table handling blueprints, contracts, permits, specifications, and safety files
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  title: text('title').notNull(),
  fileName: text('file_name').notNull(),
  category: text('category').notNull().default('Other'), // Blueprint, Contract, Permit, Specification, Safety & Compliance, Other
  fileSize: integer('file_size').notNull().default(0),
  fileType: text('file_type').notNull().default('application/octet-stream'),
  version: text('version').notNull().default('v1.0'),
  status: text('status').notNull().default('Approved'), // Approved, Under Review, Draft, Active, Expired
  uploadedBy: text('uploaded_by').notNull().default(''),
  uploadedByUid: text('uploaded_by_uid'),
  uploadedAt: text('uploaded_at').notNull(),
  description: text('description'),
  issuingAuthority: text('issuing_authority'),
  expiryDate: text('expiry_date'),
  fileData: text('file_data'), // Base64 data or preview content
  tags: text('tags'), // JSON string array
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  uploader: one(users, {
    fields: [documents.uploadedByUid],
    references: [users.uid],
  }),
}));
