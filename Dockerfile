FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Vite's default port
EXPOSE 5173

# Start Vite with the host flag to expose it outside the container
CMD ["npm", "run", "dev", "--", "--host"]