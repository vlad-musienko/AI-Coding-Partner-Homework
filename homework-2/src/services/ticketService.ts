/**
 * Ticket Service
 * In-memory CRUD operations for support tickets
 */

import { v4 as uuidv4 } from 'uuid';
import { Ticket, CreateTicketDTO, UpdateTicketDTO, TicketFilters } from '../models/ticket';

class TicketService {
  private tickets: Map<string, Ticket> = new Map();

  /**
   * Create a new ticket
   */
  create(dto: CreateTicketDTO): Ticket {
    const now = new Date();
    
    const ticket: Ticket = {
      id: uuidv4(),
      customer_id: dto.customer_id,
      customer_email: dto.customer_email,
      customer_name: dto.customer_name,
      subject: dto.subject,
      description: dto.description,
      category: dto.category || 'other',
      priority: dto.priority || 'medium',
      status: dto.status || 'new',
      created_at: now,
      updated_at: now,
      resolved_at: null,
      assigned_to: dto.assigned_to || null,
      tags: dto.tags || [],
      metadata: dto.metadata
    };

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  /**
   * Find all tickets with optional filtering
   */
  findAll(filters?: TicketFilters): Ticket[] {
    let results = Array.from(this.tickets.values());

    if (filters) {
      if (filters.category) {
        results = results.filter(t => t.category === filters.category);
      }
      if (filters.priority) {
        results = results.filter(t => t.priority === filters.priority);
      }
      if (filters.status) {
        results = results.filter(t => t.status === filters.status);
      }
      if (filters.assigned_to !== undefined) {
        results = results.filter(t => t.assigned_to === filters.assigned_to);
      }
      if (filters.customer_id) {
        results = results.filter(t => t.customer_id === filters.customer_id);
      }
    }

    return results;
  }

  /**
   * Find a ticket by ID
   */
  findById(id: string): Ticket | undefined {
    return this.tickets.get(id);
  }

  /**
   * Update a ticket
   */
  update(id: string, dto: UpdateTicketDTO): Ticket | undefined {
    const ticket = this.tickets.get(id);
    if (!ticket) {
      return undefined;
    }

    const updatedTicket: Ticket = {
      ...ticket,
      ...dto,
      id: ticket.id, // Ensure ID cannot be changed
      created_at: ticket.created_at, // Ensure created_at cannot be changed
      updated_at: new Date(),
      metadata: dto.metadata ? { ...ticket.metadata, ...dto.metadata } : ticket.metadata
    };

    // If status is changed to 'resolved' or 'closed', set resolved_at
    if ((dto.status === 'resolved' || dto.status === 'closed') && !ticket.resolved_at) {
      updatedTicket.resolved_at = new Date();
    }

    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  /**
   * Delete a ticket
   */
  delete(id: string): boolean {
    return this.tickets.delete(id);
  }

  /**
   * Get total count of tickets
   */
  count(): number {
    return this.tickets.size;
  }

  /**
   * Clear all tickets (useful for testing)
   */
  clear(): void {
    this.tickets.clear();
  }

  /**
   * Bulk create tickets (for import)
   */
  bulkCreate(dtos: CreateTicketDTO[]): Ticket[] {
    return dtos.map(dto => this.create(dto));
  }
}

// Export singleton instance
export const ticketService = new TicketService();
