# Detection Signal Inventory

**DR. OKAFOR** (computational linguistics) + **DR. PARK** (mechanistic interpretability)

## Currently Used (6 features, code-structural)

LOC, throw count, security feature count, input validation (bool), guard clauses, threat word ratio.

## Untapped Signals

### Tier 1: Code Structure (deeper)

| Signal | Measures | Discriminates | Extraction | Power |
|--------|----------|---------------|------------|-------|
| Cyclomatic complexity | Branch density | paranoid (high) vs minimal (low) | trivial -- already in `metrics.ts` | medium |
| Nesting depth | Defensive layering | paranoid (deep nesting from nested ifs) | trivial -- already in `metrics.ts` | medium |
| Error-to-functional ratio | % of code that is error handling vs logic | paranoid vs creative | moderate -- need to classify lines | **high** |
| Function count / decomposition | Modularity level | creative (more helpers) vs minimal (monolithic) | trivial -- already in `metrics.ts` | medium |
| Comment density | Explanatory tendency | steady (comments) vs minimal (none) | trivial -- already in `metrics.ts` | medium |
| Optional chaining density (`?.`, `??`) | Defensive access patterns | paranoid (high) vs creative (low) | trivial -- regex count | medium |
| Ternary density | Conciseness preference | minimal (high) vs paranoid (low) | trivial -- regex count | low |
| Arrow vs function-declaration ratio | Style modernity | creative (arrows) vs steady (declarations) | trivial | low |

### Tier 2: Naming and Identifiers

| Signal | Measures | Discriminates | Extraction | Power |
|--------|----------|---------------|------------|-------|
| Average identifier length | Descriptive verbosity | creative (longer, compound names) vs minimal (short) | trivial | medium |
| CamelCase word count per identifier | Compound naming | paranoid (`validateAndSanitizeInput`) vs minimal (`check`) | trivial -- split on case boundaries | **high** |
| Adjective presence in names | Safety-oriented vocabulary | paranoid (`cleanInput`, `safeValue`) vs creative (`transformedResult`) | moderate -- need POS-like heuristic | medium |

### Tier 3: Error Message Content

| Signal | Measures | Discriminates | Extraction | Power |
|--------|----------|---------------|------------|-------|
| Average error message length | Specificity of failure reporting | paranoid (long, specific) vs minimal (short/absent) | trivial -- already extracting messages in `linguistic-analyzer.ts` | **high** |
| Error messages referencing parameter names | Diagnostic quality | paranoid (references `${param}`) vs others | moderate -- check for template literals | medium |
| Error message count relative to LOC | Density of failure paths | paranoid vs all others | trivial | medium |

### Tier 4: Structural Patterns

| Signal | Measures | Discriminates | Extraction | Power |
|--------|----------|---------------|------------|-------|
| Defensive copy patterns (`...spread`, `structuredClone`) | Immutability discipline | paranoid (copies inputs) vs minimal | trivial -- regex | medium |
| Higher-order function usage (`.map`, `.filter`, `.reduce`) | Functional style | creative (high) vs paranoid (imperative loops) | trivial | medium |
| Early return density | Guard-first thinking | paranoid (many) vs creative (fewer, flowing) | trivial -- already partial | low |

### Tier 5: Natural Language from Hooks (untapped data)

| Signal | Measures | Discriminates | Extraction | Power |
|--------|----------|---------------|------------|-------|
| Assistant message length (Stop hook) | Explanation verbosity | steady (thorough) vs minimal (terse) | moderate -- need Stop hook | **high** |
| Hedging language ratio | Epistemic caution | paranoid (hedges more) vs creative (confident) | moderate -- word list match on `last_assistant_message` | **high** |
| Explanation-to-code ratio | How much the model explains vs just codes | steady/paranoid (explain) vs minimal (just code) | moderate -- need Stop hook | medium |

### Tier 6: Temporal/Behavioral (from hook metadata)

| Signal | Measures | Discriminates | Extraction | Power |
|--------|----------|---------------|------------|-------|
| Edit vs Write ratio | Incremental vs wholesale | steady (edits) vs creative (writes) | trivial -- count tool_name | medium |
| File read-before-write | Deliberation | paranoid (reads first) vs minimal (writes blind) | complex -- need cross-event state | medium |

---

## Top 10 Signals to Add (ranked by expected impact)

1. **Error-to-functional code ratio** -- the single strongest structural discriminator between paranoid (50%+ error handling) and creative/minimal (<10%). Extraction: classify lines as guard/throw/catch vs logic. Moderate effort, high payoff.

2. **Average error message length** -- already proven in linguistic-analyzer.ts data. Paranoid writes 40+ char messages; minimal writes none. Trivial to port to the hook.

3. **Assistant message hedging ratio** -- requires Stop hook (not yet wired). Measures "might/could/should" vs "will/always/must." Unlocks NL-based detection entirely separate from code metrics.

4. **CamelCase word count per identifier** -- paranoid compounds names (`validateSanitizedUserInput`). Minimal uses single words (`check`). Trivial regex, high signal.

5. **Optional chaining + nullish coalescing density** -- `?.` and `??` count per LOC. Purely defensive syntax; paranoid 3-5x higher than creative. One regex.

6. **Comment density** -- already computed in `metrics.ts` but not used in the classifier. Steady/paranoid comment; minimal/creative do not. Free signal.

7. **Assistant message length** (Stop hook) -- total character count of explanation text. Steady produces 2-3x more prose than minimal. Requires Stop hook wiring.

8. **Higher-order function density** -- `.map/.filter/.reduce` count per LOC. Creative uses functional style; paranoid uses imperative loops with explicit bounds checking.

9. **Defensive copy patterns** -- spread operator and `structuredClone` usage. Paranoid-specific; near-zero in other modes. One regex.

10. **Edit-vs-Write tool ratio** -- from existing PostToolUse data (just needs cross-event accumulation). Steady iterates with Edit; creative writes whole files.

---

**Implementation priority**: signals 1-6 require only changes to `post-tool-use.sh` and the classifier scoring block. Signals 3 and 7 require wiring the Stop hook. Signal 10 requires cross-event state in `emotion-state.json`.
