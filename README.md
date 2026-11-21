# Game Asset Workshop

Make your first game prop in Blender. Pick a rescue crate, twilight lantern
or orbital power cell, then take it through five short missions from setup to a
Godot playtest. The workshop is designed for creators ages 16–20 who are new
to Blender, AI agents, or both.

**[Start the workshop](https://blazenetic.github.io/game-asset-workshop/)** ·
**[Try Prompt Lab first](https://blazenetic.github.io/game-asset-workshop/#prompt-lab)** ·
[Contribute to the workshop](CONTRIBUTING.md)

## What you’ll do

- Choose an agent that runs on your computer, use chat AI for Blender steps,
  or build by hand.
- Pick a prop and use Prompt Lab to describe its job, shape, size and a way
  to check it. Try a starter brief or bring your own idea.
- Inspect the result in Blender, revise one detail and export a GLB for
  Godot 4. Keep the `.blend` as your editable original.

The tutorial and Prompt Lab work in your browser without a workshop
account. The Lab drafts text you can copy. You run your chosen AI tool or
Blender separately. Some providers have their own account and age
requirements. The solo route has a manual build for each prop.

## Use it offline

1. Download the repository as a ZIP from **Code → Download ZIP** on GitHub,
   or clone it with the command below.
2. Open [web/index.html](web/index.html) in your browser. Keep the whole
   `web/` folder together so the styles, Lab and prop images load.
3. Install Blender on a computer when you’re ready to build. If you want to
   use an agent, choose one in the setup lesson and run its connection check.

```sh
git clone https://github.com/Blazenetic/game-asset-workshop.git
cd game-asset-workshop
```

The lessons, Lab and images work offline. Official download and help links
open their providers’ sites.

## Run the local crate demo

The sample crate demo is a separate contributor tool. With Python 3.9 or
newer, run this from the project folder.

```sh
python3 scripts/workshop_server.py
```

On Windows, try `py -3 scripts/workshop_server.py`. Add `/example` to the
printed address to open the demo. If Blender is installed outside your
terminal’s search path, pass `--blender "/full/path/to/blender"`.

You can also run the example recipe directly with Blender.

```sh
blender --background --factory-startup --python-exit-code 1 --python scripts/build_crate.py
```

Each run creates a fresh folder under `output/` with an editable Blender file
and a verified GLB. To make a named colour variant, append
`-- --colour "#C84438" --label "Signal Red"`.

## Contribute

Start with the [contributor guide](CONTRIBUTING.md) for the file map, writing
guidance, local checks and GitHub Pages setup. See the [pilot notes](PILOT.md)
for the current verification and the next learner walkthrough.
