FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app
COPY . .

# Build frontend (if not pre-built)
RUN cd frontend && npm install && npx vite build && cd ..

# Expose port
EXPOSE 3000

# Run
CMD ["node", "index.js"]
