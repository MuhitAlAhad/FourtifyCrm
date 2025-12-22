# Fourtify Defence CRM Data Model Documentation

**Version:** 1.0  
**Last Updated:** December 18, 2025  
**Purpose:** Define the internal CRM and Pipeline data model for consistent feature development

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Entity Definitions](#entity-definitions)
3. [Entity Relationships](#entity-relationships)
4. [Pipeline Stages](#pipeline-stages)
5. [Activity Types](#activity-types)
6. [API Endpoints](#api-endpoints)
7. [UI Components](#ui-components)
8. [Future Expansion](#future-expansion)

---

## Overview

The Fourtify Defence CRM data model is designed to manage the complete sales lifecycle from initial lead capture through to closed deals. The model prioritizes simplicity for MVP while maintaining flexibility for future expansion.

### Design Principles

- **Simplicity First**: Optimized for speed and ease of use
- **Future-Ready**: Designed to accommodate future features (subscriptions, support tickets)
- **Relationship-Driven**: Clear entity relationships for data integrity
- **Defence-Grade**: Built for security and compliance-first organizations

---

## Entity Definitions

### 1. Organisation

Represents a company or business entity that Fourtify Defence engages with.

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Unique identifier (e.g., "crm:org:1234567890") |
| `name` | string | Organisation legal/trading name |
| `phone` | string | Primary contact phone number |
| `email` | string | Primary contact email |
| `address` | string | Full address (street, city, state, postcode, country) |
| `website` | string | Organisation website URL |
| `industry` | string | Industry/sector (e.g., "Defence", "Government") |
| `size` | string | Company size (e.g., "1-50", "51-200", "201-1000", "1000+") |
| `notes` | string | Internal notes about the organisation |
| `createdAt` | string | ISO date string when record created |
| `updatedAt` | string | ISO date string when record last updated |
| `createdBy` | string | User ID who created the record |

**Example:**
```json
{
  "id": "crm:org:1702897234567",
  "name": "Defence Tech Solutions",
  "phone": "+61 2 9876 5432",
  "email": "contact@defencetech.com.au",
  "address": "Level 12, 100 George St, Sydney, NSW 2000, Australia",
  "website": "https://defencetech.com.au",
  "industry": "Defence",
  "size": "201-1000",
  "notes": "Key defence contractor for Australian Government",
  "createdAt": "2025-12-18T10:00:00.000Z",
  "updatedAt": "2025-12-18T10:00:00.000Z",
  "createdBy": "user-admin-001"
}
```

---

### 2. Contact

Represents an individual person at an organisation.

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Unique identifier (e.g., "crm:contact:1234567890") |
| `organisationId` | string | Foreign key to Organisation.id |
| `firstName` | string | Contact first name |
| `lastName` | string | Contact last name |
| `jobTitle` | string | Job title/position |
| `email` | string | Contact email address |
| `phone` | string | Contact phone number (direct) |
| `mobile` | string | Contact mobile number |
| `isPrimary` | boolean | Whether this is the primary contact for the organisation |
| `notes` | string | Internal notes about the contact |
| `linkedIn` | string | LinkedIn profile URL |
| `createdAt` | string | ISO date string when record created |
| `updatedAt` | string | ISO date string when record last updated |
| `createdBy` | string | User ID who created the record |

**Example:**
```json
{
  "id": "crm:contact:1702897245678",
  "organisationId": "crm:org:1702897234567",
  "firstName": "Sarah",
  "lastName": "Johnson",
  "jobTitle": "Chief Technology Officer",
  "email": "sarah.johnson@defencetech.com.au",
  "phone": "+61 2 9876 5433",
  "mobile": "+61 412 345 678",
  "isPrimary": true,
  "notes": "Decision maker for enterprise software purchases",
  "linkedIn": "https://linkedin.com/in/sarahjohnson",
  "createdAt": "2025-12-18T10:05:00.000Z",
  "updatedAt": "2025-12-18T10:05:00.000Z",
  "createdBy": "user-admin-001"
}
```

---

### 3. Lead / Opportunity

Represents a potential sales opportunity.

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Unique identifier (e.g., "crm:lead:1234567890") |
| `organisationId` | string | Foreign key to Organisation.id |
| `contactId` | string | Foreign key to Contact.id |
| `name` | string | Lead/opportunity name (e.g., "Defence Tech Enterprise Deal") |
| `stage` | PipelineStage | Current pipeline stage |
| `expectedValue` | number | Expected contract value in AUD |
| `probability` | number | Win probability percentage (0-100) |
| `expectedCloseDate` | string | ISO date string for expected close |
| `owner` | string | User ID of the internal owner/sales rep |
| `source` | string | Lead source (e.g., "Website", "Referral", "Cold Outreach") |
| `description` | string | Description of the opportunity |
| `competitors` | string | Known competitors in this deal |
| `nextSteps` | string | Next actions required |
| `priority` | enum | Priority level: 'Low', 'Medium', 'High', 'Critical' |
| `tags` | string[] | Tags for categorization (e.g., ["DISP", "Enterprise"]) |
| `createdAt` | string | ISO date string when record created |
| `updatedAt` | string | ISO date string when record last updated |
| `closedAt` | string? | ISO date string when deal was closed (won/lost) |
| `createdBy` | string | User ID who created the record |

**Example:**
```json
{
  "id": "crm:lead:1702897256789",
  "organisationId": "crm:org:1702897234567",
  "contactId": "crm:contact:1702897245678",
  "name": "Defence Tech Enterprise Platform Deal",
  "stage": "Proposal / Pricing Sent",
  "expectedValue": 250000,
  "probability": 60,
  "expectedCloseDate": "2026-03-31",
  "owner": "user-sales-001",
  "source": "Referral",
  "description": "Enterprise deployment with DISP compliance requirements",
  "competitors": "Competitor A, Competitor B",
  "nextSteps": "Follow up on proposal, schedule security assessment",
  "priority": "High",
  "tags": ["DISP", "Enterprise", "Q1-2026"],
  "createdAt": "2025-12-18T10:10:00.000Z",
  "updatedAt": "2025-12-18T14:30:00.000Z",
  "createdBy": "user-sales-001"
}
```

---

### 4. Engagement Activity

Represents interactions with leads and organisations.

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Unique identifier (e.g., "crm:activity:1234567890") |
| `leadId` | string | Foreign key to Lead.id |
| `organisationId` | string | Foreign key to Organisation.id |
| `contactId` | string? | Optional foreign key to Contact.id |
| `type` | ActivityType | Type of engagement activity |
| `subject` | string | Activity subject/title |
| `description` | string | Detailed description or notes (free text) |
| `outcome` | string | Outcome of the activity |
| `scheduledAt` | string? | ISO date string for scheduled activities |
| `completedAt` | string? | ISO date string when activity completed |
| `duration` | number | Duration in minutes |
| `owner` | string | User ID who owns/performed the activity |
| `createdAt` | string | ISO date string when record created |
| `createdBy` | string | User ID who created the record |

**Example:**
```json
{
  "id": "crm:activity:1702897267890",
  "leadId": "crm:lead:1702897256789",
  "organisationId": "crm:org:1702897234567",
  "contactId": "crm:contact:1702897245678",
  "type": "Phone Contact",
  "subject": "Proposal Follow-up Call",
  "description": "Discussed pricing structure and DISP compliance requirements",
  "outcome": "Positive - CTO interested in proceeding to next stage",
  "scheduledAt": "2025-12-18T14:00:00.000Z",
  "completedAt": "2025-12-18T14:30:00.000Z",
  "duration": 30,
  "owner": "user-sales-001",
  "createdAt": "2025-12-18T12:00:00.000Z",
  "createdBy": "user-sales-001"
}
```

---

### 5. Proposal / Contract

Represents formal proposals sent to prospects.

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Unique identifier (e.g., "crm:proposal:1234567890") |
| `leadId` | string | Foreign key to Lead.id |
| `organisationId` | string | Foreign key to Organisation.id |
| `proposalNumber` | string | Unique proposal/quote number |
| `version` | number | Version number (for revisions) |
| `title` | string | Proposal title |
| `totalValue` | number | Total proposal value in AUD |
| `validUntil` | string | ISO date string - proposal expiry date |
| `status` | enum | 'Draft', 'Sent', 'Under Review', 'Accepted', 'Rejected', 'Expired' |
| `documentUrl` | string? | URL to proposal document (if stored) |
| `terms` | string | Payment terms and conditions |
| `notes` | string | Internal notes |
| `sentAt` | string? | ISO date string when proposal was sent |
| `acceptedAt` | string? | ISO date string when proposal was accepted |
| `sentBy` | string | User ID who sent the proposal |
| `createdAt` | string | ISO date string when record created |
| `updatedAt` | string | ISO date string when record last updated |
| `createdBy` | string | User ID who created the record |

**Example:**
```json
{
  "id": "crm:proposal:1702897278901",
  "leadId": "crm:lead:1702897256789",
  "organisationId": "crm:org:1702897234567",
  "proposalNumber": "PROP-2025-0042",
  "version": 2,
  "title": "Fourtify Enterprise Platform - Defence Tech Solutions",
  "totalValue": 250000,
  "validUntil": "2026-01-31",
  "status": "Sent",
  "documentUrl": "https://storage.example.com/proposals/PROP-2025-0042-v2.pdf",
  "terms": "Net 30 days, 3 annual payments",
  "notes": "Revised pricing after initial feedback",
  "sentAt": "2025-12-15T09:00:00.000Z",
  "sentBy": "user-sales-001",
  "createdAt": "2025-12-10T14:00:00.000Z",
  "updatedAt": "2025-12-15T09:00:00.000Z",
  "createdBy": "user-sales-001"
}
```

---

### 6. User (Internal)

Represents internal Fourtify Defence team members.

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Unique identifier (e.g., "crm:user:1234567890") |
| `email` | string | User email (login) |
| `firstName` | string | User first name |
| `lastName` | string | User last name |
| `role` | enum | 'Admin', 'Sales Manager', 'Sales Rep', 'Support', 'Viewer' |
| `phone` | string | User phone number |
| `isActive` | boolean | Whether user account is active |
| `avatar` | string? | Avatar image URL |
| `createdAt` | string | ISO date string when record created |
| `lastLoginAt` | string? | ISO date string of last login |

---

## Entity Relationships

```
┌─────────────────┐
│  Organisation   │
│  (1)            │
└────────┬────────┘
         │
         │ has many
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│    Contact      │    │      Lead       │
│    (Many)       │    │     (Many)      │
└─────────────────┘    └────────┬────────┘
         │                      │
         │                      │ has many
         │                      ├──────────────────────┐
         │                      │                      │
         │                      ▼                      ▼
         │             ┌─────────────────┐    ┌─────────────────┐
         │             │    Activity     │    │    Proposal     │
         └────────────▶│     (Many)      │    │     (Many)      │
   can be involved in └─────────────────┘    └─────────────────┘


                ┌─────────────────┐
                │      User       │
                │   (Internal)    │
                └────────┬────────┘
                         │
                         │ owns
                         ├──────────────────────┐
                         │                      │
                         ▼                      ▼
                  ┌─────────────┐      ┌──────────────┐
                  │    Lead     │      │   Activity   │
                  │   (Many)    │      │    (Many)    │
                  └─────────────┘      └──────────────┘
```

### Relationship Summary

1. **Organisation → Contact** (1:Many)
   - One Organisation can have many Contacts
   - `Contact.organisationId` → `Organisation.id`

2. **Organisation → Lead** (1:Many)
   - One Organisation can have many Leads/Opportunities
   - `Lead.organisationId` → `Organisation.id`

3. **Contact → Lead** (1:Many)
   - One Contact can be associated with many Leads
   - `Lead.contactId` → `Contact.id`

4. **Lead → Activity** (1:Many)
   - One Lead can have many Engagement Activities
   - `Activity.leadId` → `Lead.id`

5. **Lead → Proposal** (1:Many)
   - One Lead can have many Proposals (versions/revisions)
   - `Proposal.leadId` → `Lead.id`

6. **User → Lead** (1:Many) [as Owner]
   - One User can own many Leads
   - `Lead.owner` → `User.id`

7. **User → Activity** (1:Many) [as Owner]
   - One User can perform many Activities
   - `Activity.owner` → `User.id`

8. **Organisation → Activity** (1:Many)
   - One Organisation can have many Activities
   - `Activity.organisationId` → `Organisation.id`

9. **Contact → Activity** (1:Many) [Optional]
   - One Contact can be involved in many Activities
   - `Activity.contactId` → `Contact.id` (optional)

---

## Pipeline Stages

The sales pipeline consists of 10 defined stages that leads progress through:

| Stage | Description | Typical Probability |
|-------|-------------|---------------------|
| **New Lead** | Initial lead capture | 10% |
| **Qualified Lead** | Lead has been validated and qualified | 20% |
| **Engaged – Under Discussion** | Active conversations with prospect | 40% |
| **Proposal / Pricing Sent** | Formal proposal delivered | 60% |
| **Security Assessment** | Technical and security evaluation underway | 70% |
| **Awaiting Decision** | Waiting for final decision from prospect | 80% |
| **Contracting / Legal** | Contract negotiation and legal review | 90% |
| **Closed Won** | Deal successfully closed ✅ | 100% |
| **Closed Lost** | Deal lost to competitor or no decision ❌ | 0% |
| **On Hold** | Deal paused temporarily | 0% |

### Stage Colors (UI)

Each stage has a designated color for visual consistency:

- **New Lead**: Blue
- **Qualified Lead**: Cyan
- **Engaged – Under Discussion**: Purple
- **Proposal / Pricing Sent**: Indigo
- **Security Assessment**: Yellow
- **Awaiting Decision**: Orange
- **Contracting / Legal**: Amber
- **Closed Won**: Tactical Green (#00ff88)
- **Closed Lost**: Red
- **On Hold**: Gray

---

## Activity Types

Engagement activities can be categorized as:

| Type | Icon | Description |
|------|------|-------------|
| **Cold Call** | 📞 | Initial outbound call to prospect |
| **Cold Email** | 📧 | Initial outbound email to prospect |
| **Phone Contact** | ☎️ | Follow-up phone conversation |
| **Event** | 🎯 | Meeting at conference, trade show, etc. |
| **Meeting** | 👥 | Scheduled in-person or virtual meeting |
| **Demo** | 🖥️ | Product demonstration |
| **Follow-up** | 🔄 | General follow-up activity |
| **Other** | 📝 | Other types of engagement |

---

## API Endpoints

### Organisations

- `GET /crm/organisations` - List all organisations
- `GET /crm/organisations/:id` - Get single organisation
- `POST /crm/organisations` - Create new organisation
- `PUT /crm/organisations/:id` - Update organisation

### Contacts

- `GET /crm/contacts` - List all contacts
- `POST /crm/contacts` - Create new contact

### Leads

- `GET /crm/leads` - List all leads
- `POST /crm/leads` - Create new lead
- `PUT /crm/leads/:id` - Update lead (including stage changes)
- `DELETE /crm/leads/:id` - Delete single lead
- `DELETE /crm/leads` - Delete all leads

### Activities

- `GET /crm/activities?leadId=xxx` - Get activities for a lead
- `GET /crm/activities?organisationId=xxx` - Get activities for an organisation
- `POST /crm/activities` - Create new activity

### Proposals

- `GET /crm/proposals?leadId=xxx` - Get proposals for a lead
- `POST /crm/proposals` - Create new proposal

### Pipeline

- `GET /crm/pipeline` - Get pipeline overview
- `GET /crm/pipeline/stages` - Get available pipeline stages

---

## UI Components

### Key Features Implemented

1. **Pipeline Page**
   - View all leads with organisation and contact details
   - Update lead stage via dropdown
   - Display key fields: Organisation name, stage, expected value, owner
   - Create lead linked to existing Organisation + Contact
   - Filter and search leads
   - Pipeline statistics dashboard

2. **Organisations Page**
   - Grid view of all organisations
   - Add new organisation
   - Add contacts to organisation
   - View organisation contacts
   - Organisation statistics

3. **Leads Page**
   - Bulk import from Excel (up to 548 leads)
   - Automatic duplicate detection
   - Supplier name tracking
   - Status filtering

4. **Create Lead Workflow**
   - Select existing Organisation
   - Select Contact from that Organisation
   - Set expected value, close date, priority
   - Assign owner and tags
   - Set initial pipeline stage

---

## Future Expansion

The data model is designed to accommodate future features:

### Planned Entities

**Subscription**
- Manage recurring revenue from clients
- Link to Organisation
- Track MRR, ARR, renewal dates

**Support Ticket**
- Customer support and issue tracking
- Link to Organisation and Contact
- Priority, status, assignment

**Email Campaign**
- Already partially implemented
- Enhanced tracking and analytics

**Contract**
- Formal contract management
- Version control
- E-signature integration

**Task**
- Internal task management
- Link to Leads and Activities
- Assignment and due dates

### Expansion Considerations

- **No Database Schema Changes Required**: Using KV store allows flexible schema evolution
- **Backward Compatibility**: Legacy fields preserved in Lead entity
- **API Versioning**: Can be added when breaking changes needed
- **Reporting**: All entities designed with reporting in mind

---

## Best Practices

### When Creating Leads

1. ✅ Always create Organisation first
2. ✅ Add at least one Contact to the Organisation
3. ✅ Link Lead to both Organisation and Contact
4. ✅ Set realistic expected value and close date
5. ✅ Assign an owner immediately
6. ✅ Add relevant tags for filtering

### When Managing Pipeline

1. ✅ Update stage as soon as status changes
2. ✅ Log activities for each significant interaction
3. ✅ Keep probability aligned with stage
4. ✅ Update expected close date when it shifts
5. ✅ Add notes in activities, not just in lead description

### Data Quality

1. ✅ Use consistent naming conventions
2. ✅ Keep organisation data up-to-date
3. ✅ Mark primary contacts clearly
4. ✅ Remove duplicate organisations/contacts
5. ✅ Archive closed deals instead of deleting

---

## Technical Notes

### Storage

- **Backend**: Supabase Key-Value Store
- **Prefix Pattern**: `crm:{entity}:{timestamp}`
- **Relationships**: Managed via ID references (foreign keys)

### Date Handling

- All dates stored as ISO 8601 strings
- Example: `"2025-12-18T10:00:00.000Z"`
- Display format: Localized based on user preferences

### Currency

- All monetary values in AUD (Australian Dollars)
- Stored as numbers (not strings)
- Display formatted with currency symbol

---

## Support

For questions about the CRM data model:
- **Technical Lead**: Fourtify Development Team
- **Documentation**: `/supabase/functions/server/crm-data-model.tsx`
- **API Reference**: See API Endpoints section above

---

**End of Documentation**
