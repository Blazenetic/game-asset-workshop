# Contributing to Game Asset Workshop

Help a first-time creator get from an idea to a prop they can inspect in
Blender and try in Godot. Small fixes to confusing instructions, prompts or
keyboard behaviour are welcome.

## Find the right file

| What you want to change | Where to start |
| --- | --- |
| Lessons, navigation, provider setup or help links | [web/index.html](web/index.html) |
| Layout, focus states, dark or light theme | [web/guide.css](web/guide.css) |
| Prop briefs, Prompt Lab, route switching or checkpoints | [web/guide.js](web/guide.js) |
| Prop illustrations | [web/media/](web/media/) |
| Reproducible Blender crate example | [scripts/build_crate.py](scripts/build_crate.py) |
| Local server, preview routes and separate demo | [scripts/workshop_server.py](scripts/workshop_server.py) |
| Public tutorial deployment | [.github/workflows/pages.yml](.github/workflows/pages.yml) |

## Write and test a change

1. Fork and clone the repository, then make a branch for your change. Read
   [AGENTS.md](AGENTS.md) if you’re using a coding agent.
2. Open `web/index.html` directly in a browser. The tutorial has no package
   install or build step. Use relative paths for tutorial files so the same
   page works offline and under the GitHub Pages project URL.
3. Put the expected result next to each instruction. Tell learners where to
   run a command, where to paste a prompt, and what they should see next.
   Link to official docs when changing provider setup or eligibility.
4. Try the first changed step at phone and desktop widths. Use the keyboard
   for the relevant controls, check both themes, and try the solo route.
   For Lab changes, check live drafts, hand edits, undo and copy behaviour.
   Keep sample assets and drafts separate from any personal files.
5. If you change the Blender recipe, run the Blender command in the
   [README](README.md#run-the-local-crate-demo). Confirm the `.blend` reopens,
   the GLB re-imports, and the dimensions, materials and floor contact match
   the example. Leave generated `output/` files out of the commit.
6. Open a pull request. Explain what changed for a learner, include the
   checks you ran, and add a screenshot if the change affects the layout.

## Publish the tutorial

The GitHub Actions workflow packages the tutorial HTML, CSS, JavaScript and
WebP images. The Python server, contributor demo and generated Blender files
are used locally. A push to `main` updates the public tutorial.

For a new repository or fork, open **Settings → Pages** and select
**GitHub Actions** as the source. In **Actions → Publish tutorial**, run the
workflow on `main`. Open the deployment URL from the successful run and
check that the images and Prompt Lab work there. [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
