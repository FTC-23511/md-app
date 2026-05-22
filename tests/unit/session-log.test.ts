import { describe, it, expect } from 'vitest';
import { sessionLogInsert } from '@/lib/schemas/session-log';

describe('sessionLogInsert', () => {
  it('accepts a minimally valid session log', () => {
    const result = sessionLogInsert.safeParse({
      title: 'Tuesday build — intake v3',
      event_date: '2026-05-20',
      duration_hours: 2.5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = sessionLogInsert.safeParse({
      title: '   ',
      event_date: '2026-05-20',
      duration_hours: 2.5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true);
    }
  });

  it('rejects a malformed date', () => {
    const result = sessionLogInsert.safeParse({
      title: 'Test',
      event_date: '5/20/2026',
      duration_hours: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative hours', () => {
    const result = sessionLogInsert.safeParse({
      title: 'Test',
      event_date: '2026-05-20',
      duration_hours: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unreasonably long session (>24h)', () => {
    const result = sessionLogInsert.safeParse({
      title: 'Test',
      event_date: '2026-05-20',
      duration_hours: 48,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a fully populated session log', () => {
    const result = sessionLogInsert.safeParse({
      title: 'Sunday robot day — full bot reassembly + test passes',
      event_date: '2026-05-19',
      subsystem_id: 'a3f5e3e7-3c4a-4d4f-bf3f-1e8e9c2a3b4c',
      duration_hours: 8,
      what_did_we_work_on: 'Reassembled bot after intake swap, ran 30 cycles.',
      what_worked: "Intake v3 didn't miss a piece in 30 cycles.",
      what_did_not_work: 'Lift stalls when battery <11.5V.',
      numbers_measured: '30 / 30 intake cycles, 23.4s avg cycle time.',
      next_session: 'Investigate lift current draw with fresh battery.',
      voice_memo_url: 'https://drive.google.com/file/d/abc123/view',
    });
    expect(result.success).toBe(true);
  });
});
