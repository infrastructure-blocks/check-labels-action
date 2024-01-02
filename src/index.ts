import * as core from "@actions/core";
import { context } from "@actions/github";
import { createHandler } from "./handler.js";
import {
  arrayInput,
  checkSupportedEvent,
  Event,
  getInputs,
} from "@infra-blocks/github";
import VError from "verror";

async function main() {
  core.debug(`received env: ${JSON.stringify(process.env, null, 2)}`);
  core.debug(`received context: ${JSON.stringify(context, null, 2)}`);
  // TODO: take PR as input and remove this guard.
  checkSupportedEvent(context.eventName, [Event.PullRequest]);
  const inputs = getInputs({
    "one-of": arrayInput({ separator: ",", trim: true }),
  });
  const oneOf = inputs["one-of"].map((label) => new RegExp(label));
  const handler = createHandler({
    context,
    config: {
      oneOf,
    },
  });
  const outputs = await handler.handle();
  for (const [key, value] of Object.entries(outputs)) {
    core.debug(`setting output ${key}=${value}`);
    core.setOutput(key, value);
  }
}

main().catch((err: Error) => core.setFailed(VError.fullStack(err)));
