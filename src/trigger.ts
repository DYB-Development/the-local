export const BEGIN_MARKER = "<!-- the_local:begin -->";
export const END_MARKER = "<!-- the_local:end -->";

export interface ProviderTrigger {
  prefix: string;
  scope?: string | null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bullet(provider: ProviderTrigger): string {
  const target = `${provider.prefix}-* agents`;
  return `- ${provider.scope ? `${provider.scope} → ${target}` : target}`;
}

export function delegationRule(providers: ProviderTrigger[]): string {
  return [
    BEGIN_MARKER,
    "## Delegate to your locals",
    "",
    "This project has installed expert subagents. Before doing work yourself,",
    "check whether a local owns it and delegate — never work from memory on",
    "something a local covers:",
    "",
    providers.map(bullet).join("\n"),
    "",
    "See each agent's description for specifics.",
    END_MARKER,
  ].join("\n");
}

export function mergeTrigger(existing: string, rule: string): string {
  const section = new RegExp(`${escapeRegExp(BEGIN_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}`);
  if (section.test(existing)) return existing.replace(section, rule);
  if (existing.trim() === "") return rule;
  return `${existing.replace(/\r?\n$/, "")}\n\n${rule}`;
}
