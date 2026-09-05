# Use the official Node.js 20 image (Debian Bookworm) as the base
FROM node:20-bookworm

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install project dependencies cleanly
RUN npm ci

# Install Playwright and its browser dependencies (Chromium)
# This is necessary because Crawlee requires a browser to scrape pages
RUN npx playwright install --with-deps chromium

# Copy the rest of the application files to the working directory
COPY . .

# Set default environment variable for port
ENV PORT=3000

# Expose port 3000 so the Express app can be accessed from outside the container
EXPOSE 3000

# Start the Node.js application
CMD ["npm", "start"]
