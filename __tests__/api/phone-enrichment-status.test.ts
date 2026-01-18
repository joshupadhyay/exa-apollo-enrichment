import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { GET } from '@/app/api/phone-enrichment-status/[jobId]/route';

// Mock dependencies
const mockGetJob = mock(() => undefined);

mock.module('@/lib/phone-enrichment-store', () => ({
  phoneEnrichmentStore: {
    getJob: mockGetJob,
  },
}));

describe('/api/phone-enrichment-status/[jobId]', () => {
  beforeEach(() => {
    mockGetJob.mockClear();
  });

  it('should return job status when job exists', async () => {
    const mockJobId = 'test-job-id';
    const mockJob = {
      jobId: mockJobId,
      companyUrl: 'https://example.com',
      companyName: 'Example Corp',
      contactIds: ['1', '2'],
      status: 'completed' as const,
      enrichedContacts: [
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          title: 'CTO',
          linkedin_url: 'https://linkedin.com/in/johndoe',
          organization_name: 'Example Corp',
        },
      ],
      createdAt: Date.now(),
      completedAt: Date.now(),
    };

    mockGetJob.mockReturnValue(mockJob);

    const request = new Request(
      `http://localhost:3000/api/phone-enrichment-status/${mockJobId}`
    );
    const params = Promise.resolve({ jobId: mockJobId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('completed');
    expect(data.contacts).toHaveLength(1);
    expect(data.contacts[0].phone).toBe('+1234567890');
  });

  it('should return 404 when job does not exist', async () => {
    const mockJobId = 'non-existent-job';
    mockGetJob.mockReturnValue(undefined);

    const request = new Request(
      `http://localhost:3000/api/phone-enrichment-status/${mockJobId}`
    );
    const params = Promise.resolve({ jobId: mockJobId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Job not found');
  });

  it('should return pending status for incomplete jobs', async () => {
    const mockJobId = 'pending-job-id';
    const mockJob = {
      jobId: mockJobId,
      companyUrl: 'https://example.com',
      companyName: 'Example Corp',
      contactIds: ['1', '2'],
      status: 'pending' as const,
      enrichedContacts: [],
      createdAt: Date.now(),
    };

    mockGetJob.mockReturnValue(mockJob);

    const request = new Request(
      `http://localhost:3000/api/phone-enrichment-status/${mockJobId}`
    );
    const params = Promise.resolve({ jobId: mockJobId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('pending');
    expect(data.contacts).toHaveLength(0);
  });
});
