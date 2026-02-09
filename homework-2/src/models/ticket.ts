/**
 * Ticket Model
 * Defines all types, interfaces, and enums for the support ticket system
 */

// Enums and Type Unions
export type TicketCategory = 
  | 'account_access' 
  | 'technical_issue' 
  | 'billing_question' 
  | 'feature_request' 
  | 'bug_report' 
  | 'other';

export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TicketStatus = 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export type TicketSource = 'web_form' | 'email' | 'api' | 'chat' | 'phone';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

// Metadata Interface
export interface TicketMetadata {
  source: TicketSource;
  browser?: string;
  device_type?: DeviceType;
}

// Main Ticket Interface
export interface Ticket {
  id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
  assigned_to: string | null;
  tags: string[];
  metadata: TicketMetadata;
}

// DTO for creating a new ticket
export interface CreateTicketDTO {
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_to?: string | null;
  tags?: string[];
  metadata: TicketMetadata;
  auto_classify?: boolean; // Flag to trigger auto-classification
}

// DTO for updating an existing ticket
export interface UpdateTicketDTO {
  customer_id?: string;
  customer_email?: string;
  customer_name?: string;
  subject?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  resolved_at?: Date | null;
  assigned_to?: string | null;
  tags?: string[];
  metadata?: Partial<TicketMetadata>;
}

// Filters for querying tickets
export interface TicketFilters {
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_to?: string;
  customer_id?: string;
}

// Classification Result
export interface ClassificationResult {
  category: TicketCategory;
  priority: TicketPriority;
  confidence: number;
  reasoning: string;
  keywords_found: string[];
}

// Import Result
export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
}
