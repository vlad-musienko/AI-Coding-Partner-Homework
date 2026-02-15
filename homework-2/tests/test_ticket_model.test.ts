/**
 * Ticket Model Validation Tests
 * Tests for Zod schema validation
 */

import {validateCreateTicket, validateUpdateTicket} from '../src/validators/ticketValidator';

describe('Ticket Model Validation', () => {
    describe('Email Validation', () => {
        it('should accept valid email addresses', () => {
            const data = {
                customer_id: 'CUST001',
                customer_email: 'valid@example.com',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'This is a valid description',
                metadata: {source: 'web_form'}
            };

            const result = validateCreateTicket(data);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email addresses', () => {
            const data = {
                customer_id: 'CUST001',
                customer_email: 'invalid-email',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'This is a valid description',
                metadata: {source: 'web_form'}
            };

            const result = validateCreateTicket(data);
            expect(result.success).toBe(false);
        });

        it('should reject missing email', () => {
            const data = {
                customer_id: 'CUST001',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'This is a valid description',
                metadata: {source: 'web_form'}
            };

            const result = validateCreateTicket(data);
            expect(result.success).toBe(false);
        });
    });

    describe('String Length Validation', () => {
        it('should accept subject within length limits', () => {
            const data = {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'A'.repeat(200),
                description: 'This is a valid description',
                metadata: {source: 'web_form'}
            };

            const result = validateCreateTicket(data);
            expect(result.success).toBe(true);
        });

        it('should reject subject exceeding 200 characters', () => {
            const data = {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'A'.repeat(201),
                description: 'This is a valid description',
                metadata: {source: 'web_form'}
            };

            const result = validateCreateTicket(data);
            expect(result.success).toBe(false);
        });

        it('should reject description shorter than 10 characters', () => {
            const data = {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'Short',
                metadata: {source: 'web_form'}
            };

            const result = validateCreateTicket(data);
            expect(result.success).toBe(false);
        });

        it('should reject description exceeding 2000 characters', () => {
            const data = {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'A'.repeat(2001),
                metadata: {source: 'web_form'}
            };

            const result = validateCreateTicket(data);
            expect(result.success).toBe(false);
        });
    });

    describe('Enum Validation', () => {
        it('should accept valid category', () => {
            const data = {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'This is a valid description',
                category: 'billing_question',
                metadata: {source: 'web_form'}
            };

            const result = validateCreateTicket(data);
            expect(result.success).toBe(true);
        });

        it('should reject invalid category', () => {
            const data = {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'This is a valid description',
                category: 'invalid_category',
                metadata: {source: 'web_form'}
            };

            const result = validateCreateTicket(data);
            expect(result.success).toBe(false);
        });

        it('should reject invalid priority', () => {
            const data = {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'This is a valid description',
                priority: 'super_urgent',
                metadata: {source: 'web_form'}
            };

            const result = validateCreateTicket(data);
            expect(result.success).toBe(false);
        });
    });
});
