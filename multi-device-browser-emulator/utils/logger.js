/**
 * Logging Utility
 * Simple logger for tracking sessions
 */

const fs   = require('fs');
const path = require('path');

class Logger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.ensureLogDir();
    this.sessionLog = [];
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry  = {
      timestamp,
      level,
      message,
      ...data
    };

    this.sessionLog.push(logEntry);
    
    const logString = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logString);
    
    if (data && Object.keys(data).length > 0) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  success(message, data) {
    this.log('success', message, data);
  }

  saveSession(sessionId) {
    const filename = `session_${sessionId}_${Date.now()}.json`;
    const filepath = path.join(this.logDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.sessionLog, null, 2));
    console.log(`\n📝 Session log saved: ${filepath}`);
    
    return filepath;
  }

  getSessionSummary() {
    const summary = {
      totalEntries: this.sessionLog.length,
      errors: this.sessionLog.filter(entry => entry.level === 'error').length,
      warnings: this.sessionLog.filter(entry => entry.level === 'warn').length,
      duration: null
    };

    if (this.sessionLog.length > 0) {
      const start = new Date(this.sessionLog[0].timestamp);
      const end = new Date(this.sessionLog[this.sessionLog.length - 1].timestamp);
      summary.duration = ((end - start) / 1000).toFixed(2) + 's';
    }

    return summary;
  }
}

module.exports = Logger;

