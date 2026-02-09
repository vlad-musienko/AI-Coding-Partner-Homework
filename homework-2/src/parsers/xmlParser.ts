/**
 * XML Parser
 * Parses XML files into ticket data
 */

import { XMLParser } from 'fast-xml-parser';
import { CreateTicketDTO } from '../models/ticket';

export interface ParsedTicket {
  data: Partial<CreateTicketDTO>;
  row: number;
}

/**
 * Parse XML content into ticket DTOs
 * Expected format: <tickets><ticket>...</ticket><ticket>...</ticket></tickets>
 */
export function parseXML(content: string): ParsedTicket[] {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true
    });

    const parsed = parser.parse(content);

    if (!parsed.tickets) {
      throw new Error('XML must have a root <tickets> element');
    }

    let ticketsArray: any[];

    // Handle single ticket vs multiple tickets
    if (Array.isArray(parsed.tickets.ticket)) {
      ticketsArray = parsed.tickets.ticket;
    } else if (parsed.tickets.ticket) {
      ticketsArray = [parsed.tickets.ticket];
    } else {
      throw new Error('No <ticket> elements found in XML');
    }

    return ticketsArray.map((ticket, index) => {
      // Parse tags
      let tags: string[] = [];
      if (ticket.tags) {
        if (typeof ticket.tags === 'string') {
          tags = ticket.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
        } else if (ticket.tags.tag) {
          tags = Array.isArray(ticket.tags.tag) ? ticket.tags.tag : [ticket.tags.tag];
        }
      }

      // Parse metadata
      const metadata = ticket.metadata || {};

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
        tags: tags,
        metadata: {
          source: metadata.source || 'api',
          browser: metadata.browser,
          device_type: metadata.device_type
        }
      };

      return {
        data,
        row: index + 1
      };
    });
  } catch (error) {
    throw new Error(`XML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
