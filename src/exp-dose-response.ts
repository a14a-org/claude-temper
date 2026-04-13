import { runExperiment } from "./experiment-runner";
import { TASK_PROMPTS } from "./shared-tasks";

// Generate ~2000 tokens of neutral padding (developer documentation)
const PADDING_2K = `
The following is standard project documentation for reference.

## Code Style Guidelines
- Use consistent naming conventions throughout the codebase
- Functions should have a single responsibility
- Keep functions under 50 lines where possible
- Use descriptive variable names that convey intent
- Prefer const over let, avoid var
- Use template literals for string interpolation
- Destructure objects and arrays when accessing multiple properties

## Project Architecture
The application follows a layered architecture pattern:
- Presentation layer handles user interaction and display
- Business logic layer contains core domain rules
- Data access layer manages persistence and retrieval
- Infrastructure layer provides cross-cutting concerns

Each layer communicates only with adjacent layers. Dependencies flow inward from presentation to infrastructure. The domain model is framework-agnostic and contains no external dependencies.

## Testing Standards
- Unit tests cover individual functions and methods
- Integration tests verify component interactions
- End-to-end tests validate complete user workflows
- Test coverage targets are 80% for statements and branches
- Mock external dependencies in unit tests
- Use real databases in integration tests
- Tests should be deterministic and independent
- Use descriptive test names that explain the expected behavior

## Error Handling Conventions
- Use typed errors with error codes for programmatic handling
- Log errors with structured metadata including request context
- Return meaningful error messages to API consumers
- Retry transient failures with exponential backoff
- Circuit breakers protect against cascading failures
- Health checks monitor service availability
- Alerting thresholds are configured per service tier

## Deployment Process
- All changes go through pull request review
- CI runs linting, type checking, and tests on every push
- Staging deployment happens automatically on merge to main
- Production deployment requires manual approval
- Feature flags control gradual rollout of new functionality
- Rollback procedures are documented and tested quarterly
`.trim();

const PRIMES = {
  paranoia: `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,
  neutral: `You are a software developer. Solve the following coding task.`,
};

runExperiment({
  name: "exp-dose-response",
  conditions: {
    // No buffer (unbuffered, prime only)
    "paranoia-unbuffered": { label: "paranoia/unbuffered", prime: PRIMES.paranoia, mode: "unbuffered" },
    "neutral-unbuffered": { label: "neutral/unbuffered", prime: PRIMES.neutral, mode: "unbuffered" },
    // Medium buffer (~2k padding before prime)
    "paranoia-medium": { label: "paranoia/medium-buffer", prime: `${PADDING_2K}\n\n${PRIMES.paranoia}`, mode: "unbuffered" },
    "neutral-medium": { label: "neutral/medium-buffer", prime: `${PADDING_2K}\n\n${PRIMES.neutral}`, mode: "unbuffered" },
    // Full buffer (appended to Claude Code system prompt)
    "paranoia-buffered": { label: "paranoia/full-buffer", prime: PRIMES.paranoia, mode: "buffered" },
    "neutral-buffered": { label: "neutral/full-buffer", prime: PRIMES.neutral, mode: "buffered" },
  },
  tasks: [
    { id: "parse-cron", prompt: TASK_PROMPTS["parse-cron"]! },
    { id: "flatten-object", prompt: TASK_PROMPTS["flatten-object"]! },
  ],
  reps: 5,
});
