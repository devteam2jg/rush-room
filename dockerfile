# Use the official Node.js 22 image as the base image
FROM node:22

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the application code
COPY . .


# Copy environment variables file
COPY .env .env

# Expose the port the app runs on
EXPOSE 3000
RUN pnpm build
# Command to run the application
CMD ["pnpm", "run", "start:prod"]