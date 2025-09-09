import fs from 'fs';
import path from 'path';

const LOG_DIR = './logs';

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const log = (level, message, metadata = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...metadata
  };
  
  // Console log
  const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`);
  
  // File log (only in production)
  if (process.env.NODE_ENV === 'production') {
    const logFile = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }
};

export const logger = {
  info: (message, metadata) => log('info', message, metadata),
  warn: (message, metadata) => log('warn', message, metadata),
  error: (message, metadata) => log('error', message, metadata),
  success: (message, metadata) => log('success', message, metadata)
};