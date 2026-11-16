# versatile.sh

**AI agents that run businesses, with a person signing off on what matters.**

Most software asks a company to move in and adapt to it. We build the other way: software that takes the shape of the stack, the place and the tools a company already has. On top of that we put AI agents that do real work next to people, each with a job, a limit and a person who can stop it.

## What we are here to do

Companies are being told to hand work to AI agents. Most of what is on offer either does very little, or does a great deal with nobody watching. We think the useful version sits between the two: agents that take on real work in engineering, support, sales, operations and finance, inside limits a person set, and that wait for that person whenever a decision is not theirs to make.

So our goal is plain. **Make it safe and ordinary for a company to run part of its operations with AI agents**, without giving up control of what reaches its customers, its money or its systems, and without having to rebuild itself around someone else's product.

## Three ideas every part follows

| | |
| --- | --- |
| **Run it how you want** | Take one engine or the whole set. Call it from your product, your agents or the command line, and fill the gaps with pieces of your own. |
| **Where you want** | On a laptop, on your own servers or in your cloud. The software goes where your data already lives, not the other way around. |
| **With what you want** | Your database, your queue, your models, your tools. Each one plugs in, and can be swapped later without rebuilding the rest. |

## What an agent is, here

- An agent has a role, instructions, a model and a budget. It can be paused, retired and restored without losing its history.
- An agent can propose any change, and only a person can make it real. Changes to your systems wait for an approval that shows exactly what will change.
- An agent reaches exactly what you gave it and leaves a trace of everything it did. Credentials stay in a vault; a run receives only the secrets it is allowed.
- A budget you only read after the work is done is a report, not a limit. Spend is capped per agent and per team: it warns first, then stops.
- An agent does not need you at the keyboard. Give it a routine and it wakes on its own, does the job and leaves a trail.

## The system

Each part is an engine of its own. It stands alone, exchanges events with the others instead of calling them, and can be used alone or replaced.

| Part | What it does |
| --- | --- |
| **Agents** | Create, configure, pause and retire AI workers, each with a role and instructions. |
| **Teams** | Organise agents into teams with an org chart and reporting lines, and set what may be delegated along each line. |
| **Memory** | Each agent remembers what it learned across conversations, and refuses to keep personal data or secrets. |
| **Routines** | Let a team or an agent run on its own, on a schedule or an event, inside the limits you set. |
| **Chat and channels** | Conversations by subject, with people and agents together. Mention an agent to bring it in; steer or interrupt it while it works. |
| **Tasks** | Track and assign work, with reviews required before it counts as done. |
| **Workflows** | Describe a process, review it on a canvas and watch it run to the end. Work survives a crash and never runs twice by accident. |
| **Approvals** | Review and confirm every change an agent wants to make. Refuse with a reason the agent reads. |
| **Access** | Roles, invitations and per-agent access. Each action is off, ask first, or allowed. |
| **Budgets** | Cap and track spend per agent or team, with hard stops. |
| **Audit** | A full history of who, and which agent, did what. Every approval kept with its timeline. |
| **Vault and connectors** | Secrets and connections kept in one protected place, written once and never shown again. |

## Products

| Product | What it is | Status |
| --- | --- | --- |
| **adaptable.chat** | A chat where people and AI agents work in the same channels. Agents answer, ask, and wait for a person when the decision is not theirs. The first product built on the engines. | In development. Opens in early access, in small groups. |
| **[live.versatile.sh](https://live.versatile.sh)** | Rooms to share a screen, a voice and a camera from a link. No account, nothing to install. | Open. |

## Open source

| Repository | What it is |
| --- | --- |
| **[agents-vault](https://github.com/versatile-sh/agents-vault)** | An account ledger for coding-agent harnesses: isolated Claude Code, Codex and Grok accounts, API keys and live limits. |
| **[plugkit-protocol](https://github.com/versatile-sh/plugkit-protocol)** | The plugin protocol our engines share (`acplug/1`), with a host and a conformance kit. A plugin is written in the language you prefer, selected by configuration, and proves itself before production accepts it. |

More of what we build will open as it becomes something we can stand behind in public.

## How we build

- **Research first.** A market study and a target architecture come before the code, and the decisions that are hard to undo are written down with the trade-off they settled.
- **Small pieces under one rule.** Every engine follows the same contracts, so they combine into the shape a company needs instead of the shape we guessed.
- **A boundary adopts an open protocol only when someone real consumes it.** We do not add standards for show.
- **Nothing is closed.** Every engine accepts one more input, and you can add what is missing without touching what already works.
- **Seen from the outside.** Every run is traced end to end, and each engine reports metrics, structured logs and its own health.

## Who it is for

Teams that want AI agents to do real work next to people: engineering, support, sales and marketing, operations and finance. Each agent has a role, a budget and a person who approves what matters.

## Find us

[@versatile_sh](https://x.com/versatile_sh) · enterprise@versatile.sh
