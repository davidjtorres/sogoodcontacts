# Dockerfile
# Use the official Node.js image as a base
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV MONGODB_DATABASE=sogoodcontacts
ENV CONSTANT_CONTACT_API_URL=https://api.cc.email/v3
ENV MONGODB_URI=mongodb://mongo:27017
ENV AUTH_USER_ID=67cf575d562cd26f0c2ffe49

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "run", "dev"]