# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package configuration files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prefer-offline

# Copy the rest of the application code
COPY . .

# Set environment variable for production build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
RUN pnpm build

# Run stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy package file and install production dependencies only
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile --prefer-offline

# Copy public files and built assets from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose port
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
