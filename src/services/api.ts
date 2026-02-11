// CRM API Configuration and Service
// Replace the mock data imports in your components with these API calls

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_URL || API_BASE_URL;

// Helper function for API calls
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (!text) {
        return undefined as T;
    }

    if (!contentType.includes('application/json')) {
        return text as unknown as T;
    }

    return JSON.parse(text) as T;
}

// Types (matching backend models)
export interface Organisation {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    website: string;
    industry: string;
    size: string;
    notes: string;
    status: string;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
}

export interface Contact {
    id: string;
    organisationId: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    email: string;
    phone: string;
    mobile: string;
    isPrimary: boolean;
    notes: string;
    linkedIn: string;
    status: string;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ContactActivity {
    id: string;
    contactId: string;
    activityType: string;
    fieldName: string;
    oldValue: string;
    newValue: string;
    description: string;
    userName: string;
    createdAt: string;
}

// Invoice and Payment interfaces
export interface InvoiceLineItem {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Invoice {
    id: string;
    clientId: string;
    clientName?: string;
    invoiceNumber: string;
    description: string;
    amount: number;
    tax: number;
    totalAmount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    issueDate: string;
    dueDate?: string;
    paidDate?: string;
    notes: string;
    lineItems?: InvoiceLineItem[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvoiceRequest {
    clientId: string;
    invoiceNumber: string;
    description?: string;
    amount: number;
    tax?: number;
    status?: string;
    issueDate?: string;
    dueDate?: string;
    notes?: string;
    lineItems?: InvoiceLineItem[];
}

export interface Payment {
    id: string;
    clientId: string;
    clientName?: string;
    invoiceId?: string;
    invoiceNumber?: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    reference: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePaymentRequest {
    clientId: string;
    invoiceId?: string;
    amount: number;
    paymentMethod?: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
}

export interface Champion {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    organizationName: string;
    address: string;
    allocatedSale: number;
    activeClients: number;
    conversionRate: number;
    performanceScore: number;
    lastActivity: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateChampionRequest {
    name: string;
    email: string;
    phone: string;
    role?: string;
    organizationName: string;
    address: string;
    allocatedSale: number;
    activeClients: number;
    performanceScore: number;
}

export interface Lead {
    id: string;
    organisationId: string;
    contactId: string;
    name: string;
    stage: string;
    expectedValue: number;
    probability: number;
    expectedCloseDate: string;
    owner: string;
    source: string;
    description: string;
    priority: string;
    tags: string[];
    createdAt: string;
    updatedAt?: string;
}

export interface DashboardStats {
    totalLeads: number;
    activeLeads: number;
    totalOrganisations: number;
    totalContacts: number;
    pipelineValue: number;
    closedWonValue: number;
    conversionRate: number;
    avgDealSize: number;
}

// Organisation API
export const organisationApi = {
    getAll: () => apiFetch<{ organisations: Organisation[] }>('/organisations'),
    getById: (id: string) => apiFetch<Organisation>(`/organisations/${id}`),
    create: (data: Partial<Organisation>) =>
        apiFetch<Organisation>('/organisations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Organisation>) =>
        apiFetch<Organisation>(`/organisations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
        apiFetch<void>(`/organisations/${id}`, { method: 'DELETE' }),
};

// Contact API
export const contactApi = {
    getAll: (organisationId?: string) => {
        const query = organisationId ? `?organisationId=${organisationId}` : '';
        return apiFetch<{ contacts: Contact[] }>(`/contacts${query}`);
    },
    getById: (id: string) => apiFetch<Contact>(`/contacts/${id}`),
    create: (data: Partial<Contact>) =>
        apiFetch<Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Contact>) =>
        apiFetch<Contact>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
        apiFetch<void>(`/contacts/${id}`, { method: 'DELETE' }),
    getActivities: (id: string) =>
        apiFetch<{ activities: ContactActivity[] }>(`/contacts/${id}/activities`),
};

// Lead API
export const leadApi = {
    getAll: (stage?: string) => {
        const query = stage ? `?stage=${encodeURIComponent(stage)}` : '';
        return apiFetch<{ leads: Lead[] }>(`/leads${query}`);
    },
    getById: (id: string) => apiFetch<Lead>(`/leads/${id}`),
    create: (data: Partial<Lead>) =>
        apiFetch<Lead>('/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Lead>) =>
        apiFetch<Lead>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStage: (id: string, stage: string) =>
        apiFetch<Lead>(`/leads/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
    delete: (id: string) =>
        apiFetch<void>(`/leads/${id}`, { method: 'DELETE' }),
    deleteAll: () =>
        apiFetch<void>('/leads', { method: 'DELETE' }),
};

// Stats API
export const statsApi = {
    getDashboardStats: () => apiFetch<DashboardStats>('/stats'),
    getRecentActivities: (limit = 20) =>
        apiFetch<{ activities: unknown[] }>(`/stats/activities?limit=${limit}`),
};

// Email types
export interface SentEmail {
    id: string;
    toEmail: string;
    toName: string;
    fromEmail: string;
    fromName: string;
    subject: string;
    body: string;
    htmlBody: string;
    status: string;
    resendId?: string;
    errorMessage?: string;
    contactId?: string;
    organisationId?: string;
    sentBy: string;
    sentAt: string;
    contact?: Contact;
    organisation?: Organisation;
}

export interface EmailContact {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    organisationName?: string;
    organisationId?: string;
}

export interface SendEmailRequest {
    toEmail: string;
    toName?: string;
    subject: string;
    body: string;
    htmlBody?: string;
    contactId?: string;
    organisationId?: string;
    sentBy?: string;
}

// Email API
export const emailApi = {
    send: (data: SendEmailRequest) =>
        apiFetch<{ success: boolean; message: string; email: SentEmail }>('/email/send', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    sendToContact: (contactId: string, data: { subject: string; body: string; htmlBody?: string }) =>
        apiFetch<{ success: boolean; message: string; email: SentEmail }>(`/email/send-to-contact/${contactId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    getHistory: (limit = 50) =>
        apiFetch<{ emails: SentEmail[]; count: number }>(`/email/history?limit=${limit}`),
    getContacts: (search?: string, limit = 100, state?: string) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (state) params.append('state', state);
        params.append('limit', limit.toString());
        return apiFetch<{ contacts: EmailContact[]; count: number }>(`/email/contacts?${params}`);
    },
    bulkSend: (data: {
        contactIds: string[];
        subject: string;
        body: string;
        htmlBody?: string;
        templateId?: string;
        campaignName?: string;
    }) =>
        apiFetch<{
            success: boolean;
            message: string;
            sentCount: number;
            failedCount: number;
            campaignId?: string;
        }>('/email/bulk-send', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    getCampaigns: () =>
        apiFetch<{
            campaigns: {
                id: string;
                name: string;
                subject: string;
                status: string;
                totalRecipients: number;
                sentCount: number;
                openedCount: number;
                clickedCount: number;
                bouncedCount: number;
                openRate: number;
                clickRate: number;
                createdAt: string;
                sentAt?: string;
            }[];
        }>('/email/campaigns'),
};

export const mediaApi = {
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${MEDIA_BASE_URL}/uploads`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `API Error: ${response.status}`);
        }
        return response.json() as Promise<{ url: string }>;
    },
    upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${MEDIA_BASE_URL}/uploads`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `API Error: ${response.status}`);
        }
        return response.json() as Promise<{ url: string }>;
    },
};

// Templates API
export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    htmlBody: string;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
}

export const templateApi = {
    getAll: () => apiFetch<{ templates: EmailTemplate[] }>('/templates'),
    getById: (id: string) => apiFetch<EmailTemplate>(`/templates/${id}`),
    create: (data: { name: string; subject: string; body: string; htmlBody?: string }) =>
        apiFetch<EmailTemplate>('/templates', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: string, data: { name: string; subject: string; body: string; htmlBody?: string }) =>
        apiFetch<EmailTemplate>(`/templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: string) =>
        apiFetch<void>(`/templates/${id}`, { method: 'DELETE' }),
};

// Auth types
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    signatureHtml?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: AuthUser;
}

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    createdAt: string;
    emailVerifiedAt?: string;
    approvedAt?: string;
    approvedBy?: string;
    lastLoginAt?: string;
}

// Auth API (no auth required)
export const authApi = {
    register: (data: { email: string; name: string; password: string }) =>
        apiFetch<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    login: (data: { email: string; password: string }) =>
        apiFetch<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    verifyEmail: (token: string) =>
        apiFetch<AuthResponse>(`/auth/verify-email?token=${token}`),
    getMe: (token: string) =>
        fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        }).then(r => r.json()) as Promise<AuthResponse>,
    updateProfile: (data: Partial<AuthUser>) =>
        fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify(data),
        }).then(r => r.json()) as Promise<AuthResponse>,
};

