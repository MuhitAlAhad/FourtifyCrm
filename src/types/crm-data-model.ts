/**
 * FOURTIFY DEFENCE CRM DATA MODEL
 * Version: 1.0
 * Purpose: Define the internal CRM and Pipeline data model for consistency across all features
 */

// ============================================================================
// PIPELINE STAGES
// ============================================================================
export const PIPELINE_STAGES = [
    'New Lead',
    'Qualified Lead',
    'Engaged – Under Discussion',
    'Proposal / Pricing Sent',
    'Security Assessment',
    'Awaiting Decision',
    'Contracting / Legal',
    'Closed Won',
    'Closed Lost',
    'On Hold',
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

// ============================================================================
// ENGAGEMENT ACTIVITY TYPES
// ============================================================================
export const ACTIVITY_TYPES = [
    'Cold Call',
    'Cold Email',
    'Phone Contact',
    'Event',
    'Meeting',
    'Demo',
    'Follow-up',
    'Other',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

// ============================================================================
// ENTITY: ORGANISATION
// ============================================================================
export interface Organisation {
    id: string;                    // Unique identifier (e.g., "crm:org:1234567890")
    name: string;                  // Organisation legal/trading name
    phone: string;                 // Primary contact phone number
    email: string;                 // Primary contact email
    address: string;               // Full address (street, city, state, postcode, country)
    website: string;               // Organisation website URL
    industry: string;              // Industry/sector (e.g., "Defence", "Government")
    size: string;                  // Company size (e.g., "1-50", "51-200", "201-1000", "1000+")
    notes: string;                 // Internal notes about the organisation
    createdAt: string;             // ISO date string when record created
    updatedAt: string;             // ISO date string when record last updated
    createdBy: string;             // User ID who created the record
}

// ============================================================================
// ENTITY: CONTACT
// ============================================================================
export interface Contact {
    id: string;                    // Unique identifier (e.g., "crm:contact:1234567890")
    organisationId: string;        // Foreign key to Organisation.id
    firstName: string;             // Contact first name
    lastName: string;              // Contact last name
    jobTitle: string;              // Job title/position
    email: string;                 // Contact email address
    phone: string;                 // Contact phone number (direct)
    mobile: string;                // Contact mobile number
    isPrimary: boolean;            // Whether this is the primary contact for the organisation
    notes: string;                 // Internal notes about the contact
    linkedIn: string;              // LinkedIn profile URL
    createdAt: string;             // ISO date string when record created
    updatedAt: string;             // ISO date string when record last updated
    createdBy: string;             // User ID who created the record
}

// ============================================================================
// ENTITY: LEAD / OPPORTUNITY
// ============================================================================
export interface Lead {
    id: string;                    // Unique identifier (e.g., "crm:lead:1234567890")
    organisationId: string;        // Foreign key to Organisation.id
    contactId: string;             // Foreign key to Contact.id
    name: string;                  // Lead/opportunity name (e.g., "Defence Tech Enterprise Deal")
    stage: PipelineStage;          // Current pipeline stage
    expectedValue: number;         // Expected contract value in AUD
    probability: number;           // Win probability percentage (0-100)
    expectedCloseDate: string;     // ISO date string for expected close
    owner: string;                 // User ID of the internal owner/sales rep
    source: string;                // Lead source (e.g., "Website", "Referral", "Cold Outreach")
    description: string;           // Description of the opportunity
    competitors: string;           // Known competitors in this deal
    nextSteps: string;             // Next actions required
    priority: 'Low' | 'Medium' | 'High' | 'Critical'; // Priority level
    tags: string[];                // Tags for categorization (e.g., ["DISP", "Enterprise"])
    createdAt: string;             // ISO date string when record created
    updatedAt: string;             // ISO date string when record last updated
    closedAt?: string;             // ISO date string when deal was closed (won/lost)
    createdBy: string;             // User ID who created the record

    // Legacy fields for backward compatibility with existing leads
    supplierName?: string;         // Supplier name (legacy)
    company?: string;              // Company name (legacy - use organisationId instead)
    status?: string;               // Status (legacy - use stage instead)
}

// ============================================================================
// ENTITY: ENGAGEMENT ACTIVITY
// ============================================================================
export interface Activity {
    id: string;                    // Unique identifier (e.g., "crm:activity:1234567890")
    leadId: string;                // Foreign key to Lead.id
    organisationId: string;        // Foreign key to Organisation.id
    contactId?: string;            // Optional foreign key to Contact.id
    type: ActivityType;            // Type of engagement activity
    subject: string;               // Activity subject/title
    description: string;           // Detailed description or notes (free text)
    outcome: string;               // Outcome of the activity
    scheduledAt?: string;          // ISO date string for scheduled activities
    completedAt?: string;          // ISO date string when activity completed
    duration: number;              // Duration in minutes
    owner: string;                 // User ID who owns/performed the activity
    createdAt: string;             // ISO date string when record created
    createdBy: string;             // User ID who created the record
}

// ============================================================================
// ENTITY: PROPOSAL / CONTRACT
// ============================================================================
export interface Proposal {
    id: string;                    // Unique identifier (e.g., "crm:proposal:1234567890")
    leadId: string;                // Foreign key to Lead.id
    organisationId: string;        // Foreign key to Organisation.id
    proposalNumber: string;        // Unique proposal/quote number
    version: number;               // Version number (for revisions)
    title: string;                 // Proposal title
    totalValue: number;            // Total proposal value in AUD
    validUntil: string;            // ISO date string - proposal expiry date
    status: 'Draft' | 'Sent' | 'Under Review' | 'Accepted' | 'Rejected' | 'Expired';
    documentUrl?: string;          // URL to proposal document (if stored)
    terms: string;                 // Payment terms and conditions
    notes: string;                 // Internal notes
    sentAt?: string;               // ISO date string when proposal was sent
    acceptedAt?: string;           // ISO date string when proposal was accepted
    sentBy: string;                // User ID who sent the proposal
    createdAt: string;             // ISO date string when record created
    updatedAt: string;             // ISO date string when record last updated
    createdBy: string;             // User ID who created the record
}

// ============================================================================
// ENTITY: USER (INTERNAL)
// ============================================================================
export interface User {
    id: string;                    // Unique identifier (e.g., "crm:user:1234567890")
    email: string;                 // User email (login)
    firstName: string;             // User first name
    lastName: string;              // User last name
    role: 'Admin' | 'Sales Manager' | 'Sales Rep' | 'Support' | 'Viewer';
    phone: string;                 // User phone number
    isActive: boolean;             // Whether user account is active
    avatar?: string;               // Avatar image URL
    createdAt: string;             // ISO date string when record created
    lastLoginAt?: string;          // ISO date string of last login
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getStageColor(stage: PipelineStage): string {
    const colorMap: Record<PipelineStage, string> = {
        'New Lead': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Qualified Lead': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        'Engaged – Under Discussion': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'Proposal / Pricing Sent': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        'Security Assessment': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        'Awaiting Decision': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'Contracting / Legal': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'Closed Won': 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20',
        'Closed Lost': 'bg-red-500/10 text-red-400 border-red-400/20',
        'On Hold': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colorMap[stage];
}

export function getStageProbability(stage: PipelineStage): number {
    const probabilityMap: Record<PipelineStage, number> = {
        'New Lead': 10,
        'Qualified Lead': 20,
        'Engaged – Under Discussion': 40,
        'Proposal / Pricing Sent': 60,
        'Security Assessment': 70,
        'Awaiting Decision': 80,
        'Contracting / Legal': 90,
        'Closed Won': 100,
        'Closed Lost': 0,
        'On Hold': 0,
    };
    return probabilityMap[stage];
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function getActivityTypeIcon(type: ActivityType): string {
    const iconMap: Record<ActivityType, string> = {
        'Cold Call': '📞',
        'Cold Email': '📧',
        'Phone Contact': '☎️',
        'Event': '🎯',
        'Meeting': '👥',
        'Demo': '🖥️',
        'Follow-up': '🔄',
        'Other': '📝',
    };
    return iconMap[type];
}
