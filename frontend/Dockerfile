FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with workarounds for npm issues
RUN npm install --no-optional || true && \
    npm cache clean --force || true

# Copy source code
COPY . .

# Build application using Vite with proper Node setup
RUN apk add --no-cache nodejs npm && \
    npm install --global vite && \
    npm config set prefix /usr/local && \
    npm cache clean --force

# Set proper environment for Vite
ENV NODE_ENV=production
ENV VITE_API_URL=http://backend:8000/api

# Build application
RUN npm run build

# Copy source code
COPY . .

# Build application using the working setup
RUN npm run build || \
    npm run build --verbose

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