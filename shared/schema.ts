import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  date,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table - matching existing database structure
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  password: varchar("password"),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // employee, manager, hr_admin
  department: varchar("department"),
  employeeId: varchar("employee_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training catalog
export const trainingCatalog = pgTable("training_catalog", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // internal, external, certification, compliance
  category: varchar("category").notNull(), // safety, quality, compliance, technical
  duration: integer("duration_hours").notNull(), // duration in hours
  validityPeriod: integer("validity_period_months"), // how long certification is valid
  isRequired: boolean("is_required").default(false),
  complianceStandard: varchar("compliance_standard"), // ISO45001, OSHA, etc.
  prerequisites: text("prerequisites"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training sessions
export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").references(() => trainingCatalog.id),
  title: varchar("title").notNull(),
  sessionDate: timestamp("session_date").notNull(),
  duration: integer("duration_hours").notNull(),
  venue: varchar("venue"),
  trainerName: varchar("trainer_name"),
  trainerType: varchar("trainer_type").notNull(), // internal, external
  maxParticipants: integer("max_participants"),
  status: varchar("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  materials: text("materials"), // JSON array of material URLs
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training enrollments/attendance
export const trainingEnrollments = pgTable("training_enrollments", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => trainingSessions.id),
  employeeId: varchar("employee_id").references(() => users.id),
  status: varchar("status").notNull().default("enrolled"), // enrolled, attended, completed, absent
  completionDate: timestamp("completion_date"),
  score: integer("score"), // if applicable
  certificateUrl: varchar("certificate_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training feedback
export const trainingFeedback = pgTable("training_feedback", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => trainingEnrollments.id),
  sessionId: integer("session_id").references(() => trainingSessions.id),
  employeeId: varchar("employee_id").references(() => users.id),
  overallRating: integer("overall_rating").notNull(), // 1-5
  contentRating: integer("content_rating").notNull(), // 1-5
  trainerRating: integer("trainer_rating").notNull(), // 1-5
  relevanceRating: integer("relevance_rating").notNull(), // 1-5
  comments: text("comments"),
  suggestions: text("suggestions"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Manager effectiveness evaluations
export const effectivenessEvaluations = pgTable("effectiveness_evaluations", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => trainingEnrollments.id),
  employeeId: varchar("employee_id").references(() => users.id),
  managerId: varchar("manager_id").references(() => users.id),
  evaluationDate: timestamp("evaluation_date").notNull(),
  knowledgeApplication: integer("knowledge_application"), // 1-5
  behaviorChange: integer("behavior_change"), // 1-5
  performanceImprovement: integer("performance_improvement"), // 1-5
  complianceAdherence: integer("compliance_adherence"), // 1-5
  overallEffectiveness: integer("overall_effectiveness").notNull(), // 1-5
  comments: text("comments"),
  actionPlan: text("action_plan"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Evidence attachments
export const evidenceAttachments = pgTable("evidence_attachments", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => trainingEnrollments.id),
  sessionId: integer("session_id").references(() => trainingSessions.id),
  fileName: varchar("file_name").notNull(),
  originalFileName: varchar("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: varchar("file_type").notNull(),
  filePath: varchar("file_path").notNull(),
  description: text("description"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Audit logs (immutable records)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type").notNull(), // training_session, enrollment, etc.
  entityId: integer("entity_id").notNull(),
  action: varchar("action").notNull(), // create, update, delete
  changes: jsonb("changes"), // JSON of what changed
  performedBy: varchar("performed_by").references(() => users.id),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
});

// Compliance requirements
export const complianceRequirements = pgTable("compliance_requirements", {
  id: serial("id").primaryKey(),
  standard: varchar("standard").notNull(), // ISO45001, OSHA, etc.
  requirement: text("requirement").notNull(),
  description: text("description"),
  frequency: varchar("frequency"), // annual, monthly, etc.
  department: varchar("department"),
  role: varchar("role"),
  trainingCatalogId: integer("training_catalog_id").references(() => trainingCatalog.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(trainingEnrollments),
  feedback: many(trainingFeedback),
  evaluationsAsEmployee: many(effectivenessEvaluations, { relationName: "employee" }),
  evaluationsAsManager: many(effectivenessEvaluations, { relationName: "manager" }),
}));

export const trainingCatalogRelations = relations(trainingCatalog, ({ one, many }) => ({
  sessions: many(trainingSessions),
  creator: one(users, { fields: [trainingCatalog.createdBy], references: [users.id] }),
  complianceRequirement: many(complianceRequirements),
}));

export const trainingSessionsRelations = relations(trainingSessions, ({ one, many }) => ({
  catalog: one(trainingCatalog, { fields: [trainingSessions.catalogId], references: [trainingCatalog.id] }),
  enrollments: many(trainingEnrollments),
  feedback: many(trainingFeedback),
  attachments: many(evidenceAttachments),
  creator: one(users, { fields: [trainingSessions.createdBy], references: [users.id] }),
}));

export const trainingEnrollmentsRelations = relations(trainingEnrollments, ({ one, many }) => ({
  session: one(trainingSessions, { fields: [trainingEnrollments.sessionId], references: [trainingSessions.id] }),
  employee: one(users, { fields: [trainingEnrollments.employeeId], references: [users.id] }),
  feedback: many(trainingFeedback),
  evaluations: many(effectivenessEvaluations),
  attachments: many(evidenceAttachments),
}));

export const trainingFeedbackRelations = relations(trainingFeedback, ({ one }) => ({
  enrollment: one(trainingEnrollments, { fields: [trainingFeedback.enrollmentId], references: [trainingEnrollments.id] }),
  session: one(trainingSessions, { fields: [trainingFeedback.sessionId], references: [trainingSessions.id] }),
  employee: one(users, { fields: [trainingFeedback.employeeId], references: [users.id] }),
}));

export const effectivenessEvaluationsRelations = relations(effectivenessEvaluations, ({ one }) => ({
  enrollment: one(trainingEnrollments, { fields: [effectivenessEvaluations.enrollmentId], references: [trainingEnrollments.id] }),
  employee: one(users, { fields: [effectivenessEvaluations.employeeId], references: [users.id] }),
  manager: one(users, { fields: [effectivenessEvaluations.managerId], references: [users.id] }),
}));

export const evidenceAttachmentsRelations = relations(evidenceAttachments, ({ one }) => ({
  enrollment: one(trainingEnrollments, { fields: [evidenceAttachments.enrollmentId], references: [trainingEnrollments.id] }),
  session: one(trainingSessions, { fields: [evidenceAttachments.sessionId], references: [trainingSessions.id] }),
  uploader: one(users, { fields: [evidenceAttachments.uploadedBy], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingCatalogSchema = createInsertSchema(trainingCatalog).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingEnrollmentSchema = createInsertSchema(trainingEnrollments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingFeedbackSchema = createInsertSchema(trainingFeedback).omit({ id: true });
export const insertEffectivenessEvaluationSchema = createInsertSchema(effectivenessEvaluations).omit({ id: true, createdAt: true });
export const insertEvidenceAttachmentSchema = createInsertSchema(evidenceAttachments).omit({ id: true, uploadedAt: true });

// Types
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type TrainingCatalog = typeof trainingCatalog.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type TrainingEnrollment = typeof trainingEnrollments.$inferSelect;
export type TrainingFeedback = typeof trainingFeedback.$inferSelect;
export type EffectivenessEvaluation = typeof effectivenessEvaluations.$inferSelect;
export type EvidenceAttachment = typeof evidenceAttachments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ComplianceRequirement = typeof complianceRequirements.$inferSelect;

export type InsertTrainingCatalog = z.infer<typeof insertTrainingCatalogSchema>;
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type InsertTrainingEnrollment = z.infer<typeof insertTrainingEnrollmentSchema>;
export type InsertTrainingFeedback = z.infer<typeof insertTrainingFeedbackSchema>;
export type InsertEffectivenessEvaluation = z.infer<typeof insertEffectivenessEvaluationSchema>;
export type InsertEvidenceAttachment = z.infer<typeof insertEvidenceAttachmentSchema>;
