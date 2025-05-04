#!/bin/bash

# Script for deploying the Phone Export System

echo "🚀 Starting deployment process..."

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Generate Prisma client
echo "🔄 Generating Prisma client..."
bunx prisma generate

# Build the Next.js application
echo "🏗️ Building the application..."
bun run build

# Apply database migrations
echo "🗃️ Applying database migrations..."
bunx prisma migrate deploy

# Seed the database
echo "🌱 Seeding the database..."
bunx prisma db seed

echo "✅ Deployment completed successfully!"
echo "You can start the application with: bun run start"
