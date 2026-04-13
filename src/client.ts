import { $ } from "bun";

export interface CallParams {
  systemPrompt: string;
  userMessage: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface CallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string;
  durationMs: number;
}

interface ClaudeJsonOutput {
  type: string;
  subtype: string;
  is_error: boolean;
  result: string;
  duration_ms: number;
  duration_api_ms: number;
  stop_reason: string;
  total_cost_usd: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
}

export async function callClaude(params: CallParams): Promise<CallResult> {
  const start = performance.now();

  // Use --append-system-prompt to add the emotional prime on top of
  // Claude Code's default system prompt. This is more realistic since
  // we're testing how primes work within Claude Code itself.
  // --dangerously-skip-permissions prevents tool-use permission prompts.
  // --no-session-persistence avoids polluting session history.
  const result =
    await $`claude -p ${params.userMessage} --append-system-prompt ${params.systemPrompt} --model ${params.model} --output-format json --no-session-persistence --dangerously-skip-permissions`.quiet().nothrow();

  const durationMs = Math.round(performance.now() - start);
  const output = result.stdout.toString().trim();

  if (!output) {
    throw new Error(`claude CLI returned empty output (exit code ${result.exitCode})`);
  }

  try {
    const parsed: ClaudeJsonOutput = JSON.parse(output);

    if (parsed.is_error) {
      throw new Error(`claude CLI error: ${parsed.result}`);
    }

    return {
      text: parsed.result,
      inputTokens: parsed.usage.input_tokens + parsed.usage.cache_creation_input_tokens + parsed.usage.cache_read_input_tokens,
      outputTokens: parsed.usage.output_tokens,
      stopReason: parsed.stop_reason ?? "end_turn",
      durationMs: parsed.duration_api_ms || durationMs,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      // JSON parse failed — use raw output
      return {
        text: output,
        inputTokens: 0,
        outputTokens: 0,
        stopReason: "unknown",
        durationMs,
      };
    }
    throw error;
  }
}
