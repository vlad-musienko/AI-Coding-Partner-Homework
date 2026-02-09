/**
 * Server Entry Point
 * Starts the Express server
 */

import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Start Server
 */
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🎧 Customer Support System API');
  console.log('='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));
  console.log('\nAvailable endpoints:');
  console.log(`  GET    http://localhost:${PORT}/`);
  console.log(`  POST   http://localhost:${PORT}/tickets`);
  console.log(`  POST   http://localhost:${PORT}/tickets/import`);
  console.log(`  GET    http://localhost:${PORT}/tickets`);
  console.log(`  GET    http://localhost:${PORT}/tickets/:id`);
  console.log(`  PUT    http://localhost:${PORT}/tickets/:id`);
  console.log(`  DELETE http://localhost:${PORT}/tickets/:id`);
  console.log(`  POST   http://localhost:${PORT}/tickets/:id/auto-classify`);
  console.log('='.repeat(60));
});
