import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

const logDir = 'logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp({ 
      format: () => {
        return new Date().toISOString().substr(11, 8); // Extract HH:mm:ss from UTC ISO string
      }
    }),
    winston.format.splat()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      utc: true,
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'debug',
      format: winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    }),
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
    }),
  ],
});

export default logger;