// Admin API (protected, SuperAdmin only)
const authFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.status}`);
    }
    return response.json();
};

export const adminApi = {
    getPendingUsers: () => authFetch<AdminUser[]>('/admin/pending-users'),
    getAllUsers: () => authFetch<AdminUser[]>('/admin/users'),
    approveUser: (userId: string) =>
        authFetch<{ success: boolean; message: string }>(`/admin/approve/${userId}`, { method: 'POST' }),
    rejectUser: (userId: string, reason: string) =>
        authFetch<{ success: boolean; message: string }>(`/admin/reject/${userId}`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }),
    promoteUser: (userId: string) =>
        authFetch<{ success: boolean; message: string }>(`/admin/promote/${userId}`, { method: 'POST' }),
    demoteUser: (userId: string) =>
        authFetch<{ success: boolean; message: string }>(`/admin/demote/${userId}`, { method: 'POST' }),
};

// Meeting types
export interface Meeting {
    id: string;
    title: string;
    description: string;
    meetingDate: string;
    durationMinutes: number;
    location: string;
    meetingType: string;
    status: string;
    notes: string;
    contactId?: string;
    contactName?: string;
    leadId?: string;
    leadTitle?: string;
    organisationId?: string;
    organisationName?: string;
    createdBy: string;
    createdAt: string;
}

export interface CreateMeetingRequest {
    title: string;
    description?: string;
    meetingDate: string;
    durationMinutes?: number;
    location?: string;
    meetingType?: string;
    contactId?: string;
    leadId?: string;
    organisationId?: string;
}

// Meetings API
export const meetingsApi = {
    getAll: (upcoming = false) =>
        apiFetch<Meeting[]>(`/meetings${upcoming ? '?upcoming=true' : ''}`),
    getById: (id: string) => apiFetch<Meeting>(`/meetings/${id}`),
    create: (data: CreateMeetingRequest) =>
        apiFetch<Meeting>('/meetings', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: string, data: Partial<Meeting>) =>
        apiFetch<Meeting>(`/meetings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: string) =>
        apiFetch<void>(`/meetings/${id}`, { method: 'DELETE' }),
    complete: (id: string, notes?: string) =>
        apiFetch<Meeting>(`/meetings/${id}/complete`, {
            method: 'PUT',
            body: JSON.stringify({ notes }),
        }),
    cancel: (id: string) =>
        apiFetch<Meeting>(`/meetings/${id}/cancel`, { method: 'PUT' }),
};

