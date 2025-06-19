# Decentralized Identity (DID) and Verifiable Credentials Platform

## Overview

This is a full-stack web application for managing Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs). The system provides a complete solution for creating, managing, and verifying digital identities using cryptographic standards and W3C specifications.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Cryptography**: Noble curves library for Ed25519 and secp256k1 operations
- **Session Management**: Express sessions with PostgreSQL store

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared TypeScript schemas and types
├── migrations/      # Database migration files
└── dist/           # Production build output
```

## Key Components

### Database Layer
- **DIDs Table**: Stores decentralized identifiers with cryptographic key pairs
- **Verifiable Credentials Table**: Stores issued credentials with claims and proofs
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Schema Validation**: Zod schemas for runtime type checking

### Cryptographic Services
- **DID Generation**: Support for `did:key` method with Ed25519 and secp256k1 curves
- **Digital Signatures**: Cryptographic signing and verification for credentials
- **Key Management**: Secure storage and retrieval of public/private key pairs

### API Endpoints
- `POST /api/register` - Register new DIDs with cryptographic key generation
- `POST /api/issue` - Issue verifiable credentials to DID subjects
- `POST /api/verify` - Verify credential authenticity and integrity
- `GET /api/stats` - System statistics and metrics

### Storage Strategy
- **Development**: In-memory storage for rapid prototyping
- **Production**: PostgreSQL database with connection pooling
- **Migration Support**: Drizzle Kit for schema management

## Data Flow

1. **DID Registration**: Generate cryptographic key pairs and create DID documents
2. **Credential Issuance**: Create signed verifiable credentials with claims
3. **Credential Verification**: Validate signatures and check credential integrity
4. **Data Persistence**: Store DIDs and credentials in PostgreSQL database

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **@noble/curves**: Cryptographic operations for Ed25519/secp256k1
- **drizzle-orm**: Type-safe database ORM
- **jose**: JSON Web Token operations
- **uuid**: Unique identifier generation

### UI Dependencies
- **@radix-ui/react-***: Accessible component primitives
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev`
- **Port**: 5000
- **Hot Reload**: Vite HMR for frontend, tsx for backend
- **Database**: PostgreSQL container or local instance

### Production Build
- **Frontend**: Vite production build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Start Command**: `npm run start`
- **Platform**: Replit Autoscale deployment

### Database Management
- **Migrations**: `npm run db:push` for schema updates
- **Environment**: `DATABASE_URL` environment variable required
- **Provider**: Supports Neon, Supabase, or any PostgreSQL instance

## Changelog

```
Changelog:
- June 19, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```