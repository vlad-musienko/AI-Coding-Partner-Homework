/**
 * Logger Utility
 * Logs classification decisions for auditing
 */

import { ClassificationResult } from '../models/ticket';

export interface ClassificationLog {
  timestamp: Date;
  subject: string;
  result: ClassificationResult;
}

// In-memory storage for classification logs
const classificationLogs: ClassificationLog[] = [];

/**
 * Log a classification decision
 */
export function logClassification(subject: string, result: ClassificationResult): void {
  const log: ClassificationLog = {
    timestamp: new Date(),
    subject,
    result
  };
  
  classificationLogs.push(log);
  
  // Console log for development
  console.log(`[CLASSIFICATION] ${subject} -> ${result.category} (${result.priority}) [confidence: ${result.confidence.toFixed(2)}]`);
}

/**
 * Get all classification logs
 */
export function getClassificationLogs(): ClassificationLog[] {
  return [...classificationLogs];
}

/**
 * Get recent classification logs (last N entries)
 */
export function getRecentClassificationLogs(count: number = 10): ClassificationLog[] {
  return classificationLogs.slice(-count);
}

/**
 * Clear all classification logs (useful for testing)
 */
export function clearClassificationLogs(): void {
  classificationLogs.length = 0;
}

/**
 * Get classification logs for a specific subject
 */
export function getClassificationLogsBySubject(subject: string): ClassificationLog[] {
  return classificationLogs.filter(log => 
    log.subject.toLowerCase().includes(subject.toLowerCase())
  );
}
