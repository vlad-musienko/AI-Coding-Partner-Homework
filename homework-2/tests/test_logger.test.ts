/**
 * Logger Tests
 * Tests for classification logging utility
 */

import {
    logClassification,
    getClassificationLogs,
    getRecentClassificationLogs,
    clearClassificationLogs,
    getClassificationLogsBySubject
} from '../src/utils/logger';
import {ClassificationResult} from '../src/models/ticket';

describe('Logger Utility', () => {
    beforeEach(() => {
        clearClassificationLogs();
    });

    it('should log classification decisions', () => {
        const result: ClassificationResult = {
            category: 'account_access',
            priority: 'high',
            confidence: 0.85,
            reasoning: 'Test reasoning',
            keywords_found: ['login', 'password']
        };

        logClassification('Test Subject', result);

        const logs = getClassificationLogs();
        expect(logs.length).toBe(1);
        expect(logs[0].subject).toBe('Test Subject');
        expect(logs[0].result.category).toBe('account_access');
    });

    it('should get recent classification logs', () => {
        const result: ClassificationResult = {
            category: 'technical_issue',
            priority: 'medium',
            confidence: 0.75,
            reasoning: 'Test',
            keywords_found: []
        };

        for (let i = 0; i < 15; i++) {
            logClassification(`Subject ${i}`, result);
        }

        const recent = getRecentClassificationLogs(5);
        expect(recent.length).toBe(5);
    });

    it('should filter logs by subject', () => {
        const result: ClassificationResult = {
            category: 'billing_question',
            priority: 'low',
            confidence: 0.65,
            reasoning: 'Test',
            keywords_found: []
        };

        logClassification('Login Issue', result);
        logClassification('Billing Question', result);
        logClassification('Another Login Problem', result);

        const loginLogs = getClassificationLogsBySubject('login');
        expect(loginLogs.length).toBe(2);
    });

    it('should clear all logs', () => {
        const result: ClassificationResult = {
            category: 'other',
            priority: 'medium',
            confidence: 0.5,
            reasoning: 'Test',
            keywords_found: []
        };

        logClassification('Test', result);
        expect(getClassificationLogs().length).toBe(1);

        clearClassificationLogs();
        expect(getClassificationLogs().length).toBe(0);
    });
});