// Client types and API
export interface Client {
    id: string;
    organisationId: string;
    organisationName?: string;
    plan: string;
    status: 'active' | 'onboarding' | 'churned';
    mrr: number;
    contractStart?: string;
    contractEnd?: string;
    dispCompliant: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClientRequest {
    organisationId: string;
    plan?: string;
    status?: string;
    mrr?: number;
    contractStart?: string;
    contractEnd?: string;
    dispCompliant?: boolean;
    notes?: string;
}

export const clientApi = {
    getAll: (status?: string) =>
        apiFetch<{ clients: Client[] }>(`/clients${status ? `?status=${status}` : ''}`),
    getById: (id: string) =>
        apiFetch<Client>(`/clients/${id}`),
    create: (data: CreateClientRequest) =>
        apiFetch<Client>('/clients', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: string, data: Partial<CreateClientRequest>) =>
        apiFetch<Client>(`/clients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: string) =>
        apiFetch<{ message: string; deletedInvoices: number; deletedPayments: number }>(`/clients/${id}`, { method: 'DELETE' }),
    getStats: () =>
        apiFetch<{
            totalClients: number;
            activeClients: number;
            onboarding: number;
            churned: number;
            totalMrr: number;
            dispCompliantCount: number;
            dispComplianceRate: number;
        }>('/clients/stats'),
    calculateMrr: (id: string) =>
        apiFetch<{
            clientId: string;
            calculatedMrr: number;
            invoiceCount: number;
            totalRevenue: number;
        }>(`/clients/${id}/calculate-mrr`, { method: 'POST' }),
    updateMrrFromInvoices: (id: string) =>
        apiFetch<Client>(`/clients/${id}/update-mrr-from-invoices`, { method: 'PUT' }),
};

export const invoiceApi = {
    getAll: (clientId?: string, status?: string) => {
        const params = new URLSearchParams();
        if (clientId) params.append('clientId', clientId);
        if (status) params.append('status', status);
        return apiFetch<{ invoices: Invoice[] }>(`/invoices${params.toString() ? '?' + params.toString() : ''}`);
    },
    getById: (id: string) =>
        apiFetch<Invoice>(`/invoices/${id}`),
    create: (data: CreateInvoiceRequest) =>
        apiFetch<Invoice>('/invoices', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: string, data: Partial<CreateInvoiceRequest>) =>
        apiFetch<Invoice>(`/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: string) =>
        apiFetch<void>(`/invoices/${id}`, { method: 'DELETE' }),
    send: (id: string) =>
        apiFetch<{ success: boolean; message: string; sentTo: string }>(`/invoices/${id}/send`, {
            method: 'POST',
        }),
    getStats: (clientId?: string) =>
        apiFetch<{
            totalInvoices: number;
            totalAmount: number;
            paidAmount: number;
            unpaidAmount: number;
            overdueAmount: number;
        }>(`/invoices/stats${clientId ? '?clientId=' + clientId : ''}`),
};

export const paymentApi = {
    getAll: (clientId?: string, invoiceId?: string) => {
        const params = new URLSearchParams();
        if (clientId) params.append('clientId', clientId);
        if (invoiceId) params.append('invoiceId', invoiceId);
        return apiFetch<{ payments: Payment[] }>(`/payments${params.toString() ? '?' + params.toString() : ''}`);
    },
    getById: (id: string) =>
        apiFetch<Payment>(`/payments/${id}`),
    create: (data: CreatePaymentRequest) =>
        apiFetch<Payment>('/payments', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: string, data: Partial<CreatePaymentRequest>) =>
        apiFetch<Payment>(`/payments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: string) =>
        apiFetch<void>(`/payments/${id}`, { method: 'DELETE' }),
    getStats: (clientId?: string) =>
        apiFetch<{
            totalPayments: number;
            totalAmount: number;
        }>(`/payments/stats${clientId ? '?clientId=' + clientId : ''}`),
};

export const championApi = {
    getAll: (role?: string, search?: string) => {
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        if (search) params.append('search', search);
        return apiFetch<{ champions: Champion[] }>(`/champions${params.toString() ? '?' + params.toString() : ''}`);
    },
    getById: (id: string) =>
        apiFetch<Champion>(`/champions/${id}`),
    create: (data: CreateChampionRequest) =>
        apiFetch<Champion>('/champions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: string, data: Partial<CreateChampionRequest>) =>
        apiFetch<Champion>(`/champions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: string) =>
        apiFetch<void>(`/champions/${id}`, { method: 'DELETE' }),
    getStats: () =>
        apiFetch<{
            totalChampions: number;
            totalTargetedClients: number;
            totalActiveClients: number;
            averageConversionRate: number;
            averagePerformanceScore: number;
            topPerformers: Array<{ id: string; name: string; performanceScore: number }>;
        }>('/champions/stats'),
};

export default {
    organisations: organisationApi,
    contacts: contactApi,
    leads: leadApi,
    stats: statsApi,
    email: emailApi,
    media: mediaApi,
    templates: templateApi,
    auth: authApi,
    admin: adminApi,
    meetings: meetingsApi,
    clients: clientApi,
    invoices: invoiceApi,
    payments: paymentApi,
    champions: championApi,
};
