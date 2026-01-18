import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { POST } from '@/app/api/apollo-enrich/route';

// Mock modules
const mockSearchPeople = mock(() => Promise.resolve([]));
const mockBulkEnrichPeople = mock(() => Promise.resolve([]));
const mockBulkEnrichPhonesWithWebhook = mock(() => Promise.resolve(undefined));
const mockCreateJob = mock(() => {});

mock.module('@/lib/apollo', () => ({
  apollo: {
    searchPeople: mockSearchPeople,
    bulkEnrichPeople: mockBulkEnrichPeople,
    bulkEnrichPhonesWithWebhook: mockBulkEnrichPhonesWithWebhook,
  },
}));

mock.module('@/lib/phone-enrichment-store', () => ({
  phoneEnrichmentStore: {
    createJob: mockCreateJob,
  },
}));

describe('/api/apollo-enrich', () => {
  beforeEach(() => {
    mockSearchPeople.mockClear();
    mockBulkEnrichPeople.mockClear();
    mockBulkEnrichPhonesWithWebhook.mockClear();
    mockCreateJob.mockClear();
    process.env.APOLLO_API_KEY = 'test-api-key';
  });

  it('should enrich companies with contact data', async () => {
    const mockContacts = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: null,
        title: 'CTO',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        organization_name: 'Example Corp',
      },
    ];

    mockSearchPeople.mockResolvedValue(mockContacts);
    mockBulkEnrichPeople.mockResolvedValue(mockContacts);

    const request = new Request('http://localhost:3000/api/apollo-enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companies: [{ title: 'Example Corp', url: 'https://example.com' }],
        limit: 1,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].company).toBe('Example Corp');
    expect(data.results[0].contacts).toHaveLength(1);
    expect(data.results[0].contacts[0].name).toBe('John Doe');
  });

  it('should handle phone enrichment when includePhones is true', async () => {
    const mockContacts = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: null,
        title: 'CTO',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        organization_name: 'Example Corp',
      },
    ];

    mockSearchPeople.mockResolvedValue(mockContacts);
    mockBulkEnrichPeople.mockResolvedValue(mockContacts);
    mockBulkEnrichPhonesWithWebhook.mockResolvedValue(undefined);
    mockCreateJob.mockImplementation(() => {});

    const request = new Request('http://localhost:3000/api/apollo-enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companies: [{ title: 'Example Corp', url: 'https://example.com' }],
        limit: 1,
        includePhones: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockBulkEnrichPhonesWithWebhook).toHaveBeenCalled();
    expect(mockCreateJob).toHaveBeenCalled();
    expect(data.results[0].phoneJobId).toBeDefined();
  });

  it('should return error for invalid request', async () => {
    const request = new Request('http://localhost:3000/api/apollo-enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
        limit: 1,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return error when API key is not configured', async () => {
    delete process.env.APOLLO_API_KEY;

    const request = new Request('http://localhost:3000/api/apollo-enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companies: [{ title: 'Example Corp', url: 'https://example.com' }],
        limit: 1,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Apollo API key not configured');
  });

  it('should handle invalid URLs gracefully', async () => {
    const request = new Request('http://localhost:3000/api/apollo-enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companies: [{ title: 'Invalid Company', url: 'not-a-valid-url' }],
        limit: 1,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results[0].error).toBe('Invalid URL - could not extract domain');
  });
});
