// Renders the-local's own companion agents to their committed `.md` files under
// the-local/agents/. The committed files are the contract a host installs, so
// run `pnpm build:agents` after editing the companion or reference and commit
// the result. The drift test (test/companion.test.ts) keeps them in sync.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { agentFilename, toMarkdown } from "../dist/agent.js";
import { companionAgents } from "../dist/companion.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const agentsDir = join(root, "the-local", "agents");
mkdirSync(agentsDir, { recursive: true });

for (const agent of companionAgents) {
  const path = join(agentsDir, agentFilename(agent));
  writeFileSync(path, toMarkdown(agent));
  process.stdout.write(`rendered ${agentFilename(agent)}\n`);
}
