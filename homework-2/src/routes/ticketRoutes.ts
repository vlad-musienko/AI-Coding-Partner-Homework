/**
 * Ticket Routes
 * Define all ticket-related endpoints
 */

import { Router } from 'express';
import multer from 'multer';
import {
  createTicket,
  importTickets,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  autoClassifyTicket
} from '../controllers/ticketController';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Ticket CRUD routes
router.post('/', createTicket);
router.post('/import', upload.single('file'), importTickets);
router.get('/', listTickets);
router.get('/:id', getTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

// Auto-classification route
router.post('/:id/auto-classify', autoClassifyTicket);

export default router;
