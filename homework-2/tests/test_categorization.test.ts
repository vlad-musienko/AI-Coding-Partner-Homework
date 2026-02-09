/**
 * Classification Tests
 * Tests for automatic ticket categorization and priority assignment
 */

import {classifyTicket} from '../src/services/classificationService';

describe('Ticket Classification', () => {
    describe('Category Detection', () => {
        it('should classify account access issues', () => {
            const result = classifyTicket(
                'Cannot login to account',
                'I forgot my password and cannot access my account'
            );

            expect(result.category).toBe('account_access');
            expect(result.keywords_found.length).toBeGreaterThan(0);
        });

        it('should classify technical issues', () => {
            const result = classifyTicket(
                'Application crashes',
                'The app crashes every time I try to open it. Getting error messages.'
            );

            expect(result.category).toBe('technical_issue');
        });

        it('should classify billing questions', () => {
            const result = classifyTicket(
                'Question about invoice',
                'I need a refund for the payment that was charged to my credit card'
            );

            expect(result.category).toBe('billing_question');
        });

        it('should classify feature requests', () => {
            const result = classifyTicket(
                'Feature suggestion',
                'It would be nice if you could add support for dark mode'
            );

            expect(result.category).toBe('feature_request');
        });

        it('should classify bug reports', () => {
            const result = classifyTicket(
                'Bug in search',
                'Steps to reproduce: 1. Open search 2. Enter query 3. No results. Expected: Should show results.'
            );

            expect(result.category).toBe('bug_report');
        });

        it('should default to other for unclear tickets', () => {
            const result = classifyTicket(
                'General question',
                'Just wondering about something'
            );

            expect(result.category).toBe('other');
        });
    });

    describe('Priority Detection', () => {
        it('should assign urgent priority for critical issues', () => {
            const result = classifyTicket(
                'Production down',
                'Critical issue - production environment is completely down and customers cannot access the service'
            );

            expect(result.priority).toBe('urgent');
        });

        it('should assign high priority for important issues', () => {
            const result = classifyTicket(
                'Important issue',
                'This is blocking our work and we need help asap'
            );

            expect(result.priority).toBe('high');
        });

        it('should assign low priority for minor issues', () => {
            const result = classifyTicket(
                'Minor cosmetic issue',
                'There is a small cosmetic problem that would be nice to fix eventually'
            );

            expect(result.priority).toBe('low');
        });

        it('should default to medium priority', () => {
            const result = classifyTicket(
                'General question',
                'I have a question about how to use a feature'
            );

            expect(result.priority).toBe('medium');
        });
    });

    describe('Confidence Scoring', () => {
        it('should have higher confidence with more keyword matches', () => {
            const result = classifyTicket(
                'Cannot login - password reset not working',
                'I cannot access my account because the password reset link is not working and I am locked out'
            );

            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('should provide reasoning for classification', () => {
            const result = classifyTicket(
                'Login issue',
                'Cannot access account'
            );

            expect(result.reasoning).toBeDefined();
            expect(result.reasoning.length).toBeGreaterThan(0);
        });
    });
});
