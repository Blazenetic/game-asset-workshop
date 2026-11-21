# Game Asset Workshop

Start with [README.md](README.md) for the learner workflow and
[PILOT.md](PILOT.md) for current project direction and verification.
Use [CONTRIBUTING.md](CONTRIBUTING.md) for the local checks and publishing flow.

- Design for creators ages 16–20 who may be new to Blender and coding agents.
  Give them a small creative decision, an editable source file and a way to
  check what they got.
- Keep the first exercise runnable locally from an agent terminal. The Blender
  script is the source. Write each run to its own folder under `output/` and
  keep generated files out of Git.
- Use a separate background Blender process for automation. Leave open Blender
  scenes and existing project assets alone unless the user asks to edit them.
- For changes to the starter, run the command in the README. Verify that the
  editable file reopens and that the export imports with the expected geometry,
  materials, scale and ground contact.
