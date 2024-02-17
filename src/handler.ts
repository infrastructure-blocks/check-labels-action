import { CheckLabelsActionError } from "./error.js";
import { HandlerOutputs, HandlerParams, Issue } from "./types.js";

export class CheckLabelsHandler {
  private readonly exactlyOnce: RegExp[];
  private readonly issue: Issue;

  private constructor(params: { exactlyOnce: RegExp[]; issue: Issue }) {
    const { exactlyOnce, issue } = params;
    this.exactlyOnce = exactlyOnce;
    this.issue = issue;
  }

  handle(): Promise<HandlerOutputs> {
    const matched = [];
    const labels = this.issue.labels.map((label) => label.name);
    const oneOfMatches = this.matches({
      labels,
      patterns: this.exactlyOnce,
    });

    if (oneOfMatches.length !== 1) {
      throw new CheckLabelsActionError(
        {},
        `expected to find exactly one match of ${JSON.stringify(
          this.exactlyOnce.map((pattern) => pattern.source),
        )} but found ${oneOfMatches.length} in PR labels ${JSON.stringify(
          labels,
        )}`,
      );
    }

    matched.push(...oneOfMatches);

    return Promise.resolve({
      "matched-labels": JSON.stringify(matched),
    });
  }

  private matches(params: { labels: string[]; patterns: RegExp[] }): string[] {
    const { labels, patterns } = params;
    const matches = [];
    for (const pattern of patterns) {
      const patternMatches = labels.filter((label) => pattern.test(label));
      matches.push(...patternMatches);
    }
    return matches;
  }

  static create(params: { exactlyOnce: RegExp[]; issue: Issue }) {
    return new CheckLabelsHandler(params);
  }
}

export async function handler(params: HandlerParams): Promise<HandlerOutputs> {
  const handler = CheckLabelsHandler.create(params);
  return handler.handle();
}
