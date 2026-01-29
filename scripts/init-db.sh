#!/bin/bash

# Wait for the database to be ready
echo "Waiting for database..."
sleep 5

# Run Prisma migrations
echo "Running Prisma migrations..."
cd /app && npx prisma migrate deploy

# Seed the database
echo "Seeding database..."
cd /app && npm run db:seed

echo "Database initialization complete!"
