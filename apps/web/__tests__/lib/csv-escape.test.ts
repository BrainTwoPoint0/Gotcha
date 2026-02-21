import { escapeCsvField } from '@/lib/csv-escape';

describe('escapeCsvField', () => {
  it('returns plain text unchanged', () => {
    expect(escapeCsvField('hello')).toBe('hello');
  });

  it('wraps fields with commas in quotes', () => {
    expect(escapeCsvField('hello, world')).toBe('"hello, world"');
  });

  it('escapes double quotes inside fields', () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps fields with newlines in quotes', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  // Formula injection tests
  it('sanitizes fields starting with =', () => {
    const result = escapeCsvField('=CMD()');
    expect(result).not.toMatch(/^=/);
    expect(result).toContain("'=CMD()");
  });

  it('sanitizes fields starting with +', () => {
    const result = escapeCsvField('+CMD()');
    expect(result).not.toMatch(/^\+/);
    expect(result).toContain("'+CMD()");
  });

  it('sanitizes fields starting with -', () => {
    const result = escapeCsvField('-CMD()');
    expect(result).not.toMatch(/^-/);
    expect(result).toContain("'-CMD()");
  });

  it('sanitizes fields starting with @', () => {
    const result = escapeCsvField('@SUM(A1)');
    expect(result).not.toMatch(/^@/);
    expect(result).toContain("'@SUM(A1)");
  });

  it('sanitizes fields starting with tab', () => {
    const result = escapeCsvField('\t=CMD()');
    expect(result).not.toMatch(/^\t/);
  });

  it('sanitizes fields starting with carriage return', () => {
    const result = escapeCsvField('\r=CMD()');
    expect(result).not.toMatch(/^\r/);
  });

  it('does not alter = in the middle of a string', () => {
    expect(escapeCsvField('a=b')).toBe('a=b');
  });

  it('handles empty string', () => {
    expect(escapeCsvField('')).toBe('');
  });
});
