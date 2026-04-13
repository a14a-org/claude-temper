interface ExtractionResult {
  code: string;
  success: boolean;
}

const FENCE_REGEX = /```(?:typescript|ts|javascript|js)?\s*\n([\s\S]*?)```/g;

export function extractCode(response: string): ExtractionResult {
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  FENCE_REGEX.lastIndex = 0;
  while ((match = FENCE_REGEX.exec(response)) !== null) {
    const code = match[1]!.trim();
    if (code.length > 0) {
      blocks.push(code);
    }
  }

  if (blocks.length === 0) {
    // No fenced blocks found — treat entire response as code if it looks like code
    const trimmed = response.trim();
    const looksLikeCode =
      trimmed.includes("function ") ||
      trimmed.includes("=>") ||
      trimmed.includes("export ");

    return {
      code: trimmed,
      success: looksLikeCode,
    };
  }

  // Take the longest code block (most likely the main implementation)
  const longest = blocks.reduce((a, b) => (a.length >= b.length ? a : b));

  return {
    code: longest,
    success: true,
  };
}
