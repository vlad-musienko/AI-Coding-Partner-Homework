/**
 * CSV Import Tests
 * Tests for CSV file parsing
 */

import {parseCSV} from '../src/parsers/csvParser';
import * as fs from 'fs';
import * as path from 'path';

describe('CSV Import', () => {
    it('should parse valid CSV file', () => {
        const csvContent = fs.readFileSync(
            path.join(__dirname, 'fixtures/sample_tickets.csv'),
            'utf-8'
        );

        const result = parseCSV(csvContent);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].data.customer_email).toBeDefined();
        expect(result[0].data.subject).toBeDefined();
    });

    it('should handle CSV with missing columns', () => {
        const csvContent = `customer_id,customer_email
CUST001,test@example.com`;

        const result = parseCSV(csvContent);
        expect(result.length).toBe(1);
        expect(result[0].data.customer_id).toBe('CUST001');
        expect(result[0].data.subject).toBeUndefined();
    });

    it('should handle empty CSV file', () => {
        const csvContent = `customer_id,customer_email,customer_name,subject,description,source`;

        const result = parseCSV(csvContent);
        expect(result.length).toBe(0);
    });

    it('should parse tags from comma-separated string', () => {
        const csvContent = `customer_id,customer_email,customer_name,subject,description,tags,source
CUST001,test@example.com,Test User,Subject,Description here,"tag1,tag2,tag3",web_form`;

        const result = parseCSV(csvContent);
        expect(result[0].data.tags).toBeDefined();
        expect(result[0].data.tags?.length).toBeGreaterThan(0);
    });

    it('should handle malformed CSV gracefully', () => {
        const csvContent = `customer_id,customer_email,customer_name
CUST001,test@example.com,Test User
CUST002,test2@example.com,Test User 2`;

        const result = parseCSV(csvContent);
        expect(result.length).toBe(2);
    });

    it('should assign correct row numbers', () => {
        const csvContent = `customer_id,customer_email,customer_name,subject,description,source
CUST001,test1@example.com,User 1,Subject 1,Description 1,web_form
CUST002,test2@example.com,User 2,Subject 2,Description 2,email`;

        const result = parseCSV(csvContent);
        expect(result[0].row).toBe(2); // First data row
        expect(result[1].row).toBe(3); // Second data row
    });
});
