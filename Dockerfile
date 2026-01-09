# ============================================
# Stage 1: Dependencies and Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
COPY backend/prisma.config.ts ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY backend/ .

# Build the NestJS application
RUN npm run build

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files for production dependency installation
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
COPY backend/prisma.config.ts ./

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma Client for production
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Run migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
