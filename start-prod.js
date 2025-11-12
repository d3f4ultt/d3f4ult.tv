#!/usr/bin/env node
// Force production environment before loading the app
process.env.NODE_ENV = 'production';

// Import and run the main application
import('./dist/index.js');
