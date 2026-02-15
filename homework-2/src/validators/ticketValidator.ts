/**
 * Ticket Validator
 * Zod schemas for strict validation of ticket data
 */

import { z } from 'zod';

// Enum schemas
export const TicketCategorySchema = z.enum([
  'account_access',
  'technical_issue',
  'billing_question',
  'feature_request',
  'bug_report',
  'other'
]);

export const TicketPrioritySchema = z.enum(['urgent', 'high', 'medium', 'low']);

export const TicketStatusSchema = z.enum([
  'new',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed'
]);

export const TicketSourceSchema = z.enum(['web_form', 'email', 'api', 'chat', 'phone']);

export const DeviceTypeSchema = z.enum(['desktop', 'mobile', 'tablet']);

// Metadata schema
export const TicketMetadataSchema = z.object({
  source: TicketSourceSchema,
  browser: z.string().optional(),
  device_type: DeviceTypeSchema.optional()
});

// Create Ticket DTO schema
export const CreateTicketDTOSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  customer_email: z.string().email('Invalid email format'),
  customer_name: z.string().min(1, 'Customer name is required'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be 200 characters or less'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be 2000 characters or less'),
  category: TicketCategorySchema.optional(),
  priority: TicketPrioritySchema.optional(),
  status: TicketStatusSchema.optional(),
  assigned_to: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: TicketMetadataSchema,
  auto_classify: z.boolean().optional()
});

// Update Ticket DTO schema
export const UpdateTicketDTOSchema = z.object({
  customer_id: z.string().min(1).optional(),
  customer_email: z.string().email('Invalid email format').optional(),
  customer_name: z.string().min(1).optional(),
  subject: z.string().min(1).max(200, 'Subject must be 200 characters or less').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be 2000 characters or less').optional(),
  category: TicketCategorySchema.optional(),
  priority: TicketPrioritySchema.optional(),
  status: TicketStatusSchema.optional(),
  resolved_at: z.date().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.object({
    source: TicketSourceSchema.optional(),
    browser: z.string().optional(),
    device_type: DeviceTypeSchema.optional()
  }).optional()
});

// Full Ticket schema
export const TicketSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().min(1),
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  subject: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  category: TicketCategorySchema,
  priority: TicketPrioritySchema,
  status: TicketStatusSchema,
  created_at: z.date(),
  updated_at: z.date(),
  resolved_at: z.date().nullable(),
  assigned_to: z.string().nullable(),
  tags: z.array(z.string()),
  metadata: TicketMetadataSchema
});

/**
 * Validation helper functions
 */

export function validateCreateTicket(data: unknown) {
  return CreateTicketDTOSchema.safeParse(data);
}

export function validateUpdateTicket(data: unknown) {
  return UpdateTicketDTOSchema.safeParse(data);
}

export function validateTicket(data: unknown) {
  return TicketSchema.safeParse(data);
}

/**
 * Format Zod errors into a user-friendly format
 */
export function formatValidationErrors(errors: z.ZodError) {
  return errors.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
}
