/**
 * Escapes a CSV field: handles commas, quotes, newlines,
 * and formula injection characters (=, +, -, @, \t, \r).
 */
export function escapeCsvField(field: string): string {
  // Sanitize formula injection — prepend single quote if field starts with a formula char
  const formulaChars = ['=', '+', '-', '@', '\t', '\r'];
  if (formulaChars.some((c) => field.startsWith(c))) {
    field = `'${field}`;
  }

  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes("'")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
