import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { POST } from '@/app/api/apollo-webhook/route';

// Mock dependencies
const mockUpdateJob = mock(() => {});

mock.module('@/lib/phone-enrichment-store', () => ({
  phoneEnrichmentStore: {
    updateJob: mockUpdateJob,
  },
}));

describe('/api/apollo-webhook', () => {
  beforeEach(() => {
    mockUpdateJob.mockClear();
  });

  it('should process webhook and update job with contacts', async () => {
    const mockJobId = 'test-job-id';
    const mockWebhookData = {
      matches: [
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          title: 'CTO',
          linkedin_url: 'https://linkedin.com/in/johndoe',
          organization: { name: 'Example Corp' },
          phone_numbers: [
            {
              raw_number: '+1234567890',
              sanitized_number: '1234567890',
            },
          ],
        },
      ],
    };

    mockUpdateJob.mockImplementation(() => {});

    const request = new Request(
      `http://localhost:3000/api/apollo-webhook?jobId=${mockJobId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockWebhookData),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdateJob).toHaveBeenCalledWith(
      mockJobId,
      expect.arrayContaining([
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        }),
      ])
    );
  });

  it('should return error when jobId is missing', async () => {
    const request = new Request('http://localhost:3000/api/apollo-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing jobId parameter');
  });

  it('should handle empty matches array', async () => {
    const mockJobId = 'test-job-id';
    mockUpdateJob.mockImplementation(() => {});

    const request = new Request(
      `http://localhost:3000/api/apollo-webhook?jobId=${mockJobId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: [] }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdateJob).toHaveBeenCalledWith(mockJobId, []);
  });
});
