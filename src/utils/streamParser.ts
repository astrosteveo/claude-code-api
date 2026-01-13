import type { CLIStreamEvent } from '../types/cli.js';

/**
 * Parses a single line from Claude CLI's stream-json output
 * @param line A line of NDJSON (newline-delimited JSON)
 * @returns Parsed event or null if invalid
 */
export function parseStreamLine(line: string): CLIStreamEvent | null {
  // Trim whitespace
  const trimmed = line.trim();

  // Ignore empty lines
  if (!trimmed) {
    return null;
  }

  try {
    // Parse JSON
    const parsed = JSON.parse(trimmed);

    // Return the parsed event as-is
    // The CLI already provides properly typed events
    return parsed as CLIStreamEvent;
  } catch (error) {
    // Invalid JSON - return null
    return null;
  }
}
