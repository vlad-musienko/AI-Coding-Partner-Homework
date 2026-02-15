/**
 * JSON Parser
 * Parses JSON files into ticket data
 */

import { CreateTicketDTO } from '../models/ticket';

export interface ParsedTicket {
  data: Partial<CreateTicketDTO>;
  row: number;
}

/**
 * Parse JSON content into ticket DTOs
 * Supports both array format and wrapper object format: { tickets: [...] }
 */
export function parseJSON(content: string): ParsedTicket[] {
  try {
    const parsed = JSON.parse(content);
    
    let tickets: any[];
    
    // Handle wrapper object format
    if (parsed.tickets && Array.isArray(parsed.tickets)) {
      tickets = parsed.tickets;
    } 
    // Handle direct array format
    else if (Array.isArray(parsed)) {
      tickets = parsed;
    } 
    else {
      throw new Error('JSON must be an array or an object with a "tickets" array property');
    }

    return tickets.map((ticket, index) => {
      const data: Partial<CreateTicketDTO> = {
        customer_id: ticket.customer_id,
        customer_email: ticket.customer_email,
        customer_name: ticket.customer_name,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        assigned_to: ticket.assigned_to || null,
        tags: Array.isArray(ticket.tags) ? ticket.tags : [],
        metadata: ticket.metadata || {
          source: 'api'
        }
      };

      return {
        data,
        row: index + 1
      };
    });
  } catch (error) {
    throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
