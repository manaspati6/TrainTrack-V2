import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage-simple";
import { setupAuth, isAuthenticated } from "./auth";
import {
  insertTrainingCatalogSchema,
  insertTrainingSessionSchema,
  insertTrainingEnrollmentSchema,
  insertTrainingFeedbackSchema,
  insertEffectivenessEvaluationSchema,
  insertUserSchema,
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
      const validatedData = insertTrainingCatalogSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const newCatalog = await storage.createTrainingCatalog(validatedData);
      
      // TODO: Add audit log when needed
      
      res.status(201).json(newCatalog);
    } catch (error) {
      console.error("Error creating training catalog:", error);
      res.status(400).json({ message: "Failed to create training catalog" });
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

  const httpServer = createServer(app);
  return httpServer;
}
