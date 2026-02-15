/**
 * Import Service Tests
 * Tests for the import orchestration service
 */

import {detectFileFormat, importTickets} from '../src/services/importService';
import {ticketService} from '../src/services/ticketService';

describe('Import Service', () => {
    beforeEach(() => {
        ticketService.clear();
    });

    describe('File Format Detection', () => {
        it('should detect CSV format from extension', () => {
            const format = detectFileFormat('tickets.csv');
            expect(format).toBe('csv');
        });

        it('should detect JSON format from extension', () => {
            const format = detectFileFormat('tickets.json');
            expect(format).toBe('json');
        });

        it('should detect XML format from extension', () => {
            const format = detectFileFormat('tickets.xml');
            expect(format).toBe('xml');
        });

        it('should detect format from content type', () => {
            const format = detectFileFormat('data.txt', 'text/csv');
            expect(format).toBe('csv');
        });

        it('should throw error for unsupported format', () => {
            expect(() => detectFileFormat('tickets.pdf')).toThrow();
        });
    });

    describe('Import Tickets', () => {
        it('should import valid CSV tickets', async () => {
            const csvContent = `customer_id,customer_email,customer_name,subject,description,source
CUST001,test@example.com,Test User,Subject,This is a description,web_form`;

            const result = await importTickets(csvContent, 'csv');
            expect(result.successful).toBe(1);
            expect(result.failed).toBe(0);
        });

        it('should return errors for invalid tickets', async () => {
            const csvContent = `customer_id,customer_email,customer_name,subject,description,source
CUST001,invalid-email,Test User,Subject,Short,web_form`;

            const result = await importTickets(csvContent, 'csv');
            expect(result.failed).toBeGreaterThan(0);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should handle parsing errors', async () => {
            const invalidJson = '{ invalid json }';

            const result = await importTickets(invalidJson, 'json');
            expect(result.total).toBe(0);
            expect(result.failed).toBe(1);
            expect(result.errors.length).toBe(1);
        });

        it('should auto-classify when requested', async () => {
            const csvContent = `customer_id,customer_email,customer_name,subject,description,source
CUST001,test@example.com,Test User,Cannot login,I forgot my password,web_form`;

            const result = await importTickets(csvContent, 'csv', true);
            expect(result.successful).toBe(1);
        });
    });
});
