/**
 * Integration Tests
 * End-to-end workflow tests
 */

import request from 'supertest';
import app from '../src/app';
import {ticketService} from '../src/services/ticketService';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Tests', () => {
    beforeEach(() => {
        ticketService.clear();
    });

    it('should complete full ticket lifecycle', async () => {
        // 1. Create ticket
        const createResponse = await request(app)
            .post('/tickets')
            .send({
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Test Issue',
                description: 'This is a test issue description',
                metadata: {source: 'web_form'}
            })
            .expect(201);

        const ticketId = createResponse.body.id;

        // 2. Auto-classify ticket
        const classifyResponse = await request(app)
            .post(`/tickets/${ticketId}/auto-classify`)
            .expect(200);

        expect(classifyResponse.body.classification).toBeDefined();

        // 3. Update ticket status
        const updateResponse = await request(app)
            .put(`/tickets/${ticketId}`)
            .send({status: 'in_progress'})
            .expect(200);

        expect(updateResponse.body.status).toBe('in_progress');

        // 4. Resolve ticket
        const resolveResponse = await request(app)
            .put(`/tickets/${ticketId}`)
            .send({status: 'resolved'})
            .expect(200);

        expect(resolveResponse.body.status).toBe('resolved');
        expect(resolveResponse.body.resolved_at).toBeDefined();

        // 5. Close ticket
        const closeResponse = await request(app)
            .put(`/tickets/${ticketId}`)
            .send({status: 'closed'})
            .expect(200);

        expect(closeResponse.body.status).toBe('closed');
    });

    it('should bulk import and auto-classify tickets', async () => {
        const csvContent = fs.readFileSync(
            path.join(__dirname, 'fixtures/sample_tickets.csv'),
            'utf-8'
        );

        const response = await request(app)
            .post('/tickets/import')
            .field('auto_classify', 'true')
            .attach('file', Buffer.from(csvContent), 'tickets.csv')
            .expect(200);

        expect(response.body.successful).toBeGreaterThan(0);
        expect(response.body.total).toBeGreaterThan(0);

        // Verify tickets were classified
        const listResponse = await request(app)
            .get('/tickets')
            .expect(200);

        const tickets = listResponse.body.tickets;
        expect(tickets.length).toBeGreaterThan(0);
        expect(tickets[0].category).toBeDefined();
        expect(tickets[0].priority).toBeDefined();
    });

    it('should filter tickets by multiple criteria', async () => {
        // Create tickets with different properties
        await request(app)
            .post('/tickets')
            .send({
                customer_id: 'CUST001',
                customer_email: 'test1@example.com',
                customer_name: 'User 1',
                subject: 'Billing Issue',
                description: 'I have a billing question about my invoice',
                category: 'billing_question',
                priority: 'high',
                status: 'new',
                metadata: {source: 'web_form'}
            });

        await request(app)
            .post('/tickets')
            .send({
                customer_id: 'CUST002',
                customer_email: 'test2@example.com',
                customer_name: 'User 2',
                subject: 'Technical Problem',
                description: 'The application is not working properly',
                category: 'technical_issue',
                priority: 'high',
                status: 'new',
                metadata: {source: 'email'}
            });

        await request(app)
            .post('/tickets')
            .send({
                customer_id: 'CUST003',
                customer_email: 'test3@example.com',
                customer_name: 'User 3',
                subject: 'Feature Request',
                description: 'Would be nice to have this feature',
                category: 'feature_request',
                priority: 'low',
                status: 'new',
                metadata: {source: 'chat'}
            });

        // Filter by category and priority
        const response = await request(app)
            .get('/tickets?category=billing_question&priority=high')
            .expect(200);

        expect(response.body.total).toBe(1);
        expect(response.body.tickets[0].category).toBe('billing_question');
        expect(response.body.tickets[0].priority).toBe('high');
    });

    it('should handle concurrent ticket operations', async () => {
        const promises = [];

        // Create 20 tickets concurrently
        for (let i = 0; i < 20; i++) {
            promises.push(
                request(app)
                    .post('/tickets')
                    .send({
                        customer_id: `CUST${i}`,
                        customer_email: `test${i}@example.com`,
                        customer_name: `User ${i}`,
                        subject: `Test Subject ${i}`,
                        description: `This is test description number ${i}`,
                        metadata: {source: 'web_form'}
                    })
            );
        }

        const responses = await Promise.all(promises);

        // All should succeed
        responses.forEach(response => {
            expect(response.status).toBe(201);
        });

        // Verify all tickets were created
        const listResponse = await request(app)
            .get('/tickets')
            .expect(200);

        expect(listResponse.body.total).toBe(20);
    });

    it('should handle import errors gracefully', async () => {
        const invalidCsvContent = fs.readFileSync(
            path.join(__dirname, 'fixtures/invalid_tickets.csv'),
            'utf-8'
        );

        const response = await request(app)
            .post('/tickets/import')
            .attach('file', Buffer.from(invalidCsvContent), 'invalid.csv')
            .expect(200);

        expect(response.body.failed).toBeGreaterThan(0);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors.length).toBeGreaterThan(0);
    });
});
