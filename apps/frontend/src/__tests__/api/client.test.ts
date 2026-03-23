import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, api } from '../../api/client.js';

// ── ApiError class ────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('stores status, code, and message', () => {
    const err = new ApiError(404, 'NOT_FOUND', 'Resource not found');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
  });

  it('has name "ApiError"', () => {
    const err = new ApiError(500, 'INTERNAL', 'Server error');
    expect(err.name).toBe('ApiError');
  });

  it('is an instance of Error', () => {
    const err = new ApiError(422, 'VALIDATION', 'Invalid data');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });
});

// ── api.get ───────────────────────────────────────────────────────────────────

describe('api.get', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns parsed JSON on a 2xx response', async () => {
    const payload = { farm_id: '1', score: 85 };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    } as unknown as Response);

    const result = await api.get('/api/compliance/score/1');
    expect(result).toEqual(payload);
  });

  it('throws ApiError with status and code on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ error: 'FARM_NOT_FOUND', message: 'Farm not found' }),
    } as unknown as Response);

    await expect(api.get('/api/farms/999')).rejects.toThrow(ApiError);
    await expect(api.get('/api/farms/999')).rejects.toMatchObject({
      status: 404,
      code: 'FARM_NOT_FOUND',
    });
  });

  it('calls fetch with the correct URL', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as unknown as Response);

    await api.get('/api/farms');
    expect(fetch).toHaveBeenCalledWith('/api/farms', expect.objectContaining({}));
  });

  it('falls back to statusText when error body has no message field', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({}),
    } as unknown as Response);

    const err = await api.get('/api/fail').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe('Internal Server Error');
  });
});

// ── api.post ──────────────────────────────────────────────────────────────────

describe('api.post', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends POST with JSON body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reading_id: 'abc' }),
    } as unknown as Response);

    const body = { node_id: 'GT-001', temperature_c: 22 };
    await api.post('/api/hardware/ingest', body);

    expect(fetch).toHaveBeenCalledWith(
      '/api/hardware/ingest',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  });
});
