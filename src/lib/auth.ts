import { createHash } from 'node:crypto';

// Helper function to hash password
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Helper function to verify password
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const passwordHash = hashPassword(password);
  return passwordHash === hashedPassword;
}

// Function to generate a unique token
export function generateToken(length = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  for (let i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return token;
}

// Generate an expiry date (default: 30 days from now)
export function generateExpiryDate(days = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
