/**
 * Mock Data for CRM - Frontend Only
 * This provides demo data for the CRM application
 */

import { Organisation, Contact, Lead, Activity, User } from './crm-data-model';

// ============================================================================
// MOCK ORGANISATIONS
// ============================================================================
export const mockOrganisations: Organisation[] = [
    {
        id: 'crm:org:001',
        name: 'Defence Technology Solutions',
        phone: '+61 2 9000 1234',
        email: 'contact@defencetech.com.au',
        address: '123 Military Drive, Canberra ACT 2600',
        website: 'https://defencetech.com.au',
        industry: 'Defence',
        size: '201-1000',
        notes: 'Major defence contractor, DISP Level 2 certified',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-06-20T14:30:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:org:002',
        name: 'Secure Systems Australia',
        phone: '+61 3 8000 5678',
        email: 'info@securesystems.com.au',
        address: '45 Innovation Blvd, Melbourne VIC 3000',
        website: 'https://securesystems.com.au',
        industry: 'Cybersecurity',
        size: '51-200',
        notes: 'Specialises in government cybersecurity solutions',
        createdAt: '2024-02-20T09:00:00Z',
        updatedAt: '2024-07-15T11:00:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:org:003',
        name: 'AeroSpace Dynamics',
        phone: '+61 7 3000 9012',
        email: 'hello@aerospacedynamics.com.au',
        address: '78 Aviation Way, Brisbane QLD 4000',
        website: 'https://aerospacedynamics.com.au',
        industry: 'Aerospace',
        size: '1000+',
        notes: 'Aircraft maintenance and logistics',
        createdAt: '2024-03-10T08:00:00Z',
        updatedAt: '2024-08-01T16:45:00Z',
        createdBy: 'crm:user:002',
    },
    {
        id: 'crm:org:004',
        name: 'Maritime Solutions Group',
        phone: '+61 8 9000 3456',
        email: 'enquiries@maritimesolutions.com.au',
        address: '200 Harbour Road, Perth WA 6000',
        website: 'https://maritimesolutions.com.au',
        industry: 'Defence',
        size: '51-200',
        notes: 'Naval engineering and ship maintenance',
        createdAt: '2024-04-05T07:30:00Z',
        updatedAt: '2024-09-10T12:00:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:org:005',
        name: 'Strategic Consulting Partners',
        phone: '+61 2 9500 7890',
        email: 'info@strategicconsulting.com.au',
        address: '55 Strategy Lane, Sydney NSW 2000',
        website: 'https://strategicconsulting.com.au',
        industry: 'Government',
        size: '1-50',
        notes: 'Government consulting and advisory services',
        createdAt: '2024-05-12T11:00:00Z',
        updatedAt: '2024-10-05T09:15:00Z',
        createdBy: 'crm:user:002',
    },
];

// ============================================================================
// MOCK CONTACTS
// ============================================================================
export const mockContacts: Contact[] = [
    {
        id: 'crm:contact:001',
        organisationId: 'crm:org:001',
        firstName: 'James',
        lastName: 'Mitchell',
        jobTitle: 'Chief Technology Officer',
        email: 'james.mitchell@defencetech.com.au',
        phone: '+61 2 9000 1235',
        mobile: '+61 400 111 222',
        isPrimary: true,
        notes: 'Key decision maker, prefers email communication',
        linkedIn: 'https://linkedin.com/in/jamesmitchell',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-06-20T14:30:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:contact:002',
        organisationId: 'crm:org:001',
        firstName: 'Sarah',
        lastName: 'Chen',
        jobTitle: 'Procurement Manager',
        email: 'sarah.chen@defencetech.com.au',
        phone: '+61 2 9000 1236',
        mobile: '+61 400 333 444',
        isPrimary: false,
        notes: 'Handles all vendor contracts',
        linkedIn: 'https://linkedin.com/in/sarahchen',
        createdAt: '2024-01-20T09:00:00Z',
        updatedAt: '2024-07-10T10:00:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:contact:003',
        organisationId: 'crm:org:002',
        firstName: 'Michael',
        lastName: 'Thompson',
        jobTitle: 'Managing Director',
        email: 'michael.thompson@securesystems.com.au',
        phone: '+61 3 8000 5679',
        mobile: '+61 400 555 666',
        isPrimary: true,
        notes: 'Founder, very hands-on with all deals',
        linkedIn: 'https://linkedin.com/in/michaelthompson',
        createdAt: '2024-02-20T09:30:00Z',
        updatedAt: '2024-08-05T11:00:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:contact:004',
        organisationId: 'crm:org:003',
        firstName: 'Emma',
        lastName: 'Williams',
        jobTitle: 'Head of Operations',
        email: 'emma.williams@aerospacedynamics.com.au',
        phone: '+61 7 3000 9013',
        mobile: '+61 400 777 888',
        isPrimary: true,
        notes: 'Reports directly to CEO',
        linkedIn: 'https://linkedin.com/in/emmawilliams',
        createdAt: '2024-03-10T08:30:00Z',
        updatedAt: '2024-09-01T15:00:00Z',
        createdBy: 'crm:user:002',
    },
    {
        id: 'crm:contact:005',
        organisationId: 'crm:org:004',
        firstName: 'David',
        lastName: 'Brown',
        jobTitle: 'Security Director',
        email: 'david.brown@maritimesolutions.com.au',
        phone: '+61 8 9000 3457',
        mobile: '+61 400 999 000',
        isPrimary: true,
        notes: 'Ex-Navy, very security conscious',
        linkedIn: 'https://linkedin.com/in/davidbrown',
        createdAt: '2024-04-05T08:00:00Z',
        updatedAt: '2024-10-01T09:00:00Z',
        createdBy: 'crm:user:001',
    },
];

