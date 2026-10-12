import { describe, expect, it } from 'vitest';
import { cleanName } from './StudentApp';

describe('student name', () => {
  it('takes any name, tidied up', () => {
    expect(cleanName('  Lea   Marie ')).toBe('Lea Marie');
    expect(cleanName('Ben')).toBe('Ben');
    expect(cleanName('Tim S.')).toBe('Tim S.');
    expect(cleanName('   ')).toBeNull();
    expect(cleanName('x'.repeat(60))).toHaveLength(40);
  });
});
