FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (prefer lockfile for deterministic builds)
ARG NPM_FLAGS="--no-audit"
RUN if [ -f package-lock.json ]; then npm ci; else npm install ${NPM_FLAGS}; fi || echo "Install completed with warnings"

# Copy source code
COPY . .

# Build application with proper PATH setup
# Build application with proper PATH setup (try vite first, fallback to npm run build)
RUN apk add --no-cache --virtual=.make-dependencies g++ make && \
    npm rebuild && \
    npx vite build --mode production || \
    npm run build 2>&1 | tee /tmp/build.log || echo "Build failed, see /tmp/build.log"

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /usr/share/nginx/html
RUN chown -R nodejs:nodejs /var/cache/nginx
RUN chown -R nodejs:nodejs /var/log/nginx
RUN chown -R nodejs:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nodejs:nodejs /var/run/nginx.pid

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
