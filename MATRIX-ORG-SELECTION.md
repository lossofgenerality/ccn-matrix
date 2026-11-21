# Which matrix-org repositories CCN uses

The repositories below were chosen against the staged roadmap in *Matrix for CCN's Messaging Applications* (Section 8). A repository is included only if a roadmap stage needs it. Everything else is left out on purpose.

Versions were checked on 21 November 2026.

## Selected

| Repository | Version | Installed as | Roadmap stage | Why CCN needs it |
|---|---|---|---|---|
| [matrix-org/matrix-js-sdk](https://github.com/matrix-org/matrix-js-sdk) | 45.1.0 | npm dependency of [`bot/`](bot/) | Stages 1–3 | The engine behind the CCN bot: signing in, rooms, invites, receiving and sending messages. It's JavaScript, like CCN's pages and PWAs. |
| [matrix-org/matrix-widget-api](https://github.com/matrix-org/matrix-widget-api) | 1.20.0 | npm dependency of [`widgets/`](widgets/) | Stage 4 | Lets a CCN page (CARTELS! comic, Laplacian Lab, MAXIT) run as a widget inside a room and talk to it. |
| [matrix-org/matrix-hookshot](https://github.com/matrix-org/matrix-hookshot) | 7.6.2 | Not installed yet. Added when Stage 1 moves to a hosted server ([`services/`](services/)) | Stage 1 (team space) | Posts GitHub activity from the lossofgenerality repos into the CCN Production rooms. |
| [matrix-org/mjolnir](https://github.com/matrix-org/mjolnir) | v2.0.2 | Not installed yet. Added before the first public room ([`services/`](services/)) | Stage 2 (public literature room) | Moderation for public rooms: shared ban lists and spam protection. |

## Not selected

| Repository | Why it is left out |
|---|---|
| matrix-rust-sdk | Engine for native mobile and desktop apps. CCN uses existing apps (Element, FluffyChat) and JavaScript for its own code. |
| vodozemac | Encryption library. Apps and SDKs already include it, so CCN never installs it directly. |
| matrix-appservice-node / matrix-appservice-bridge | Only needed for bridges to other chat platforms, or very large bots. A normal bot account is enough for every planned stage. |
| matrix-spec, matrix-spec-proposals | Reference reading, not software. |
| complement | Compliance tests for people who write homeservers. |
| matrix-react-sdk, older SDKs | Archived or merged into Element. |
| Synapse (now element-hq/synapse) | No longer in matrix-org, and AGPL-licensed. For a small CCN server, the report recommends a lightweight Rust homeserver instead. |

## The one piece from outside matrix-org

matrix-org no longer publishes a homeserver, so the sandbox uses **Tuwunel** ([matrix-construct/tuwunel](https://github.com/matrix-construct/tuwunel), Apache-2.0). It is one of the lightweight Rust servers the report names, and the sandbox runs it as a container image. **Element Web** (element-hq) is the chat app in the browser. It is the main client with widget support, which Stage 4 needs.

---
**© Computational Classnotes · CC BY-NC-SA 4.0**
