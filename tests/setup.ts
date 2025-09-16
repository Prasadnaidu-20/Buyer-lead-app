// Test setup file
// This file runs before each test file

// Mock environment variables
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'file:./test.db'
});

// Global test utilities can be added here
