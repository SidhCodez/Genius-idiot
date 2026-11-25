import { beforeEach, describe, expect, it, vi } from 'vitest';

const { insert, from } = vi.hoisted(() => ({
  insert: vi.fn(),
  from: vi.fn(() => ({ insert })),
}));

vi.mock('../supabaseClient', () => ({
  supabase: { from },
}));

import { createGoal } from '../lib/repository';

describe('createGoal payload', () => {
  beforeEach(() => {
    insert.mockReset();
    insert.mockImplementation((row) => ({
      select: async () => ({
        data: [{ ...row, public_id: 'db-public-id', is_public: false }],
        error: null,
      }),
    }));
  });

  it('leaves database-managed public columns out of the insert', async () => {
    const result = await createGoal({
      id: 'goal-1',
      user_id: 'user-1',
      name: 'DSA',
      daily_minutes: 60,
      why: 'Build a career I care about.',
      public_id: 'client-public-id',
      is_public: false,
      created_at: '2026-11-18T10:00:00.000Z',
      updated_at: '2026-11-18T10:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(insert).toHaveBeenCalledTimes(1);
    const row = insert.mock.calls[0][0];
    expect(row).not.toHaveProperty('public_id');
    expect(row).not.toHaveProperty('is_public');
    expect(row).toMatchObject({
      id: 'goal-1',
      user_id: 'user-1',
      name: 'DSA',
      daily_minutes: 60,
      why: 'Build a career I care about.',
    });
  });
});
