import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import xlsx from "xlsx";
import { storage } from "./storage-simple";
import { setupAuth, isAuthenticated } from "./auth";
import { db } from "./db";
import { and, eq, sql } from "drizzle-orm";
import {
  insertTrainingCatalogSchema,
  insertTrainingSessionSchema,
  insertTrainingEnrollmentSchema,
  insertTrainingFeedbackSchema,
  insertEffectivenessEvaluationSchema,
  insertUserSchema,
  users,
  trainingEnrollments,
  trainingSessions,
  trainingFeedback,
  effectivenessEvaluations,
  evidenceAttachments,
  complianceRequirements,
} from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: fileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only specific file types are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({ ...user, password: undefined }); // Don't send password
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getComplianceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get('/api/dashboard/employee-compliance', isAuthenticated, async (req, res) => {
    try {
      const complianceStatus = await storage.getEmployeeCompliance();
      res.json(complianceStatus);
    } catch (error) {
      console.error("Error fetching employee compliance:", error);
      res.status(500).json({ message: "Failed to fetch employee compliance data" });
    }
  });

  // Training catalog routes
  app.get('/api/training-catalog', isAuthenticated, async (req, res) => {
    try {
      const catalog = await storage.getTrainingCatalog();
      res.json(catalog);
    } catch (error) {
      console.error("Error fetching training catalog:", error);
      res.status(500).json({ message: "Failed to fetch training catalog" });
    }
  });

  app.post('/api/training-catalog', isAuthenticated, async (req: any, res) => {
    try {
      console.log("POST /api/training-catalog - User:", req.user?.id);
      console.log("POST /api/training-catalog - Body:", req.body);
      
      const validatedData = insertTrainingCatalogSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      console.log("POST /api/training-catalog - Validated data:", validatedData);
      
      const newCatalog = await storage.createTrainingCatalog(validatedData);
      
      console.log("POST /api/training-catalog - Created:", newCatalog);
      
      // TODO: Add audit log when needed
      
      res.status(201).json(newCatalog);
    } catch (error) {
      console.error("Error creating training catalog:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Failed to create training catalog" });
      }
    }
  });

  app.put('/api/training-catalog/:id', isAuthenticated, async (req: any, res) => {
    res.status(501).json({ message: "Update not implemented yet" });
  });

  // Training sessions routes
  app.get('/api/training-sessions', isAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getTrainingSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching training sessions:", error);
      res.status(500).json({ message: "Failed to fetch training sessions" });
    }
  });

  app.get('/api/training-sessions/calendar', isAuthenticated, async (req, res) => {
    try {
      const { start, end } = req.query;
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      
      const sessions = await storage.getTrainingSessionsByDateRange(startDate, endDate);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching calendar sessions:", error);
      res.status(500).json({ message: "Failed to fetch calendar sessions" });
    }
  });

  app.post('/api/training-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertTrainingSessionSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const newSession = await storage.createTrainingSession(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: 'training_session',
        entityId: newSession.id,
        action: 'create',
        performedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(201).json(newSession);
    } catch (error) {
      console.error("Error creating training session:", error);
      res.status(400).json({ message: "Failed to create training session" });
    }
  });

  // Training enrollments routes
  app.get('/api/training-enrollments', isAuthenticated, async (req, res) => {
    try {
      const enrollments = await storage.getTrainingEnrollments();
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.get('/api/training-enrollments/employee/:employeeId', isAuthenticated, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const enrollments = await storage.getEnrollmentsByEmployee(employeeId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching employee enrollments:", error);
      res.status(500).json({ message: "Failed to fetch employee enrollments" });
    }
  });

  app.post('/api/training-enrollments', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertTrainingEnrollmentSchema.parse(req.body);
      const newEnrollment = await storage.createTrainingEnrollment(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: 'training_enrollment',
        entityId: newEnrollment.id,
        action: 'create',
        performedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(201).json(newEnrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(400).json({ message: "Failed to create enrollment" });
    }
  });

  app.put('/api/training-enrollments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTrainingEnrollmentSchema.partial().parse(req.body);
      
      const updated = await storage.updateTrainingEnrollment(id, validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: 'training_enrollment',
        entityId: id,
        action: 'update',
        changes: validatedData,
        performedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating enrollment:", error);
      res.status(400).json({ message: "Failed to update enrollment" });
    }
  });

  // Training feedback routes
  app.get('/api/training-feedback', isAuthenticated, async (req, res) => {
    try {
      const feedback = await storage.getTrainingFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post('/api/training-feedback', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertTrainingFeedbackSchema.parse({
        ...req.body,
        employeeId: req.user.claims.sub
      });
      
      const newFeedback = await storage.createTrainingFeedback(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: 'training_feedback',
        entityId: newFeedback.id,
        action: 'create',
        performedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(201).json(newFeedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(400).json({ message: "Failed to create feedback" });
    }
  });

  // Effectiveness evaluations routes
  app.get('/api/effectiveness-evaluations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      let evaluations;
      if (user?.role === 'manager' || user?.role === 'hr_admin') {
        evaluations = await storage.getEvaluationsByManager(userId);
      } else {
        evaluations = await storage.getEvaluationsByEmployee(userId);
      }
      
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  app.post('/api/effectiveness-evaluations', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertEffectivenessEvaluationSchema.parse({
        ...req.body,
        managerId: req.user.claims.sub
      });
      
      const newEvaluation = await storage.createEffectivenessEvaluation(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: 'effectiveness_evaluation',
        entityId: newEvaluation.id,
        action: 'create',
        performedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(201).json(newEvaluation);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      res.status(400).json({ message: "Failed to create evaluation" });
    }
  });

  // File upload routes
  app.post('/api/evidence-attachments', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const attachment = await storage.createEvidenceAttachment({
        enrollmentId: parseInt(req.body.enrollmentId),
        sessionId: req.body.sessionId ? parseInt(req.body.sessionId) : null,
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        filePath: req.file.path,
        description: req.body.description || null,
        uploadedBy: req.user.claims.sub,
      });

      // Create audit log
      await storage.createAuditLog({
        entityType: 'evidence_attachment',
        entityId: attachment.id,
        action: 'create',
        performedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(attachment);
    } catch (error) {
      console.error("Error uploading evidence:", error);
      res.status(400).json({ message: "Failed to upload evidence" });
    }
  });

  app.get('/api/evidence-attachments/:id/download', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const attachments = await storage.getEvidenceAttachments();
      const attachment = attachments.find(a => a.id === id);

      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      if (!fs.existsSync(attachment.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      res.download(attachment.filePath, attachment.originalFileName);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Users management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { department, role } = req.query;
      let users;
      
      if (department) {
        users = await storage.getUsersByDepartment(department as string);
      } else if (role) {
        users = await storage.getUsersByRole(role as string);
      } else {
        // Get all users - implemented pagination if needed
        users = await storage.getAllUsers();
      }
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: 'user',
        entityId: 0, // Will be updated when we have proper ID handling
        action: 'create',
        performedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  // Departments routes
  app.get('/api/departments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'hr_admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Return a list of departments (for now, just return unique departments from users)
      const users = await storage.getAllUsers();
      const departmentSet = new Set(users.map(user => user.department).filter(Boolean));
      const departments = Array.from(departmentSet);
      
      res.json(departments.map(dept => ({ name: dept, description: '', manager: null })));
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post('/api/departments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // For now, just return success (department management can be enhanced later)
      res.status(201).json({ message: "Department created successfully" });
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(400).json({ message: "Failed to create department" });
    }
  });

  // Audit logs routes
  app.get('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Training Catalog Excel Import/Export Routes
  app.get('/api/training-catalog/template', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'hr_admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Create Excel template
      const templateData = [
        {
          title: 'OSHA Safety Fundamentals',
          description: 'Basic workplace safety training covering OSHA regulations and safety procedures',
          type: 'internal',
          category: 'safety',
          duration: 4,
          validityPeriod: 12,
          complianceStandard: 'OSHA 29 CFR 1926',
          prerequisites: 'None',
          isRequired: 'TRUE',
          trainerName: 'John Smith',
          trainerType: 'internal',
          cost: '',
          currency: 'USD',
          providerName: '',
          providerContact: '',
          location: '',
          externalUrl: ''
        },
        {
          title: 'External Fire Safety Training',
          description: 'Comprehensive fire safety and emergency response training',
          type: 'external',
          category: 'safety',
          duration: 6,
          validityPeriod: 24,
          complianceStandard: 'NFPA 101',
          prerequisites: 'Basic Safety Orientation',
          isRequired: 'FALSE',
          trainerName: '',
          trainerType: 'external',
          cost: 250.00,
          currency: 'USD',
          providerName: 'Fire Safety Institute',
          providerContact: 'contact@firesafety.com',
          location: 'Chicago, IL',
          externalUrl: 'https://firesafety.com/training'
        }
      ];

      const ws = xlsx.utils.json_to_sheet(templateData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Training Catalog Template');

      // Set column widths
      ws['!cols'] = [
        { wch: 25 }, // title
        { wch: 50 }, // description
        { wch: 12 }, // type
        { wch: 12 }, // category
        { wch: 10 }, // duration
        { wch: 15 }, // validityPeriod
        { wch: 20 }, // complianceStandard
        { wch: 30 }, // prerequisites
        { wch: 10 }, // isRequired
        { wch: 20 }, // trainerName
        { wch: 15 }, // trainerType
        { wch: 10 }, // cost
        { wch: 10 }, // currency
        { wch: 25 }, // providerName
        { wch: 25 }, // providerContact
        { wch: 20 }, // location
        { wch: 40 }  // externalUrl
      ];

      const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=training-catalog-template.xlsx');
      res.send(excelBuffer);

    } catch (error) {
      console.error("Error generating Excel template:", error);
      res.status(500).json({ message: "Failed to generate Excel template" });
    }
  });

  app.post('/api/training-catalog/bulk-import', isAuthenticated, upload.single('excel'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'hr_admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No Excel file uploaded" });
      }

      // Read Excel file
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);

      console.log("Excel data received:", jsonData);

      const results = {
        success: 0,
        errors: [] as any[]
      };

      // Process each row
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
        try {
          // Validate required fields
          if (!row.title || !row.type || !row.category || !row.duration) {
            results.errors.push({
              row: i + 2, // Excel row number (starting from 2, accounting for header)
              error: 'Missing required fields: title, type, category, duration'
            });
            continue;
          }

          // Validate external training requirements
          if (row.type === 'external' && !row.providerName) {
            results.errors.push({
              row: i + 2,
              error: 'Provider name is required for external training'
            });
            continue;
          }

          // Prepare training data
          const trainingData = {
            title: row.title?.toString().trim(),
            description: row.description?.toString().trim() || null,
            type: row.type?.toString().toLowerCase(),
            category: row.category?.toString().toLowerCase(),
            duration: parseInt(row.duration?.toString()) || 0,
            validityPeriod: row.validityPeriod ? parseInt(row.validityPeriod.toString()) : null,
            complianceStandard: row.complianceStandard?.toString().trim() || null,
            prerequisites: row.prerequisites?.toString().trim() || null,
            isRequired: row.isRequired?.toString().toLowerCase() === 'true',
            trainerName: row.trainerName?.toString().trim() || null,
            trainerType: row.trainerType?.toString().toLowerCase() || null,
            cost: row.cost ? Math.round(parseFloat(row.cost.toString()) * 100) : null,
            currency: row.currency?.toString() || 'USD',
            providerName: row.providerName?.toString().trim() || null,
            providerContact: row.providerContact?.toString().trim() || null,
            location: row.location?.toString().trim() || null,
            externalUrl: row.externalUrl?.toString().trim() || null,
            createdBy: userId
          };

          // Validate data using schema
          const validatedData = insertTrainingCatalogSchema.parse(trainingData);
          
          // Create training
          await storage.createTrainingCatalog(validatedData);
          results.success++;

        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error);
          results.errors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Create audit log
      await storage.createAuditLog({
        entityType: 'training_catalog',
        entityId: 0,
        action: 'bulk_import',
        changes: {
          totalRows: jsonData.length,
          successCount: results.success,
          errorCount: results.errors.length
        },
        performedBy: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        message: `Import completed. ${results.success} trainings created successfully.`,
        success: results.success,
        errors: results.errors.length > 0 ? results.errors : undefined
      });

    } catch (error) {
      console.error("Error processing bulk import:", error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to process bulk import" });
    }
  });

  // Training feedback routes
  app.get('/api/training-enrollments/completed/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const currentUser = await storage.getUser(req.user.id);
      
      // Users can only see their own completed enrollments, unless they're admin/manager
      if (currentUser?.id !== userId && currentUser?.role !== 'hr_admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }

      const completedEnrollments = await db.select({
        id: trainingEnrollments.id,
        sessionId: trainingEnrollments.sessionId,
        employeeId: trainingEnrollments.employeeId,
        status: trainingEnrollments.status,
        completionDate: trainingEnrollments.completionDate,
        score: trainingEnrollments.score,
        sessionTitle: trainingSessions.title,
        sessionDate: trainingSessions.sessionDate,
        duration: trainingSessions.duration,
      })
      .from(trainingEnrollments)
      .leftJoin(trainingSessions, eq(trainingEnrollments.sessionId, trainingSessions.id))
      .where(and(
        eq(trainingEnrollments.employeeId, userId),
        eq(trainingEnrollments.status, 'completed')
      ));
      
      res.json(completedEnrollments);
    } catch (error) {
      console.error("Error fetching completed enrollments:", error);
      res.status(500).json({ message: "Failed to fetch completed enrollments" });
    }
  });

  app.get('/api/training-feedback/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const currentUser = await storage.getUser(req.user.id);
      
      // Users can only see their own feedback, unless they're admin/manager
      if (currentUser?.id !== userId && currentUser?.role !== 'hr_admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }

      const feedback = await db.select({
        id: trainingFeedback.id,
        enrollmentId: trainingFeedback.enrollmentId,
        sessionId: trainingFeedback.sessionId,
        employeeId: trainingFeedback.employeeId,
        overallRating: trainingFeedback.overallRating,
        contentRating: trainingFeedback.contentRating,
        trainerRating: trainingFeedback.trainerRating,
        relevanceRating: trainingFeedback.relevanceRating,
        comments: trainingFeedback.comments,
        suggestions: trainingFeedback.suggestions,
        submittedAt: trainingFeedback.submittedAt,
        sessionTitle: trainingSessions.title,
      })
      .from(trainingFeedback)
      .leftJoin(trainingSessions, eq(trainingFeedback.sessionId, trainingSessions.id))
      .where(eq(trainingFeedback.employeeId, userId));
      
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post('/api/training-feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const feedbackData = req.body;
      
      // Validate the enrollment belongs to the user
      const enrollment = await db.select()
        .from(trainingEnrollments)
        .where(and(
          eq(trainingEnrollments.id, feedbackData.enrollmentId),
          eq(trainingEnrollments.employeeId, userId),
          eq(trainingEnrollments.status, 'completed')
        ))
        .limit(1);
      
      if (enrollment.length === 0) {
        return res.status(403).json({ message: "Access denied or enrollment not found" });
      }
      
      // Check if feedback already exists
      const existingFeedback = await db.select()
        .from(trainingFeedback)
        .where(eq(trainingFeedback.enrollmentId, feedbackData.enrollmentId))
        .limit(1);
      
      if (existingFeedback.length > 0) {
        return res.status(409).json({ message: "Feedback already submitted for this training" });
      }

      const newFeedback = await db.insert(trainingFeedback)
        .values({
          enrollmentId: feedbackData.enrollmentId,
          sessionId: feedbackData.sessionId,
          employeeId: userId,
          overallRating: feedbackData.overallRating,
          contentRating: feedbackData.contentRating,
          trainerRating: feedbackData.trainerRating,
          relevanceRating: feedbackData.relevanceRating,
          comments: feedbackData.comments || null,
          suggestions: feedbackData.suggestions || null,
        })
        .returning();
      
      res.status(201).json(newFeedback[0]);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  // Manager effectiveness evaluation routes
  app.get('/api/manager-evaluations/pending/:managerId', isAuthenticated, async (req: any, res) => {
    try {
      const managerId = req.params.managerId;
      const currentUser = await storage.getUser(req.user.id);
      
      // Only managers and HR admins can access this
      if (currentUser?.role !== 'manager' && currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Managers can only see their department's employees
      const manager = await storage.getUser(managerId);
      if (!manager) {
        return res.status(404).json({ message: "Manager not found" });
      }

      // Get completed enrollments for employees in manager's department
      const completedEnrollments = await db.select({
        id: trainingEnrollments.id,
        sessionId: trainingEnrollments.sessionId,
        employeeId: trainingEnrollments.employeeId,
        status: trainingEnrollments.status,
        completionDate: trainingEnrollments.completionDate,
        score: trainingEnrollments.score,
        sessionTitle: trainingSessions.title,
        sessionDate: trainingSessions.sessionDate,
        duration: trainingSessions.duration,
        // category: trainingSessions.category, // Remove this line as category might not exist
        firstName: users.firstName,
        lastName: users.lastName,
        department: users.department,
        employeeIdCode: users.employeeId,
      })
      .from(trainingEnrollments)
      .leftJoin(trainingSessions, eq(trainingEnrollments.sessionId, trainingSessions.id))
      .leftJoin(users, eq(trainingEnrollments.employeeId, users.id))
      .where(and(
        eq(trainingEnrollments.status, 'completed'),
        eq(users.department, manager.department)
      ));
      
      res.json(completedEnrollments);
    } catch (error) {
      console.error("Error fetching pending evaluations:", error);
      res.status(500).json({ message: "Failed to fetch pending evaluations" });
    }
  });

  app.get('/api/effectiveness-evaluations/:managerId', isAuthenticated, async (req: any, res) => {
    try {
      const managerId = req.params.managerId;
      const currentUser = await storage.getUser(req.user.id);
      
      // Only managers and HR admins can access this
      if (currentUser?.role !== 'manager' && currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const evaluations = await db.select({
        id: effectivenessEvaluations.id,
        enrollmentId: effectivenessEvaluations.enrollmentId,
        employeeId: effectivenessEvaluations.employeeId,
        managerId: effectivenessEvaluations.managerId,
        evaluationDate: effectivenessEvaluations.evaluationDate,
        knowledgeApplication: effectivenessEvaluations.knowledgeApplication,
        behaviorChange: effectivenessEvaluations.behaviorChange,
        performanceImprovement: effectivenessEvaluations.performanceImprovement,
        complianceAdherence: effectivenessEvaluations.complianceAdherence,
        overallEffectiveness: effectivenessEvaluations.overallEffectiveness,
        comments: effectivenessEvaluations.comments,
        actionPlan: effectivenessEvaluations.actionPlan,
        followUpRequired: effectivenessEvaluations.followUpRequired,
        followUpDate: effectivenessEvaluations.followUpDate,
        createdAt: effectivenessEvaluations.createdAt,
        sessionTitle: trainingSessions.title,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(effectivenessEvaluations)
      .leftJoin(trainingSessions, eq(effectivenessEvaluations.enrollmentId, trainingSessions.id))
      .leftJoin(users, eq(effectivenessEvaluations.employeeId, users.id))
      .where(eq(effectivenessEvaluations.managerId, managerId));
      
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  app.post('/api/effectiveness-evaluations', isAuthenticated, async (req: any, res) => {
    try {
      const managerId = req.user.id;
      const evaluationData = req.body;
      const currentUser = await storage.getUser(managerId);
      
      // Only managers and HR admins can create evaluations
      if (currentUser?.role !== 'manager' && currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate the enrollment exists and is completed
      const enrollment = await db.select()
        .from(trainingEnrollments)
        .where(and(
          eq(trainingEnrollments.id, evaluationData.enrollmentId),
          eq(trainingEnrollments.status, 'completed')
        ))
        .limit(1);
      
      if (enrollment.length === 0) {
        return res.status(404).json({ message: "Enrollment not found or not completed" });
      }
      
      // Check if evaluation already exists
      const existingEvaluation = await db.select()
        .from(effectivenessEvaluations)
        .where(eq(effectivenessEvaluations.enrollmentId, evaluationData.enrollmentId))
        .limit(1);
      
      if (existingEvaluation.length > 0) {
        return res.status(409).json({ message: "Evaluation already exists for this training" });
      }

      const newEvaluation = await db.insert(effectivenessEvaluations)
        .values({
          enrollmentId: evaluationData.enrollmentId,
          employeeId: evaluationData.employeeId,
          managerId: managerId,
          evaluationDate: new Date(evaluationData.evaluationDate),
          knowledgeApplication: evaluationData.knowledgeApplication || null,
          behaviorChange: evaluationData.behaviorChange || null,
          performanceImprovement: evaluationData.performanceImprovement || null,
          complianceAdherence: evaluationData.complianceAdherence || null,
          overallEffectiveness: evaluationData.overallEffectiveness,
          comments: evaluationData.comments || null,
          actionPlan: evaluationData.actionPlan || null,
          followUpRequired: evaluationData.followUpRequired || false,
          followUpDate: evaluationData.followUpDate ? new Date(evaluationData.followUpDate) : null,
        })
        .returning();
      
      res.status(201).json(newEvaluation[0]);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      res.status(500).json({ message: "Failed to create evaluation" });
    }
  });

  // Evidence attachments routes
  app.get('/api/training-enrollments/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const currentUser = await storage.getUser(req.user.id);
      
      // Users can only see their own enrollments, unless they're admin/manager
      if (currentUser?.id !== userId && currentUser?.role !== 'hr_admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }

      const userEnrollments = await db.select({
        id: trainingEnrollments.id,
        sessionId: trainingEnrollments.sessionId,
        employeeId: trainingEnrollments.employeeId,
        status: trainingEnrollments.status,
        completionDate: trainingEnrollments.completionDate,
        score: trainingEnrollments.score,
        sessionTitle: trainingSessions.title,
        sessionDate: trainingSessions.sessionDate,
        duration: trainingSessions.duration,
      })
      .from(trainingEnrollments)
      .leftJoin(trainingSessions, eq(trainingEnrollments.sessionId, trainingSessions.id))
      .where(eq(trainingEnrollments.employeeId, userId));
      
      res.json(userEnrollments);
    } catch (error) {
      console.error("Error fetching user enrollments:", error);
      res.status(500).json({ message: "Failed to fetch user enrollments" });
    }
  });

  app.get('/api/evidence-attachments/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const currentUser = await storage.getUser(req.user.id);
      
      // Users can only see their own attachments, unless they're admin/manager
      if (currentUser?.id !== userId && currentUser?.role !== 'hr_admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }

      const attachments = await db.select({
        id: evidenceAttachments.id,
        enrollmentId: evidenceAttachments.enrollmentId,
        sessionId: evidenceAttachments.sessionId,
        fileName: evidenceAttachments.fileName,
        originalFileName: evidenceAttachments.originalFileName,
        fileSize: evidenceAttachments.fileSize,
        fileType: evidenceAttachments.fileType,
        description: evidenceAttachments.description,
        uploadedAt: evidenceAttachments.uploadedAt,
        sessionTitle: trainingSessions.title,
      })
      .from(evidenceAttachments)
      .leftJoin(trainingSessions, eq(evidenceAttachments.sessionId, trainingSessions.id))
      .where(eq(evidenceAttachments.uploadedBy, userId));
      
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  app.post('/api/evidence-attachments', isAuthenticated, upload.single('evidence'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { enrollmentId, sessionId, description } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Validate the enrollment belongs to the user
      const enrollment = await db.select()
        .from(trainingEnrollments)
        .where(and(
          eq(trainingEnrollments.id, parseInt(enrollmentId)),
          eq(trainingEnrollments.employeeId, userId)
        ))
        .limit(1);
      
      if (enrollment.length === 0) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: "Access denied or enrollment not found" });
      }

      const newAttachment = await db.insert(evidenceAttachments)
        .values({
          enrollmentId: parseInt(enrollmentId),
          sessionId: parseInt(sessionId),
          fileName: req.file.filename,
          originalFileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          filePath: req.file.path,
          description: description || null,
          uploadedBy: userId,
        })
        .returning();
      
      res.status(201).json(newAttachment[0]);
    } catch (error) {
      console.error("Error uploading attachment:", error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload attachment" });
    }
  });

  app.get('/api/evidence-attachments/download/:attachmentId', isAuthenticated, async (req: any, res) => {
    try {
      const attachmentId = parseInt(req.params.attachmentId);
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      const attachment = await db.select()
        .from(evidenceAttachments)
        .where(eq(evidenceAttachments.id, attachmentId))
        .limit(1);
      
      if (attachment.length === 0) {
        return res.status(404).json({ message: "Attachment not found" });
      }
      
      // Check access permissions
      if (attachment[0].uploadedBy !== userId && currentUser?.role !== 'hr_admin' && currentUser?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const filePath = attachment[0].filePath;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on server" });
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${attachment[0].originalFileName}"`);
      res.setHeader('Content-Type', attachment[0].fileType);
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error("Error downloading attachment:", error);
      res.status(500).json({ message: "Failed to download attachment" });
    }
  });

  app.delete('/api/evidence-attachments/:attachmentId', isAuthenticated, async (req: any, res) => {
    try {
      const attachmentId = parseInt(req.params.attachmentId);
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      const attachment = await db.select()
        .from(evidenceAttachments)
        .where(eq(evidenceAttachments.id, attachmentId))
        .limit(1);
      
      if (attachment.length === 0) {
        return res.status(404).json({ message: "Attachment not found" });
      }
      
      // Check access permissions - only uploader or admin can delete
      if (attachment[0].uploadedBy !== userId && currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete file from filesystem
      if (fs.existsSync(attachment[0].filePath)) {
        fs.unlinkSync(attachment[0].filePath);
      }
      
      // Delete record from database
      await db.delete(evidenceAttachments)
        .where(eq(evidenceAttachments.id, attachmentId));
      
      res.json({ message: "Attachment deleted successfully" });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });

  // Compliance requirements routes
  app.get('/api/compliance-requirements', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      
      // Only managers and HR admins can access this
      if (currentUser?.role !== 'manager' && currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const requirements = await db.select().from(complianceRequirements);
      res.json(requirements);
    } catch (error) {
      console.error("Error fetching compliance requirements:", error);
      res.status(500).json({ message: "Failed to fetch compliance requirements" });
    }
  });

  app.post('/api/compliance-requirements', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      
      // Only HR admins can create requirements
      if (currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const requirementData = req.body;

      const newRequirement = await db.insert(complianceRequirements)
        .values({
          standard: requirementData.standard,
          requirement: requirementData.requirement,
          description: requirementData.description || null,
          frequency: requirementData.frequency || null,
          department: requirementData.department || null,
          role: requirementData.role || null,
          trainingCatalogId: requirementData.trainingCatalogId || null,
          isActive: requirementData.isActive ?? true,
        })
        .returning();
      
      res.status(201).json(newRequirement[0]);
    } catch (error) {
      console.error("Error creating compliance requirement:", error);
      res.status(500).json({ message: "Failed to create compliance requirement" });
    }
  });

  app.put('/api/compliance-requirements/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      
      // Only HR admins can update requirements
      if (currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const requirementId = parseInt(req.params.id);
      const requirementData = req.body;

      const updatedRequirement = await db.update(complianceRequirements)
        .set({
          standard: requirementData.standard,
          requirement: requirementData.requirement,
          description: requirementData.description || null,
          frequency: requirementData.frequency || null,
          department: requirementData.department || null,
          role: requirementData.role || null,
          trainingCatalogId: requirementData.trainingCatalogId || null,
          isActive: requirementData.isActive ?? true,
        })
        .where(eq(complianceRequirements.id, requirementId))
        .returning();
      
      if (updatedRequirement.length === 0) {
        return res.status(404).json({ message: "Compliance requirement not found" });
      }
      
      res.json(updatedRequirement[0]);
    } catch (error) {
      console.error("Error updating compliance requirement:", error);
      res.status(500).json({ message: "Failed to update compliance requirement" });
    }
  });

  app.delete('/api/compliance-requirements/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      
      // Only HR admins can delete requirements
      if (currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const requirementId = parseInt(req.params.id);

      const deletedRequirement = await db.delete(complianceRequirements)
        .where(eq(complianceRequirements.id, requirementId))
        .returning();
      
      if (deletedRequirement.length === 0) {
        return res.status(404).json({ message: "Compliance requirement not found" });
      }
      
      res.json({ message: "Compliance requirement deleted successfully" });
    } catch (error) {
      console.error("Error deleting compliance requirement:", error);
      res.status(500).json({ message: "Failed to delete compliance requirement" });
    }
  });

  // Training hours reporting - Planned vs Actual
  app.get('/api/reports/training-hours', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      const { department, startDate, endDate } = req.query;
      
      // Only managers and HR admins can access reports
      if (currentUser?.role !== 'manager' && currentUser?.role !== 'hr_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Calculate planned hours from training sessions
      let plannedHoursQuery = db.select({
        totalPlannedHours: sql<number>`SUM(${trainingSessions.duration})`.as('totalPlannedHours'),
        department: users.department,
        month: sql<string>`DATE_TRUNC('month', ${trainingSessions.sessionDate})`.as('month'),
      })
      .from(trainingSessions)
      .leftJoin(trainingEnrollments, eq(trainingSessions.id, trainingEnrollments.sessionId))
      .leftJoin(users, eq(trainingEnrollments.employeeId, users.id))
      .groupBy(users.department, sql`DATE_TRUNC('month', ${trainingSessions.sessionDate})`);

      // Calculate actual hours from completed enrollments
      let actualHoursQuery = db.select({
        totalActualHours: sql<number>`SUM(${trainingSessions.duration})`.as('totalActualHours'),
        department: users.department,
        month: sql<string>`DATE_TRUNC('month', ${trainingEnrollments.completionDate})`.as('month'),
      })
      .from(trainingEnrollments)
      .leftJoin(trainingSessions, eq(trainingEnrollments.sessionId, trainingSessions.id))
      .leftJoin(users, eq(trainingEnrollments.employeeId, users.id))
      .where(eq(trainingEnrollments.status, 'completed'))
      .groupBy(users.department, sql`DATE_TRUNC('month', ${trainingEnrollments.completionDate})`);

      // Apply filters
      if (department) {
        plannedHoursQuery = plannedHoursQuery.where(eq(users.department, department as string));
        actualHoursQuery = actualHoursQuery.where(eq(users.department, department as string));
      }

      if (startDate) {
        plannedHoursQuery = plannedHoursQuery.where(sql`${trainingSessions.sessionDate} >= ${startDate}`);
        actualHoursQuery = actualHoursQuery.where(sql`${trainingEnrollments.completionDate} >= ${startDate}`);
      }

      if (endDate) {
        plannedHoursQuery = plannedHoursQuery.where(sql`${trainingSessions.sessionDate} <= ${endDate}`);
        actualHoursQuery = actualHoursQuery.where(sql`${trainingEnrollments.completionDate} <= ${endDate}`);
      }

      const [plannedHours, actualHours] = await Promise.all([
        plannedHoursQuery,
        actualHoursQuery
      ]);

      // Combine and format the data
      const reportData = {
        plannedHours,
        actualHours,
        summary: {
          totalPlanned: plannedHours.reduce((sum, item) => sum + (item.totalPlannedHours || 0), 0),
          totalActual: actualHours.reduce((sum, item) => sum + (item.totalActualHours || 0), 0),
        }
      };

      reportData.summary.completionRate = reportData.summary.totalPlanned > 0 
        ? (reportData.summary.totalActual / reportData.summary.totalPlanned * 100) 
        : 0;

      res.json(reportData);
    } catch (error) {
      console.error("Error generating training hours report:", error);
      res.status(500).json({ message: "Failed to generate training hours report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
