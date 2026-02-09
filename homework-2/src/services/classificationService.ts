/**
 * Classification Service
 * Automatic ticket categorization and priority assignment based on keywords
 */

import { TicketCategory, TicketPriority, ClassificationResult } from '../models/ticket';
import { logClassification } from '../utils/logger';

// Keyword mappings for categories
const CATEGORY_KEYWORDS: Record<TicketCategory, string[]> = {
  account_access: [
    'login', 'password', '2fa', 'two factor', 'sign in', 'locked out', 
    'authentication', 'cant access', "can't access", 'forgot password',
    'reset password', 'account locked', 'verify account'
  ],
  technical_issue: [
    'error', 'crash', 'bug', 'not working', 'broken', 'slow', 'freeze',
    'loading', 'timeout', 'connection', 'failed', 'issue', 'problem'
  ],
  billing_question: [
    'payment', 'invoice', 'refund', 'charge', 'subscription', 'billing',
    'credit card', 'receipt', 'transaction', 'price', 'cost', 'fee'
  ],
  feature_request: [
    'feature', 'suggest', 'enhance', 'wish', 'would be nice', 'add support',
    'improvement', 'request', 'could you', 'please add', 'new feature'
  ],
  bug_report: [
    'reproduce', 'steps to reproduce', 'defect', 'regression', 'expected',
    'actual', 'consistently', 'always happens', 'every time'
  ],
  other: []
};

// Keyword mappings for priorities
const PRIORITY_KEYWORDS: Record<Exclude<TicketPriority, 'medium'>, string[]> = {
  urgent: [
    "can't access", "cant access", "cannot access", 'critical', 'production down', 'security',
    'data loss', 'outage', 'emergency', 'immediately', 'urgent',
    'down', 'not working at all', 'completely broken'
  ],
  high: [
    'important', 'blocking', 'asap', 'soon', 'priority', 'need help',
    'affecting multiple', 'business critical'
  ],
  low: [
    'minor', 'cosmetic', 'suggestion', 'nice to have', 'eventually',
    'when you can', 'not urgent', 'low priority'
  ]
};

/**
 * Classify a ticket based on its subject and description
 */
export function classifyTicket(subject: string, description: string): ClassificationResult {
  const combinedText = `${subject} ${description}`.toLowerCase();
  
  // Detect category
  const categoryResult = detectCategory(combinedText);
  
  // Detect priority
  const priorityResult = detectPriority(combinedText);
  
  // Calculate overall confidence (average of both confidences)
  const confidence = (categoryResult.confidence + priorityResult.confidence) / 2;
  
  // Generate reasoning
  const reasoning = generateReasoning(categoryResult, priorityResult);
  
  // Combine keywords found
  const keywords_found = [...categoryResult.keywords, ...priorityResult.keywords];
  
  const result: ClassificationResult = {
    category: categoryResult.category,
    priority: priorityResult.priority,
    confidence,
    reasoning,
    keywords_found
  };
  
  // Log the classification decision
  logClassification(subject, result);
  
  return result;
}

/**
 * Detect category from text
 */
function detectCategory(text: string): {
  category: TicketCategory;
  confidence: number;
  keywords: string[];
} {
  const matches: { category: TicketCategory; count: number; keywords: string[] }[] = [];
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue;
    
    const foundKeywords: string[] = [];
    let count = 0;
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
        count++;
      }
    }
    
    if (count > 0) {
      matches.push({
        category: category as TicketCategory,
        count,
        keywords: foundKeywords
      });
    }
  }
  
  // If no matches, return 'other'
  if (matches.length === 0) {
    return {
      category: 'other',
      confidence: 0.3,
      keywords: []
    };
  }
  
  // Sort by count and return the best match
  matches.sort((a, b) => b.count - a.count);
  const best = matches[0];
  
  // Calculate confidence based on number of keyword matches
  // More matches = higher confidence, capped at 0.95
  const confidence = Math.min(0.5 + (best.count * 0.15), 0.95);
  
  return {
    category: best.category,
    confidence,
    keywords: best.keywords
  };
}

/**
 * Detect priority from text
 */
function detectPriority(text: string): {
  priority: TicketPriority;
  confidence: number;
  keywords: string[];
} {
  const matches: { priority: TicketPriority; count: number; keywords: string[] }[] = [];
  
  // Check each priority's keywords
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    const foundKeywords: string[] = [];
    let count = 0;
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
        count++;
      }
    }
    
    if (count > 0) {
      matches.push({
        priority: priority as TicketPriority,
        count,
        keywords: foundKeywords
      });
    }
  }
  
  // If no matches, return 'medium' as default
  if (matches.length === 0) {
    return {
      priority: 'medium',
      confidence: 0.6,
      keywords: []
    };
  }
  
  // Sort by count and return the best match
  matches.sort((a, b) => b.count - a.count);
  const best = matches[0];
  
  // Calculate confidence based on number of keyword matches
  const confidence = Math.min(0.5 + (best.count * 0.15), 0.95);
  
  return {
    priority: best.priority,
    confidence,
    keywords: best.keywords
  };
}

/**
 * Generate human-readable reasoning for the classification
 */
function generateReasoning(
  categoryResult: { category: TicketCategory; keywords: string[] },
  priorityResult: { priority: TicketPriority; keywords: string[] }
): string {
  const parts: string[] = [];
  
  if (categoryResult.keywords.length > 0) {
    parts.push(
      `Categorized as '${categoryResult.category}' based on keywords: ${categoryResult.keywords.slice(0, 3).join(', ')}`
    );
  } else {
    parts.push(`Categorized as '${categoryResult.category}' (no specific keywords found)`);
  }
  
  if (priorityResult.keywords.length > 0) {
    parts.push(
      `Priority set to '${priorityResult.priority}' based on keywords: ${priorityResult.keywords.slice(0, 3).join(', ')}`
    );
  } else {
    parts.push(`Priority set to '${priorityResult.priority}' (default)`);
  }
  
  return parts.join('. ') + '.';
}
