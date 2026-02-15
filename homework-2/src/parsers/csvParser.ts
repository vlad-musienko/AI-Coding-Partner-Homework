/**
 * CSV Parser
 * Parses CSV files into ticket data
 */

import { parse } from 'csv-parse/sync';
import { CreateTicketDTO } from '../models/ticket';

export interface ParsedTicket {
  data: Partial<CreateTicketDTO>;
  row: number;
}

/**
 * Parse CSV content into ticket DTOs
 */
export function parseCSV(content: string): ParsedTicket[] {
  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: false
    });

    return records.map((record: any, index: number) => {
      // Parse tags from comma-separated string or JSON array
      let tags: string[] = [];
      if (record.tags) {
        try {
          tags = JSON.parse(record.tags);
        } catch {
          tags = record.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
        }
      }

      // Clean empty strings to undefined for optional enum fields
      const cleanString = (val: any) => (val === '' || val === undefined) ? undefined : val;
      
      const data: Partial<CreateTicketDTO> = {
        customer_id: record.customer_id,
        customer_email: record.customer_email,
        customer_name: record.customer_name,
        subject: record.subject,
        description: record.description,
        category: cleanString(record.category),
        priority: cleanString(record.priority),
        status: cleanString(record.status),
        assigned_to: record.assigned_to || null,
        tags: tags,
        metadata: {
          source: record.source || 'api',
          browser: record.browser,
          device_type: record.device_type
        }
      };

      return {
        data,
        row: index + 2 // +2 because CSV has header row and arrays are 0-indexed
      };
    });
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