// ============================================================================
// MOCK LEADS
// ============================================================================
export const mockLeads: Lead[] = [
    {
        id: 'crm:lead:001',
        organisationId: 'crm:org:001',
        contactId: 'crm:contact:001',
        name: 'DISP Certification Consulting',
        stage: 'Proposal / Pricing Sent',
        expectedValue: 150000,
        probability: 60,
        expectedCloseDate: '2024-12-15',
        owner: 'crm:user:001',
        source: 'Referral',
        description: 'Need assistance with DISP Level 2 certification process',
        competitors: 'SecureDefence Ltd',
        nextSteps: 'Follow up on proposal review',
        priority: 'High',
        tags: ['DISP', 'Enterprise', 'Government'],
        createdAt: '2024-06-01T10:00:00Z',
        updatedAt: '2024-10-15T14:00:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:lead:002',
        organisationId: 'crm:org:002',
        contactId: 'crm:contact:003',
        name: 'Cybersecurity Assessment Suite',
        stage: 'Engaged – Under Discussion',
        expectedValue: 85000,
        probability: 40,
        expectedCloseDate: '2025-01-20',
        owner: 'crm:user:001',
        source: 'Website',
        description: 'Interested in comprehensive security assessment tools',
        competitors: 'CyberGuard AU',
        nextSteps: 'Schedule technical demo',
        priority: 'Medium',
        tags: ['Cybersecurity', 'Software'],
        createdAt: '2024-07-15T09:00:00Z',
        updatedAt: '2024-10-10T11:30:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:lead:003',
        organisationId: 'crm:org:003',
        contactId: 'crm:contact:004',
        name: 'Aircraft Maintenance Management System',
        stage: 'New Lead',
        expectedValue: 320000,
        probability: 10,
        expectedCloseDate: '2025-03-30',
        owner: 'crm:user:002',
        source: 'Cold Outreach',
        description: 'Looking for integrated maintenance tracking solution',
        competitors: 'Unknown',
        nextSteps: 'Initial discovery call',
        priority: 'High',
        tags: ['Aerospace', 'Enterprise', 'Maintenance'],
        createdAt: '2024-09-20T08:00:00Z',
        updatedAt: '2024-10-18T10:00:00Z',
        createdBy: 'crm:user:002',
    },
    {
        id: 'crm:lead:004',
        organisationId: 'crm:org:004',
        contactId: 'crm:contact:005',
        name: 'Naval Security Compliance Program',
        stage: 'Security Assessment',
        expectedValue: 200000,
        probability: 70,
        expectedCloseDate: '2024-11-30',
        owner: 'crm:user:001',
        source: 'Event',
        description: 'Requirements for maritime security compliance',
        competitors: 'NavySecure Pty',
        nextSteps: 'Complete security questionnaire',
        priority: 'Critical',
        tags: ['Defence', 'Compliance', 'Maritime'],
        createdAt: '2024-05-10T07:00:00Z',
        updatedAt: '2024-10-20T16:00:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:lead:005',
        organisationId: 'crm:org:005',
        contactId: 'crm:contact:005',
        name: 'Government Advisory Retainer',
        stage: 'Closed Won',
        expectedValue: 75000,
        probability: 100,
        expectedCloseDate: '2024-09-01',
        owner: 'crm:user:002',
        source: 'Referral',
        description: '12-month advisory retainer for policy development',
        competitors: 'None',
        nextSteps: 'Contract signed - onboarding scheduled',
        priority: 'Low',
        tags: ['Government', 'Consulting'],
        createdAt: '2024-04-15T11:00:00Z',
        updatedAt: '2024-09-01T09:00:00Z',
        closedAt: '2024-09-01T09:00:00Z',
        createdBy: 'crm:user:002',
    },
    {
        id: 'crm:lead:006',
        organisationId: 'crm:org:001',
        contactId: 'crm:contact:002',
        name: 'Supply Chain Security Audit',
        stage: 'Qualified Lead',
        expectedValue: 45000,
        probability: 20,
        expectedCloseDate: '2025-02-15',
        owner: 'crm:user:001',
        source: 'Website',
        description: 'Need supply chain security evaluation',
        competitors: 'AuditSecure',
        nextSteps: 'Qualification call scheduled',
        priority: 'Medium',
        tags: ['Security', 'Audit'],
        createdAt: '2024-10-01T14:00:00Z',
        updatedAt: '2024-10-19T10:00:00Z',
        createdBy: 'crm:user:001',
    },
];

