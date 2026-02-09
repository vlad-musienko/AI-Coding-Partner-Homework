/**
 * Import Service
 * Orchestrates bulk import of tickets from various file formats
 */

import { ImportResult, ImportError, CreateTicketDTO } from '../models/ticket';
import { parseCSV } from '../parsers/csvParser';
import { parseJSON } from '../parsers/jsonParser';
import { parseXML } from '../parsers/xmlParser';
import { validateCreateTicket, formatValidationErrors } from '../validators/ticketValidator';
import { ticketService } from './ticketService';
import { classifyTicket } from './classificationService';

export type FileFormat = 'csv' | 'json' | 'xml';

/**
 * Detect file format from filename or content
 */
export function detectFileFormat(filename: string, contentType?: string): FileFormat {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (ext === 'csv' || contentType?.includes('csv')) {
    return 'csv';
  }
  if (ext === 'json' || contentType?.includes('json')) {
    return 'json';
  }
  if (ext === 'xml' || contentType?.includes('xml')) {
    return 'xml';
  }
  
  throw new Error(`Unsupported file format: ${filename}`);
}

/**
 * Import tickets from file content
 */
export async function importTickets(
  content: string,
  format: FileFormat,
  autoClassify: boolean = false
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  const validTickets: CreateTicketDTO[] = [];

  try {
    // Parse based on format
    let parsedTickets;
    switch (format) {
      case 'csv':
        parsedTickets = parseCSV(content);
        break;
      case 'json':
        parsedTickets = parseJSON(content);
        break;
      case 'xml':
        parsedTickets = parseXML(content);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Validate each parsed ticket
    for (const parsed of parsedTickets) {
      const validation = validateCreateTicket(parsed.data);
      
      if (validation.success) {
        let ticketDTO: CreateTicketDTO = {
          ...validation.data,
          auto_classify: autoClassify
        };
        
        // Auto-classify if requested and category/priority not already set
        if (autoClassify && (!ticketDTO.category || !ticketDTO.priority)) {
          const classification = classifyTicket(ticketDTO.subject, ticketDTO.description);
          if (!ticketDTO.category) {
            ticketDTO.category = classification.category;
          }
          if (!ticketDTO.priority) {
            ticketDTO.priority = classification.priority;
          }
        }
        
        validTickets.push(ticketDTO);
      } else {
        const validationErrors = formatValidationErrors(validation.error);
        validationErrors.forEach(err => {
          errors.push({
            row: parsed.row,
            field: err.field,
            message: err.message
          });
        });
      }
    }

    // Bulk create valid tickets
    const createdTickets = ticketService.bulkCreate(validTickets);

    return {
      total: parsedTickets.length,
      successful: createdTickets.length,
      failed: errors.length,
      errors
    };

  } catch (error) {
    // Handle parsing errors
    return {
      total: 0,
      successful: 0,
      failed: 1,
      errors: [{
        row: 0,
        message: error instanceof Error ? error.message : 'Unknown parsing error'
      }]
    };
  }
}

/**
 * Import tickets from file buffer
 */
export async function importTicketsFromFile(
  fileBuffer: Buffer,
  filename: string,
  contentType?: string,
  autoClassify: boolean = false
): Promise<ImportResult> {
  const format = detectFileFormat(filename, contentType);
  const content = fileBuffer.toString('utf-8');
  return importTickets(content, format, autoClassify);
}
