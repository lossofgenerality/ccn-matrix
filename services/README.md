# Services for later stages

Two selected matrix-org projects run as separate services. Neither one is needed for the local sandbox, so neither is installed yet. Add each one at the roadmap stage that needs it.

## matrix-hookshot (7.6.2): GitHub feeds for the team space (Stage 1)

- **What it does:** posts pushes, issues and pull requests from `lossofgenerality/*` into a CCN Production room.
- **When to add it:** once the team space is on a real, reachable server. GitHub must be able to send webhooks to it, which a local-only sandbox can't receive.
- **Install:** container image `halfshot/matrix-hookshot:7.6.2`, registered with the homeserver as an application service. Follow the official setup guide at <https://matrix-org.github.io/matrix-hookshot/>.

## mjolnir (v2.0.2): moderation for public rooms (Stage 2)

- **What it does:** shares ban lists, protects rooms from spam, and lets editors moderate from a management room.
- **When to add it:** before the first public literature room opens.
- **Install:** container image `matrixdotorg/mjolnir:v2.0.2`, running as a bot account on the CCN server. See <https://github.com/matrix-org/mjolnir>.
- **Note:** Draupnir, a community fork that works as a drop-in replacement, is more actively developed. If Mjolnir falls behind, switch to Draupnir. It is not a matrix-org project.

---
**© Computational Classnotes · CC BY-NC-SA 4.0**
