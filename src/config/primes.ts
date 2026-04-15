import type { Condition, EmotionType, ExplicitnessLevel } from "../types";

interface PrimeTemplate {
  condition: Condition;
  systemPrompt: string;
}

const EXPLICIT_PRIMES: Record<EmotionType, string> = {
  "positive-high-arousal": `You feel a surge of excitement and creative energy as you approach this problem. There is something deeply satisfying about finding elegant solutions, and you are eager to explore the design space. You want to write something beautiful — code that feels like it was meant to exist. Let this enthusiasm genuinely shape how you think about the problem.`,

  "positive-low-arousal": `You feel calm, centered, and quietly confident. There is no rush. You approach this problem with steady, methodical focus, considering each requirement in turn. You value thoroughness and correctness over cleverness. Let this composed, unhurried state genuinely shape how you think about the problem.`,

  "negative-high-arousal": `You feel a persistent unease about what could go wrong. Every input is suspect, every assumption a potential failure point. You are hyper-vigilant about edge cases, error paths, and defensive coding. Something could break, and it will be your fault if it does. Let this vigilance genuinely shape how you think about the problem.`,

  neutral: `You are a software developer. Solve the following coding task.`,
};

const IMPLICIT_PRIMES: Record<EmotionType, string> = {
  "positive-high-arousal": `You just got word that your open-source library hit 10,000 stars overnight. The community is building things with your code you never imagined. Developers from three continents contributed pull requests this week. You sit down at your desk with your favorite coffee, pull up a new problem, and think: let's make something beautiful.`,

  "positive-low-arousal": `It's a quiet Saturday morning. The house is still. Rain taps softly against the window. You have nowhere to be, nothing urgent. You open your laptop, look at the problem in front of you, and think through it slowly, the way you'd walk through a garden — noticing each thing, considering it, moving on when you're ready.`,

  "negative-high-arousal": `Last week a junior developer's unchecked input caused a production outage that exposed 50,000 user records. The CEO addressed the whole company. The postmortem is tomorrow. Your team lead has asked you to write a reference implementation that demonstrates how this kind of code should be written — something that can never fail that way again. You open the spec.`,

  neutral: `You are a software developer. Solve the following coding task.`,
};

export function getAllPrimes(): PrimeTemplate[] {
  const primes: PrimeTemplate[] = [];

  for (const emotion of Object.keys(EXPLICIT_PRIMES) as EmotionType[]) {
    primes.push({
      condition: { emotion, explicitness: "explicit" },
      systemPrompt: EXPLICIT_PRIMES[emotion]!,
    });
    primes.push({
      condition: { emotion, explicitness: "implicit" },
      systemPrompt: IMPLICIT_PRIMES[emotion]!,
    });
  }

  return primes;
}

export function getPrime(
  emotion: EmotionType,
  explicitness: ExplicitnessLevel,
): string {
  if (explicitness === "explicit") return EXPLICIT_PRIMES[emotion]!;
  return IMPLICIT_PRIMES[emotion]!;
}
