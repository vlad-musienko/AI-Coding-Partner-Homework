/**
 * Ticket API Tests
 * Tests for all ticket CRUD endpoints
 */

import request from 'supertest';
import app from '../src/app';
import {ticketService} from '../src/services/ticketService';

describe('Ticket API Endpoints', () => {
    beforeEach(() => {
        // Clear tickets before each test
        ticketService.clear();
    });

    describe('POST /tickets', () => {
        it('should create a new ticket with valid data', async () => {
            const ticketData = {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'This is a test description that is long enough',
                metadata: {
                    source: 'web_form',
                    browser: 'Chrome',
                    device_type: 'desktop'
                }
            };

            const response = await request(app)
                .post('/tickets')
                .send(ticketData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.customer_email).toBe('test@example.com');
            expect(response.body.subject).toBe('Test Subject');
            expect(response.body.category).toBe('other');
            expect(response.body.priority).toBe('medium');
            expect(response.body.status).toBe('new');
        });

        it('should return 400 for invalid email', async () => {
            const ticketData = {
                customer_id: 'CUST001',
                customer_email: 'invalid-email',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'This is a test description',
                metadata: {source: 'web_form'}
            };

            const response = await request(app)
                .post('/tickets')
                .send(ticketData)
                .expect(400);

            expect(response.body.error).toBe('Validation Error');
            expect(response.body.details).toBeDefined();
        });

        it('should return 400 for subject too long', async () => {
            const ticketData = {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'A'.repeat(201),
                description: 'This is a test description',
                metadata: {source: 'web_form'}
            };

            const response = await request(app)
                .post('/tickets')
                .send(ticketData)
                .expect(400);

            expect(response.body.error).toBe('Validation Error');
        });

        it('should auto-classify ticket when auto_classify is true', async () => {
            const ticketData = {
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Cannot login to my account',
                description: 'I forgot my password and cannot access my account',
                metadata: {source: 'web_form'},
                auto_classify: true
            };

            const response = await request(app)
                .post('/tickets')
                .send(ticketData)
                .expect(201);

            expect(response.body.category).toBe('account_access');
        });
    });

    describe('GET /tickets', () => {
        it('should return all tickets', async () => {
            // Create test tickets
            ticketService.create({
                customer_id: 'CUST001',
                customer_email: 'test1@example.com',
                customer_name: 'User 1',
                subject: 'Subject 1',
                description: 'Description 1',
                metadata: {source: 'web_form'}
            });

            ticketService.create({
                customer_id: 'CUST002',
                customer_email: 'test2@example.com',
                customer_name: 'User 2',
                subject: 'Subject 2',
                description: 'Description 2',
                metadata: {source: 'email'}
            });

            const response = await request(app)
                .get('/tickets')
                .expect(200);

            expect(response.body.total).toBe(2);
            expect(response.body.tickets).toHaveLength(2);
        });

        it('should filter tickets by category', async () => {
            ticketService.create({
                customer_id: 'CUST001',
                customer_email: 'test1@example.com',
                customer_name: 'User 1',
                subject: 'Subject 1',
                description: 'Description 1',
                category: 'billing_question',
                metadata: {source: 'web_form'}
            });

            ticketService.create({
                customer_id: 'CUST002',
                customer_email: 'test2@example.com',
                customer_name: 'User 2',
                subject: 'Subject 2',
                description: 'Description 2',
                category: 'technical_issue',
                metadata: {source: 'email'}
            });

            const response = await request(app)
                .get('/tickets?category=billing_question')
                .expect(200);

            expect(response.body.total).toBe(1);
            expect(response.body.tickets[0].category).toBe('billing_question');
        });

        it('should filter tickets by multiple criteria', async () => {
            ticketService.create({
                customer_id: 'CUST001',
                customer_email: 'test1@example.com',
                customer_name: 'User 1',
                subject: 'Subject 1',
                description: 'Description 1',
                category: 'billing_question',
                priority: 'high',
                metadata: {source: 'web_form'}
            });

            const response = await request(app)
                .get('/tickets?category=billing_question&priority=high')
                .expect(200);

            expect(response.body.total).toBe(1);
        });
    });

    describe('GET /tickets/:id', () => {
        it('should return a specific ticket', async () => {
            const ticket = ticketService.create({
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'Test Description',
                metadata: {source: 'web_form'}
            });

            const response = await request(app)
                .get(`/tickets/${ticket.id}`)
                .expect(200);

            expect(response.body.id).toBe(ticket.id);
            expect(response.body.subject).toBe('Test Subject');
        });

        it('should return 404 for non-existent ticket', async () => {
            const response = await request(app)
                .get('/tickets/non-existent-id')
                .expect(404);

            expect(response.body.error).toBe('Not Found');
        });
    });

    describe('PUT /tickets/:id', () => {
        it('should update a ticket', async () => {
            const ticket = ticketService.create({
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Original Subject',
                description: 'Original Description',
                metadata: {source: 'web_form'}
            });

            const response = await request(app)
                .put(`/tickets/${ticket.id}`)
                .send({subject: 'Updated Subject'})
                .expect(200);

            expect(response.body.subject).toBe('Updated Subject');
            expect(response.body.id).toBe(ticket.id);
        });

        it('should return 404 when updating non-existent ticket', async () => {
            const response = await request(app)
                .put('/tickets/non-existent-id')
                .send({subject: 'Updated'})
                .expect(404);

            expect(response.body.error).toBe('Not Found');
        });
    });

    describe('DELETE /tickets/:id', () => {
        it('should delete a ticket', async () => {
            const ticket = ticketService.create({
                customer_id: 'CUST001',
                customer_email: 'test@example.com',
                customer_name: 'Test User',
                subject: 'Test Subject',
                description: 'Test Description',
                metadata: {source: 'web_form'}
            });

            const response = await request(app)
                .delete(`/tickets/${ticket.id}`)
                .expect(200);

            expect(response.body.message).toBe('Ticket deleted successfully');
            expect(response.body.id).toBe(ticket.id);
        });

        it('should return 404 when deleting non-existent ticket', async () => {
            const response = await request(app)
                .delete('/tickets/non-existent-id')
                .expect(404);

            expect(response.body.error).toBe('Not Found');
        });
    });
});
