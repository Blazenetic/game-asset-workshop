# Workshop pilot

Game Asset Workshop guides creators ages 16–20 through making a first prop.
The five lessons cover setup, a first brief, Prompt Lab, revision and Godot
playtesting. The rescue crate, twilight lantern and orbital power cell each
have a brief, a manual blockout and illustrated revisions.

## What’s ready to try

- The setup lesson covers Codex, Claude Code, Antigravity, Grok Build and
  T3 Code. The T3 walkthrough explains how to connect Codex, open the practice
  folder and select Supervised before the connection check.
- The Prompt Lab updates as you edit the brief. Hand edits survive prop and
  route changes, and rebuilding a draft can be undone during the session.
- All lessons and the solo route are available from the static tutorial.
  The separate local example builds a supply crate using background Blender.

## Verification

The tutorial passed Chromium walkthroughs at 360, 640 and 1440 px from a
local file and a static HTTP server. Checks covered keyboard navigation,
all three workflows, draft edits and undo, clipboard fallback, blocked
storage and mobile light-theme contrast. The setup instructions were
reviewed against provider documentation.

Blender 5.3.0 reopened the example `.blend` and re-imported its
528-triangle GLB. Godot 4.7.2 instantiated it with 12 mesh parts and the base
at Y = 0. The lantern and power cell renders are illustrations of learner
briefs and revisions.

## Next learner walkthrough

Watch someone new to the tools open the tutorial on their own device, choose
a route, and change a starter brief without coaching. Ask them to point to
the editable `.blend` and the Godot-ready `.glb` after their first build. A
fresh provider sign-in, an MCP installation, a screen-reader walkthrough
and a full beginner session are pending.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contributing, checks and deployment.
