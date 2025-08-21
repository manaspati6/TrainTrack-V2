# Overview

ManufacTMS is a comprehensive Training Management System designed specifically for manufacturing environments. The application provides compliance training management, certification tracking, audit requirement management, and regulatory compliance reporting. It features a modern web interface built with React and TypeScript, backed by a Node.js/Express server with PostgreSQL database storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints with centralized route registration
- **File Uploads**: Multer middleware for handling training materials and documentation
- **Session Management**: Express sessions with PostgreSQL storage
- **Error Handling**: Centralized error handling middleware with structured error responses

## Database Architecture
- **Database**: PostgreSQL with Neon serverless connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Code-first schema definition with migration support
- **Tables**: Comprehensive schema including users, training catalog, sessions, enrollments, feedback, compliance requirements, audit logs, and evidence attachments
- **Relationships**: Proper foreign key relationships between entities for data integrity

## Authentication & Authorization
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Security**: HTTP-only cookies with secure settings for production
- **User Management**: Role-based access control (employee, manager, hr_admin)
- **Token Handling**: Automatic token refresh and session management

## File Management
- **Storage**: Local file system storage in uploads directory
- **File Types**: Support for documents (PDF, DOC, DOCX), presentations (PPT, PPTX), and images
- **Size Limits**: 10MB maximum file size with type validation
- **Organization**: Timestamped file naming for uniqueness

## Development Environment
- **Hot Reload**: Vite HMR for instant development feedback
- **Error Overlay**: Runtime error modal for debugging
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Path Aliases**: Configured import aliases for clean code organization

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Connection**: WebSocket-based connections for serverless compatibility

## Authentication Services
- **Replit Auth**: OpenID Connect identity provider
- **Session Store**: PostgreSQL session storage with automatic cleanup

## UI Libraries
- **Radix UI**: Headless UI primitives for accessibility and behavior
- **Lucide React**: Consistent icon library
- **React Hook Form**: Form state management with validation
- **Date-fns**: Date manipulation and formatting utilities

## Development Tools
- **Vite Plugins**: React support, runtime error overlay, and Replit-specific tooling
- **Drizzle Kit**: Database migration and schema management tools
- **TypeScript**: Static type checking and IntelliSense support

## Production Dependencies
- **Express Middleware**: CORS, body parsing, static file serving
- **Security**: Helmet for security headers, session security configuration
- **File Processing**: Multer for multipart form data handling
- **Query Client**: TanStack Query for efficient data fetching and caching