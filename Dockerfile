FROM oven/bun:latest

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
COPY bun.lock ./
RUN bun install

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build the Next.js application
RUN bun run build

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]
