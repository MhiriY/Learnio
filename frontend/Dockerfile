# Development Dockerfile for Frontend
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for hot reload)
RUN npm ci

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=development
ENV HOSTNAME=0.0.0.0

# Start development server with hot reload
CMD ["npm", "run", "dev"]

