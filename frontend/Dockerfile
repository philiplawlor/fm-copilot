# Production stage - Use pre-built application from host
FROM nginx:alpine

# Copy built application from host
COPY dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d

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
