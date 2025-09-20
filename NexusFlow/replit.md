# Overview

This is a full-stack social networking platform called "Nexus Network" built with a modern TypeScript stack. The application enables users to create communities, share posts, organize events, and interact through a comprehensive social media interface. It features role-based access control with different user types (admin, staff, community leads, volunteers, and regular users) and provides dedicated dashboards for administrative functions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for the UI layer
- **Vite** as the build tool and development server
- **Wouter** for client-side routing instead of React Router
- **TanStack Query** for server state management and API caching
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for styling with custom design tokens
- **CSS Variables** for theming support (dark/light themes)

## Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with organized route handlers
- **Session-based authentication** using express-session
- **PostgreSQL sessions storage** with connect-pg-simple
- **Role-based access control** middleware for route protection
- **Structured error handling** with centralized error middleware

## Database Layer
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** as the primary database (configured for Neon)
- **Schema-first design** with strict TypeScript integration
- **Enum types** for user roles, RSVP statuses, and community roles
- **Relational data modeling** for users, communities, posts, events, and interactions

## Authentication System
- **Replit Auth integration** using OpenID Connect
- **Passport.js** strategy for authentication flow
- **Session management** with PostgreSQL storage
- **JWT token handling** for user claims and roles
- **Automatic login redirects** for unauthorized access

## State Management
- **TanStack Query** for server state caching and synchronization
- **React Context** for theme management
- **Local component state** for UI interactions and form handling
- **Query invalidation patterns** for real-time data updates

## UI Component System
- **Atomic design principles** with reusable components
- **Compound component patterns** for complex UI elements
- **Accessible components** using Radix UI primitives
- **Responsive design** with mobile-first approach
- **Loading states and skeletons** for better UX

## Data Flow Patterns
- **Optimistic updates** for like/RSVP interactions
- **Real-time feedback** through toast notifications
- **Progressive data loading** with skeleton states
- **Error boundaries** and graceful error handling

# External Dependencies

## Database Services
- **Neon Database** - Serverless PostgreSQL hosting
- **@neondatabase/serverless** - Database connection pooling

## Authentication
- **Replit Authentication** - OAuth provider integration
- **OpenID Connect** - Identity verification protocol

## UI Libraries
- **Radix UI** - Headless component primitives for accessibility
- **Lucide React** - Icon library for consistent iconography
- **class-variance-authority** - Utility for component variant styling
- **date-fns** - Date manipulation and formatting

## Development Tools
- **TypeScript** - Static type checking
- **ESBuild** - Fast JavaScript bundler for production
- **PostCSS & Autoprefixer** - CSS processing pipeline
- **Replit Plugins** - Development environment integration

## Runtime Dependencies
- **ws** - WebSocket client for database connections
- **memoizee** - Function memoization for performance
- **nanoid** - Unique ID generation
- **zod** - Runtime type validation and schema parsing