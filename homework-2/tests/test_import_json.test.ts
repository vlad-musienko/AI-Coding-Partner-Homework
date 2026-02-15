/**
 * JSON Import Tests
 * Tests for JSON file parsing
 */

import {parseJSON} from '../src/parsers/jsonParser';
import * as fs from 'fs';
import * as path from 'path';

describe('JSON Import', () => {
    it('should parse valid JSON file with wrapper object', () => {
        const jsonContent = fs.readFileSync(
            path.join(__dirname, 'fixtures/sample_tickets.json'),
            'utf-8'
        );

        const result = parseJSON(jsonContent);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].data.customer_email).toBeDefined();
    });

    it('should parse JSON array format', () => {
        const jsonContent = JSON.stringify([
            {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Test',
                description: 'Test description',
                metadata: {source: 'web_form'}
            }
        ]);

        const result = parseJSON(jsonContent);
        expect(result.length).toBe(1);
        expect(result[0].data.customer_id).toBe('CUST001');
    });

    it('should handle invalid JSON format', () => {
        const jsonContent = `{ "invalid": "json" `;

        expect(() => parseJSON(jsonContent)).toThrow();
    });

    it('should reject non-array JSON without tickets property', () => {
        const jsonContent = JSON.stringify({
            data: [{customer_id: 'CUST001'}]
        });

        expect(() => parseJSON(jsonContent)).toThrow();
    });

    it('should assign correct row numbers', () => {
        const jsonContent = JSON.stringify({
            tickets: [
                {
                    customer_id: 'CUST001',
                    customer_email: 'test1@example.com',
                    customer_name: 'User 1',
                    subject: 'Subject 1',
                    description: 'Description 1',
                    metadata: {source: 'web_form'}
                },
                {
                    customer_id: 'CUST002',
                    customer_email: 'test2@example.com',
                    customer_name: 'User 2',
                    subject: 'Subject 2',
                    description: 'Description 2',
                    metadata: {source: 'email'}
                }
            ]
        });

        const result = parseJSON(jsonContent);
        expect(result[0].row).toBe(1);
        expect(result[1].row).toBe(2);
    });
});