// ============================================================================
// MOCK USERS
// ============================================================================
export const mockUsers: User[] = [
    {
        id: 'crm:user:001',
        email: 'admin@fourtify.com.au',
        firstName: 'Alex',
        lastName: 'Johnson',
        role: 'Admin',
        phone: '+61 2 9000 0001',
        isActive: true,
        avatar: undefined,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-10-20T08:00:00Z',
    },
    {
        id: 'crm:user:002',
        email: 'sales@fourtify.com.au',
        firstName: 'Nicole',
        lastName: 'Taylor',
        role: 'Sales Manager',
        phone: '+61 2 9000 0002',
        isActive: true,
        avatar: undefined,
        createdAt: '2024-01-15T00:00:00Z',
        lastLoginAt: '2024-10-20T09:30:00Z',
    },
];

// ============================================================================
// MOCK ACTIVITIES
// ============================================================================
export const mockActivities: Activity[] = [
    {
        id: 'crm:activity:001',
        leadId: 'crm:lead:001',
        organisationId: 'crm:org:001',
        contactId: 'crm:contact:001',
        type: 'Meeting',
        subject: 'Initial Discovery Meeting',
        description: 'Discussed DISP requirements and timeline',
        outcome: 'Positive - moving to proposal phase',
        scheduledAt: '2024-09-15T10:00:00Z',
        completedAt: '2024-09-15T11:30:00Z',
        duration: 90,
        owner: 'crm:user:001',
        createdAt: '2024-09-10T09:00:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:activity:002',
        leadId: 'crm:lead:002',
        organisationId: 'crm:org:002',
        contactId: 'crm:contact:003',
        type: 'Demo',
        subject: 'Product Demo - Security Suite',
        description: 'Demonstrated key features of security assessment tools',
        outcome: 'Requested pricing information',
        scheduledAt: '2024-10-10T14:00:00Z',
        completedAt: '2024-10-10T15:00:00Z',
        duration: 60,
        owner: 'crm:user:001',
        createdAt: '2024-10-05T11:00:00Z',
        createdBy: 'crm:user:001',
    },
    {
        id: 'crm:activity:003',
        leadId: 'crm:lead:004',
        organisationId: 'crm:org:004',
        contactId: 'crm:contact:005',
        type: 'Follow-up',
        subject: 'Security Assessment Follow-up',
        description: 'Checking on security questionnaire status',
        outcome: 'In progress, expected completion next week',
        scheduledAt: '2024-10-18T09:00:00Z',
        completedAt: '2024-10-18T09:15:00Z',
        duration: 15,
        owner: 'crm:user:001',
        createdAt: '2024-10-17T16:00:00Z',
        createdBy: 'crm:user:001',
    },
];

// ============================================================================
// MOCK EMAIL DATA
// ============================================================================
export interface Email {
    id: string;
    subject: string;
    from: string;
    to: string;
    body: string;
    date: string;
    read: boolean;
    folder: 'inbox' | 'sent' | 'drafts' | 'trash';
    leadId?: string;
    contactId?: string;
}

export const mockEmails: Email[] = [
    {
        id: 'email:001',
        subject: 'RE: DISP Certification Proposal',
        from: 'james.mitchell@defencetech.com.au',
        to: 'admin@fourtify.com.au',
        body: 'Thank you for the proposal. We are reviewing internally and will get back to you by end of week.',
        date: '2024-10-18T10:30:00Z',
        read: true,
        folder: 'inbox',
        leadId: 'crm:lead:001',
        contactId: 'crm:contact:001',
    },
    {
        id: 'email:002',
        subject: 'Meeting Request - Security Assessment',
        from: 'admin@fourtify.com.au',
        to: 'michael.thompson@securesystems.com.au',
        body: 'Hi Michael, I wanted to follow up on our demo and schedule a time to discuss next steps.',
        date: '2024-10-17T14:00:00Z',
        read: true,
        folder: 'sent',
        leadId: 'crm:lead:002',
        contactId: 'crm:contact:003',
    },
    {
        id: 'email:003',
        subject: 'Quote Request - Maintenance System',
        from: 'emma.williams@aerospacedynamics.com.au',
        to: 'sales@fourtify.com.au',
        body: 'We would like to request a formal quote for the maintenance management system discussed.',
        date: '2024-10-19T09:15:00Z',
        read: false,
        folder: 'inbox',
        leadId: 'crm:lead:003',
        contactId: 'crm:contact:004',
    },
];

// ============================================================================
// MOCK STATS
// ============================================================================
export const mockStats = {
    totalLeads: mockLeads.length,
    activeContacts: mockContacts.length,
    emailsSent: 156,
    conversionRate: 24,
};

// ============================================================================
// MOCK CLIENTS (Closed Won Leads)
// ============================================================================
export const mockClients = mockLeads
    .filter(lead => lead.stage === 'Closed Won')
    .map(lead => {
        const org = mockOrganisations.find(o => o.id === lead.organisationId);
        const contact = mockContacts.find(c => c.id === lead.contactId);
        return {
            ...lead,
            organisation: org,
            contact: contact,
        };
    });
