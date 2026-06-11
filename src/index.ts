export { type Agent, agentFilename, qualifiedName, toMarkdown } from "./agent.js";
export { BEGIN_MARKER, END_MARKER, type ProviderTrigger, delegationRule, mergeTrigger } from "./trigger.js";
export { type ScopeInput, allowedProviders } from "./scope.js";
export { type DiscoveredProvider, directDependencies, discoverProviders } from "./discovery.js";
export { type InstallResult, installAgents, installLocals, writeTrigger } from "./installer.js";
export { reference } from "./reference.js";
export { companionAgents } from "./companion.js";
export {
  type ProviderAgentSpec,
  type ProviderConfig,
  buildProvider,
  prefixFromName,
  renderProvider,
  scaffoldProvider,
  starterConfig,
} from "./provider.js";
