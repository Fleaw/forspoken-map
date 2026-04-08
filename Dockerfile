# Use a lightweight Node image
FROM node:24-alpine

# Create app directory
WORKDIR /app

# Install dependencies only when package.json changes
COPY src/WebApp/package*.json ./

RUN npm ci

# Copy the rest of the project (optional for dev, required for build)
COPY src/WebApp/ .

# Expose Vite dev server port
EXPOSE 5173

# Default command (overridden by docker-compose)
CMD ["npm", "run", "dev", "--", "--host"]