FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Expose port 3000 (React dev server default)
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]
