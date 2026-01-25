// Main Server Entry Point
// Uses modular configuration for better maintainability

const { initializeServer } = require('./server-config');

// Initialize and start the server
initializeServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});