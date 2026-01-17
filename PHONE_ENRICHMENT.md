# Phone Enrichment Feature

This document describes the phone enrichment feature that allows users to select specific companies and enrich them with phone data.

## Overview

The phone enrichment feature adds checkboxes to each company card, allowing users to select which companies they want to enrich with phone numbers from Apollo.io.

## How It Works

### User Flow

1. **Search for Companies**: User runs an Exa search to find companies
2. **Enrich with Apollo**: User enriches companies with contact data (emails, names, titles)
3. **Select Companies**: Checkboxes appear next to each enriched company
4. **Enrich with Phone Data**: User selects companies and clicks "Enrich with Phone Data" button
5. **Async Processing**: Phone enrichment happens asynchronously via webhook
6. **Auto-Update**: Phone numbers automatically appear when ready (polling every 1 second)

### Technical Flow

```
User selects companies
    ↓
Frontend calls /api/apollo-enrich with includePhones: true
    ↓
Backend calls Apollo API with webhook URL
    ↓
Backend creates job in phoneEnrichmentStore
    ↓
Frontend polls /api/phone-enrichment-status/[jobId]
    ↓
Apollo calls /api/apollo-webhook with phone data
    ↓
Webhook updates job in phoneEnrichmentStore
    ↓
Frontend receives updated data from polling
    ↓
UI updates to show phone numbers
```

## API Endpoints

### POST /api/apollo-enrich

Enriches companies with contact data and optionally phone numbers.

**Request Body:**
```json
{
  "companies": [
    { "title": "Company Name", "url": "https://company.com" }
  ],
  "limit": 10,
  "includePhones": true
}
```

**Response:**
```json
{
  "results": [
    {
      "company": "Company Name",
      "url": "https://company.com",
      "contacts": [...],
      "phoneJobId": "uuid-here"
    }
  ]
}
```

### GET /api/phone-enrichment-status/[jobId]

Polls for phone enrichment job status.

**Response:**
```json
{
  "status": "completed",
  "contacts": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "title": "CTO"
    }
  ]
}
```

### POST /api/apollo-webhook?jobId=[jobId]

Receives phone enrichment data from Apollo.io webhook.

**Request Body:**
```json
{
  "matches": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone_numbers": [
        { "raw_number": "+1234567890" }
      ]
    }
  ]
}
```

## Frontend Components

### State Management

- `selectedCompanies`: Set of company URLs selected for phone enrichment
- `isPhoneEnriching`: Loading state during phone enrichment
- `phoneEnrichmentJobs`: Map of company URL to job ID for tracking

### Functions

- `toggleCompanySelection(url)`: Toggle selection of a single company
- `toggleAllCompanies()`: Select/deselect all companies
- `handlePhoneEnrichment()`: Trigger phone enrichment for selected companies
- `pollPhoneEnrichmentStatus(jobMap)`: Poll for phone enrichment completion

## Environment Variables

Required:
- `APOLLO_API_KEY`: Your Apollo.io API key
- `NEXT_PUBLIC_BASE_URL`: Base URL for webhook callbacks (e.g., https://yourdomain.com)

## Testing

Unit tests are located in `__tests__/api/`:
- `apollo-enrich.test.ts`: Tests for enrichment endpoint
- `apollo-webhook.test.ts`: Tests for webhook endpoint
- `phone-enrichment-status.test.ts`: Tests for status endpoint

Run tests:
```bash
npm test
```

## Known Limitations

1. Phone enrichment is asynchronous and may take several seconds
2. Polling stops after 60 attempts (60 seconds)
3. Only works after Apollo email enrichment has been run first
4. Requires publicly accessible webhook URL for production use

## Future Improvements

- Add retry logic for failed phone enrichments
- Show progress indicator for individual companies
- Add ability to cancel ongoing phone enrichment
- Store phone data in database instead of in-memory
- Add phone number validation and formatting
