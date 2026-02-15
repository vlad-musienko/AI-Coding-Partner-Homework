/**
 * Performance Tests
 * Tests for system performance and benchmarks
 */

import request from 'supertest';
import app from '../src/app';
import {ticketService} from '../src/services/ticketService';

describe('Performance Tests', () => {
    beforeEach(() => {
        ticketService.clear();
    });

    it('should handle bulk import of 1000 tickets', async () => {
        // Generate CSV content with 1000 tickets
        let csvContent = 'customer_id,customer_email,customer_name,subject,description,source\n';

        for (let i = 0; i < 1000; i++) {
            csvContent += `CUST${i},test${i}@example.com,User ${i},Subject ${i},This is a test description for ticket number ${i},web_form\n`;
        }

        const startTime = Date.now();

        const response = await request(app)
            .post('/tickets/import')
            .attach('file', Buffer.from(csvContent), 'bulk.csv')
            .expect(200);

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response.body.successful).toBe(1000);
        expect(response.body.total).toBe(1000);

        // Should complete in reasonable time (adjust as needed)
        console.log(`Bulk import of 1000 tickets took ${duration}ms`);
    });

    it('should handle concurrent requests efficiently', async () => {
        const promises = [];
        const concurrentRequests = 25;

        const startTime = Date.now();

        // Make 25 concurrent POST requests
        for (let i = 0; i < concurrentRequests; i++) {
            promises.push(
                request(app)
                    .post('/tickets')
                    .send({
                        customer_id: `CUST${i}`,
                        customer_email: `test${i}@example.com`,
                        customer_name: `User ${i}`,
                        subject: `Concurrent Test ${i}`,
                        description: `This is a concurrent test description ${i}`,
                        metadata: {source: 'web_form'}
                    })
            );
        }

        const responses = await Promise.all(promises);
        const endTime = Date.now();
        const duration = endTime - startTime;

        // All should succeed
        responses.forEach(response => {
            expect(response.status).toBe(201);
        });

        console.log(`${concurrentRequests} concurrent requests took ${duration}ms`);
        console.log(`Average: ${(duration / concurrentRequests).toFixed(2)}ms per request`);
    });

    it('should retrieve single ticket quickly', async () => {
        // Create a ticket
        const createResponse = await request(app)
            .post('/tickets')
            .send({
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Performance Test',
                description: 'Testing single ticket retrieval performance',
                metadata: {source: 'web_form'}
            });

        const ticketId = createResponse.body.id;

        // Measure retrieval time
        const startTime = Date.now();

        await request(app)
            .get(`/tickets/${ticketId}`)
            .expect(200);

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should be very fast (< 200ms)
        expect(duration).toBeLessThan(200);
        console.log(`Single ticket retrieval took ${duration}ms`);
    });

    it('should filter large dataset efficiently', async () => {
        // Create 500 tickets with various categories
        const categories = ['account_access', 'technical_issue', 'billing_question', 'feature_request', 'bug_report'];

        for (let i = 0; i < 500; i++) {
            ticketService.create({
                customer_id: `CUST${i}`,
                customer_email: `test${i}@example.com`,
                customer_name: `User ${i}`,
                subject: `Subject ${i}`,
                description: `Description for ticket ${i}`,
                category: categories[i % categories.length] as any,
                metadata: {source: 'web_form'}
            });
        }

        const startTime = Date.now();

        const response = await request(app)
            .get('/tickets?category=billing_question&priority=medium')
            .expect(200);

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response.body.tickets).toBeDefined();
        console.log(`Filtering 500 tickets took ${duration}ms`);
        console.log(`Found ${response.body.total} matching tickets`);
    });

    it('should handle classification of multiple tickets efficiently', async () => {
        const tickets = [];

        // Create 100 tickets
        for (let i = 0; i < 100; i++) {
            const ticket = ticketService.create({
                customer_id: `CUST${i}`,
                customer_email: `test${i}@example.com`,
                customer_name: `User ${i}`,
                subject: 'Cannot login to my account',
                description: 'I forgot my password and need help accessing my account',
                metadata: {source: 'web_form'}
            });
            tickets.push(ticket);
        }

        const startTime = Date.now();

        // Classify all tickets
        const promises = tickets.map(ticket =>
            request(app)
                .post(`/tickets/${ticket.id}/auto-classify`)
                .expect(200)
        );

        await Promise.all(promises);

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`Classifying 100 tickets took ${duration}ms`);
        console.log(`Average: ${(duration / 100).toFixed(2)}ms per classification`);
    });
});
