// Test setup file
// This file runs before each test file

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

// Global test utilities can be added here
