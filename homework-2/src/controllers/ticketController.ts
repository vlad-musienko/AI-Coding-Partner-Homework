/**
 * Ticket Controller
 * Request handlers for all ticket endpoints
 */

import { Request, Response } from 'express';
import { ticketService } from '../services/ticketService';
import { classifyTicket } from '../services/classificationService';
import { importTicketsFromFile } from '../services/importService';
import { validateCreateTicket, validateUpdateTicket, formatValidationErrors } from '../validators/ticketValidator';
import { TicketFilters } from '../models/ticket';

/**
 * POST /tickets - Create a new ticket
 */
export async function createTicket(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateCreateTicket(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: formatValidationErrors(validation.error)
      });
      return;
    }

    let dto = validation.data;
    
    // Auto-classify if requested and category/priority not already set
    if (dto.auto_classify && (!dto.category || !dto.priority)) {
      const classification = classifyTicket(dto.subject, dto.description);
      if (!dto.category) {
        dto.category = classification.category;
      }
      if (!dto.priority) {
        dto.priority = classification.priority;
      }
    }

    const ticket = ticketService.create(dto);
    
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: [{ field: 'server', message: 'Failed to create ticket' }]
    });
  }
}

/**
 * POST /tickets/import - Bulk import tickets from file
 */
export async function importTickets(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'Validation Error',
        details: [{ field: 'file', message: 'No file uploaded' }]
      });
      return;
    }

    const autoClassify = req.body.auto_classify === 'true' || req.body.auto_classify === true;
    
    const result = await importTicketsFromFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      autoClassify
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: [{ 
        field: 'server', 
        message: error instanceof Error ? error.message : 'Failed to import tickets' 
      }]
    });
  }
}

/**
 * GET /tickets - List all tickets with optional filtering
 */
export async function listTickets(req: Request, res: Response): Promise<void> {
  try {
    const filters: TicketFilters = {
      category: req.query.category as any,
      priority: req.query.priority as any,
      status: req.query.status as any,
      assigned_to: req.query.assigned_to as string,
      customer_id: req.query.customer_id as string
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof TicketFilters] === undefined) {
        delete filters[key as keyof TicketFilters];
      }
    });

    const tickets = ticketService.findAll(Object.keys(filters).length > 0 ? filters : undefined);
    
    res.status(200).json({
      total: tickets.length,
      tickets
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: [{ field: 'server', message: 'Failed to list tickets' }]
    });
  }
}

/**
 * GET /tickets/:id - Get a specific ticket
 */
export async function getTicket(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ticket = ticketService.findById(id);

    if (!ticket) {
      res.status(404).json({
        error: 'Not Found',
        details: [{ field: 'id', message: `Ticket with id ${id} not found` }]
      });
      return;
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: [{ field: 'server', message: 'Failed to get ticket' }]
    });
  }
}

/**
 * PUT /tickets/:id - Update a ticket
 */
export async function updateTicket(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const validation = validateUpdateTicket(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: formatValidationErrors(validation.error)
      });
      return;
    }

    const updatedTicket = ticketService.update(id, validation.data);

    if (!updatedTicket) {
      res.status(404).json({
        error: 'Not Found',
        details: [{ field: 'id', message: `Ticket with id ${id} not found` }]
      });
      return;
    }

    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: [{ field: 'server', message: 'Failed to update ticket' }]
    });
  }
}

/**
 * DELETE /tickets/:id - Delete a ticket
 */
export async function deleteTicket(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = ticketService.delete(id);

    if (!deleted) {
      res.status(404).json({
        error: 'Not Found',
        details: [{ field: 'id', message: `Ticket with id ${id} not found` }]
      });
      return;
    }

    res.status(200).json({
      message: 'Ticket deleted successfully',
      id
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: [{ field: 'server', message: 'Failed to delete ticket' }]
    });
  }
}

/**
 * POST /tickets/:id/auto-classify - Auto-classify a ticket
 */
export async function autoClassifyTicket(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ticket = ticketService.findById(id);

    if (!ticket) {
      res.status(404).json({
        error: 'Not Found',
        details: [{ field: 'id', message: `Ticket with id ${id} not found` }]
      });
      return;
    }

    const classification = classifyTicket(ticket.subject, ticket.description);
    
    // Update the ticket with new classification
    const updatedTicket = ticketService.update(id, {
      category: classification.category,
      priority: classification.priority
    });

    res.status(200).json({
      ticket: updatedTicket,
      classification
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: [{ field: 'server', message: 'Failed to classify ticket' }]
    });
  }
}
