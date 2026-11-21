"use strict";

const props = {
  crate: {
    name: "Rescue crate",
    scene: "Make loot stand out in a dim mountain rescue shelter.",
    spec: "1.2 m wide · up to 1,000 triangles",
    twist:
      "Bright latches or a chunky handle? Pick the detail players should notice first.",
    fields: [
      "A mountain rescue game with cold, dim interiors",
      "A supply crate players can spot from across a room",
      "Amber latches, a chunky handle and a shell about 1.2 m wide",
      "The base sits flat at Z = 0, latches read from the front, and the export stays under 1,000 triangles",
    ],
    folder: "rescue-crate",
    manual: [
      "Set the default cube’s dimensions to 1.2 × 0.8 × 0.8 m and its Z location to 0.4 m.",
      "Add a second cube for the lid. Set its dimensions to 1.26 × 0.86 × 0.12 m and its Z location to 0.86 m.",
      "Orbit the crate and check the overhang from the side. Save it as crate-v1.blend.",
    ],
    images: ["field-crate.webp", "signal-crate.webp"],
    variants: ["Field teal", "Signal red"],
    imageDetail: "Low-poly supply crate with amber latches",
    tip: "Try both shells against snow and a dim room. Which could you spot first at player distance?",
    patch: "Try a signal red shell. Keep the shape, size and amber latches.",
    godot:
      "If the crate should block the player, add a box collision shape under a StaticBody3D.",
  },
  lantern: {
    name: "Twilight lantern",
    scene: "Give players a beacon to follow into a forest camp at dusk.",
    spec: "About 34 cm tall · up to 800 triangles",
    twist: "Would a warm amber core or firefly-green glass suit your camp?",
    fields: [
      "A cosy forest camping game at twilight",
      "A lantern that marks the entrance to camp",
      "An angular dark metal frame and amber glass, about 34 cm tall",
      "The base stands upright, the handle reads from a distance, and the export stays under 800 triangles",
    ],
    folder: "twilight-lantern",
    manual: [
      "Delete the default cube. Add a cylinder for the base. Set its dimensions to 0.20 × 0.20 × 0.06 m and its Z location to 0.03 m.",
      "Add a narrower cylinder for the glass. Use 0.13 × 0.13 × 0.18 m at Z = 0.15 m.",
      "Add a cap cylinder at Z = 0.265 m with dimensions 0.22 × 0.22 × 0.05 m. Try a small upright torus for the handle.",
      "Look from the side. Check that the cap touches the glass and the base sits flat. Save as lantern-v1.blend.",
    ],
    images: ["forest-lantern.webp", "forest-lantern-revision.webp"],
    variants: ["Warm amber", "Firefly green"],
    imageDetail: "Faceted camping lantern with a green frame",
    tip: "Switch to the forest. Does the glass read as a beacon, and can you still see the handle?",
    patch:
      "Change the core from amber to firefly green. Keep the height, dark metal frame and handle.",
    godot:
      "If the lantern guides the player, test it in a dark area and check that the bright core reads from the approach path.",
  },
  cell: {
    name: "Orbital power cell",
    scene:
      "Make a battery players can pick out of a cluttered space-station workshop.",
    spec: "About 40 cm wide · up to 900 triangles",
    twist:
      "What reads better from above: yellow terminals or a bold charge indicator?",
    fields: [
      "A salvage game set on a derelict space station",
      "A power cell players can recognise and pick up in a cluttered workshop",
      "Violet housing, yellow terminals and a charge indicator, about 40 cm wide",
      "The terminals read from 45 degrees above, the base rests flat, and the export stays under 900 triangles",
    ],
    folder: "orbital-power-cell",
    manual: [
      "Set the default cube’s dimensions to 0.40 × 0.24 × 0.18 m and its Z location to 0.09 m.",
      "Add two small cubes for terminals. Make each 0.05 × 0.05 × 0.06 m and set Z = 0.21 m. Put both toward the same end, spaced apart along Y.",
      "Add a thin, wide box on the front as a charge indicator. Check that both terminals are visible when you look down from an angle.",
      "Save the blockout as power-cell-v1.blend.",
    ],
    images: ["orbital-battery.webp", "orbital-battery-revision.webp"],
    variants: ["Violet housing", "Blue housing"],
    imageDetail: "Power cell with yellow terminals and green charge lights",
    tip: "Try a dim room and snow. Can you read both yellow terminals and the charge bars? The shell colour is the only change.",
    patch:
      "Try a cooler blue housing. Keep the yellow terminals, dimensions and charge lights.",
    godot:
      "If the cell is a pickup, use an Area3D and a collision shape to detect the player, then test its readability from your game camera.",
  },
};

const routeNotes = {
  agent:
    "The agent program can use the files and tools you allow on this computer. The model usually runs online through your account. Open your practice folder in one of the tools below.",
  chat: "Ask your chat AI for Blender steps. Open your practice folder yourself, then use Blender to follow the steps and save your files.",
  solo: "Open Blender and try a prop’s hand-built blockout. You can use the lab to make a checklist without signing in anywhere.",
};

const fieldIds = ["world", "prop", "look", "checks"];
const fieldLabels = [
  "Game world",
  "Prop and purpose",
  "Look and size",
  "How to check it",
];
const get = (id) => document.getElementById(id);
const checkboxes = [...document.querySelectorAll("[data-check]")];
const storageKey = "game-asset-workshop-v2";

function readPreferences() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

const saved = readPreferences();
const progress = new Set(
  checkboxes
    .map((item) => item.dataset.check)
    .filter(
      (id) => Array.isArray(saved.progress) && saved.progress.includes(id),
    ),
);
let selected = Object.hasOwn(props, saved.prop) ? saved.prop : "crate";
let route = Object.hasOwn(routeNotes, saved.route) ? saved.route : "agent";
let light = saved.light === true;
let variant = 0;
let fieldsEdited = false;
let labProp = selected;
let draftManual = false;
let previousDraft = null;
let hintTimer;
const lookIdeas = {
  crate: [
    "Amber latches and a chunky handle, 1.2 m wide",
    "Signal red shell with dark metal corners, 1.2 m wide",
    "Weathered teal panels and a bright rescue mark, 1.2 m wide",
  ],
  lantern: [
    "Amber glass in a dark angular frame, 34 cm tall",
    "Firefly-green glass with a loop handle, 34 cm tall",
    "Copper frame and warm frosted glass, 34 cm tall",
  ],
  cell: [
    "Violet housing and yellow terminals, 40 cm wide",
    "Blue housing with bright charge bars, 40 cm wide",
    "White casing with orange terminals and a grip, 40 cm wide",
  ],
};

function savePreferences() {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ prop: selected, route, light, progress: [...progress] }),
    );
  } catch {
    // The current session still works if a browser blocks local storage.
  }
}

function updatePressed(attribute, value) {
  for (const button of document.querySelectorAll(`[data-${attribute}]`)) {
    button.setAttribute(
      "aria-pressed",
      String(button.getAttribute(`data-${attribute}`) === String(value)),
    );
  }
}

function setImage(id, prop, index) {
  const image = get(id);
  image.src = `./media/${prop.images[index]}`;
  image.alt = `${prop.imageDetail}, ${prop.variants[index].toLowerCase()}`;
}

function renderViewport() {
  const prop = props[selected];
  setImage("hero-image", prop, variant);
  get("hero-name").textContent = prop.name;
  get("hero-caption").textContent =
    `${prop.variants[variant]} · Blender render`;
  updatePressed("variant", variant);
}

function replaceSteps(id, steps) {
  get(id).replaceChildren(
    ...steps.map((step) => {
      const item = document.createElement("li");
      item.textContent = step;
      return item;
    }),
  );
}

function formatPrompt(values, folder = "prop-v1") {
  const brief = values.flatMap((value, index) =>
    value ? [`${fieldLabels[index]}: ${value}`] : [],
  );
  if (route === "solo") {
    return [
      "MY BLENDER BUILD CHECKLIST",
      "",
      ...brief,
      "",
      "[ ] Block out the main shapes and check the size from two angles.",
      "[ ] Add one detail that helps the player recognise the prop.",
      `[ ] Save an editable .blend and GLB in a new folder such as ${folder}/.`,
      "[ ] Re-import the GLB in a fresh scene and check it against the brief.",
    ].join("\n");
  }
  const workflow =
    route === "chat"
      ? "Walk me through making this by hand in Blender. Start with a short plan, then give me numbered UI steps. Pause after the blockout so I can check the size and outline. Use a new folder in my practice folder and preserve existing files. Finish with steps to save an editable .blend, export a GLB and re-import it to check the result."
      : `Pitch a short plan and wait for my approval. After approval, use a separate background Blender process in this practice folder. Save an editable .blend and GLB in a new folder such as ${folder}/. Preserve existing files and open scenes. Reopen the .blend and re-import the GLB in a fresh scene. Tell me what you checked and where the files are.`;
  return [...brief, "", workflow].join("\n");
}

function renderRoute() {
  const prop = props[selected];
  updatePressed("route", route);
  get("route").value = route;
  get("route-note").textContent = routeNotes[route];
  get("agent-setup").hidden = route !== "agent";
  get("connection").hidden = route !== "agent";
  get("chat-connection").hidden = route !== "chat";
  get("first-prompt").textContent = formatPrompt(
    prop.fields,
    `${prop.folder}-v1`,
  );
  get("copy-first").textContent =
    route === "solo" ? "Copy build checklist" : "Copy prop brief";
  const buildSteps = {
    agent: [
      "Save any work open in Blender. Paste the brief into your agent’s session.",
      "Read the plan and file paths before approving the build.",
      "Find the .blend in the agent’s reply. Open it, switch to Material Preview and compare the prop with your brief.",
    ],
    chat: [
      "Paste the brief into your chat AI. Ask where each Blender command appears in the interface.",
      "Follow the steps in a new scene. Pause after the blockout to check the shape.",
      "Save the .blend in your practice folder, then look at it from two angles.",
    ],
    solo: [
      "Open the blockout steps below. Start with a new scene and just the main shapes.",
      "Pick a detail you want to add once the silhouette reads clearly.",
      "Save the .blend in your practice folder and keep it for your next pass.",
    ],
  };
  replaceSteps("build-steps", buildSteps[route]);
  const revision =
    route === "solo"
      ? `[ ] Save a copy of the .blend in a new folder.\n[ ] ${prop.patch}\n[ ] Export and re-import the GLB. Compare it with the first version.`
      : route === "chat"
        ? `${prop.patch} Give me Blender steps to save a separate version in a new folder, export and re-import the GLB, and compare it with the first version.`
        : `${prop.patch} Preserve existing files and open scenes. Save a separate version in a new folder such as ${prop.folder}-v2/. Re-import the GLB and report whether the change carried through.`;
  get("revise-prompt").textContent = revision;
  updateDraft();
}

function renderProp() {
  const prop = props[selected];
  updatePressed("prop", selected);
  renderViewport();
  get("brief-name").textContent = prop.name;
  get("brief-world").textContent = prop.scene;
  get("brief-spec").textContent = prop.spec;
  get("brief-twist").textContent = prop.twist;
  get("load-brief").textContent = `Load ${prop.name.toLowerCase()} brief`;
  replaceSteps("manual-steps", prop.manual);
  get("compare-name").textContent = prop.name;
  setImage("compare-before", prop, 0);
  setImage("compare-after", prop, 1);
  get("before-caption").textContent = `V1 · ${prop.variants[0]}`;
  get("after-caption").textContent = `V2 · ${prop.variants[1]}`;
  get("inspect-tip").textContent = prop.tip;
  get("godot-tip").textContent = prop.godot;
  renderRoute();
}

for (const button of document.querySelectorAll("[data-prop]")) {
  button.addEventListener("click", () => {
    selected = button.dataset.prop;
    variant = 0;
    renderProp();
    if (!fieldsEdited) seedFields();
    else
      get("lab-status").textContent =
        `Your lab fields are unchanged. Select Load ${props[selected].name.toLowerCase()} brief to replace them.`;
    get("prop-status").textContent =
      `${props[selected].name} selected. Your brief and worked example are ready.`;
    savePreferences();
  });
}

for (const button of document.querySelectorAll("[data-variant]")) {
  button.addEventListener("click", () => {
    variant = Number(button.dataset.variant);
    renderViewport();
  });
}

for (const button of document.querySelectorAll("[data-backdrop]")) {
  button.addEventListener("click", () => {
    get("comparison").dataset.backdrop = button.dataset.backdrop;
    updatePressed("backdrop", button.dataset.backdrop);
  });
}

function selectRoute(value) {
  if (route !== value && value === "solo") get("manual").open = true;
  route = value;
  renderRoute();
  savePreferences();
}

for (const button of document.querySelectorAll("[data-route]")) {
  button.addEventListener("click", () => selectRoute(button.dataset.route));
}
get("route").addEventListener("change", (event) =>
  selectRoute(event.target.value),
);

const tabs = [...document.querySelectorAll(".provider-tabs [role=tab]")];
function selectTab(tab) {
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
    get(item.getAttribute("aria-controls")).hidden = !active;
  }
}
for (const tab of tabs) {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    const current = tabs.indexOf(tab);
    const indices = {
      ArrowLeft: (current - 1 + tabs.length) % tabs.length,
      ArrowRight: (current + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!Object.hasOwn(indices, event.key)) return;
    event.preventDefault();
    const next = tabs[indices[event.key]];
    selectTab(next);
    next.focus();
  });
}

function updateMeter() {
  clearTimeout(hintTimer);
  const filled = fieldIds.filter((id) => get(id).value.trim());
  for (const item of document.querySelectorAll("[data-spec]")) {
    const complete = filled.includes(item.dataset.spec);
    item.classList.toggle("filled", complete);
    const label = item.textContent.replace(/^[✓·] /, "");
    const text = `${complete ? "✓" : "·"} ${label}`;
    if (item.textContent !== text) item.textContent = text;
  }
  const look = get("look").value;
  const checks = get("checks").value;
  const hints = [];
  if (filled.length < 4) hints.push(`${filled.length} of 4 fields filled.`);
  if (/\b(cool|nice|awesome|epic)\b/i.test(look))
    hints.push(
      "Give words like “cool” a concrete detail, such as brushed metal or a bright yellow handle.",
    );
  if (!/\b\d+(?:\.\d+)?\s*(?:mm|cm|m|metres?)\b/i.test(look))
    hints.push("Try a size such as 40 cm wide.");
  if (
    !/\b(floor|base|triangles?|angle|above|front|side|scale|silhouette|colours?|material|height|width)\b/i.test(
      checks,
    )
  )
    hints.push(
      "Name a check you can see or measure, such as a base that sits flat on the floor.",
    );
  const message = hints.length
    ? hints.join(" ")
    : "All four fields have details. Read them back: could you check each one?";
  if (get("spec-status").textContent !== message)
    get("spec-status").textContent = message;
}

function updateDraft() {
  if (draftManual) return;
  const values = fieldIds.map((id) => get(id).value.trim());
  get("draft").value = formatPrompt(values, `${props[labProp].folder}-v1`);
}

function seedFields() {
  labProp = selected;
  props[selected].fields.forEach((value, index) => {
    get(fieldIds[index]).value = value;
  });
  renderChips();
  updateMeter();
  updateDraft();
}

function renderChips() {
  get("look-label").textContent =
    `Looks for the ${props[labProp].name.toLowerCase()}`;
  get("look-chips").replaceChildren(
    ...lookIdeas[labProp].map((idea) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = idea;
      button.addEventListener("click", () => {
        get("look").value = idea;
        fieldsEdited = true;
        updateMeter();
        updateDraft();
        get("look").focus();
      });
      return button;
    }),
  );
}

get("use-brief").addEventListener("click", () => {
  window.location.hash = "prompt-lab";
  if (labProp !== selected) {
    get("lab-status").textContent =
      `The Lab still has your ${props[labProp].name.toLowerCase()} edits. You can load the ${props[selected].name.toLowerCase()} brief when ready.`;
    get("load-brief").focus();
  } else {
    get("look").focus();
  }
});
get("load-brief").addEventListener("click", () => {
  fieldsEdited = false;
  seedFields();
  get("lab-status").textContent = draftManual
    ? "Starter fields loaded. Your manual draft is unchanged; rebuild it when ready."
    : "Starter fields loaded. Change a detail to make it yours.";
  get("look").focus();
});
get("brief").addEventListener("input", (event) => {
  if (fieldIds.includes(event.target.id)) fieldsEdited = true;
  updateDraft();
  clearTimeout(hintTimer);
  hintTimer = setTimeout(updateMeter, 400);
});
get("brief").addEventListener("submit", (event) => event.preventDefault());
get("draft").addEventListener("input", () => {
  draftManual = true;
  previousDraft = null;
  get("undo-rebuild").hidden = true;
  get("rebuild-draft").hidden = false;
  get("draft-mode").textContent =
    "Edited by hand. Rebuild from fields to replace this version with the live draft.";
});
get("rebuild-draft").addEventListener("click", () => {
  previousDraft = get("draft").value;
  draftManual = false;
  updateDraft();
  get("rebuild-draft").hidden = true;
  get("undo-rebuild").hidden = false;
  get("draft").focus();
  get("draft-mode").textContent = "Live: field changes update this draft.";
  get("lab-status").textContent =
    "Draft rebuilt. Use Undo rebuild to bring back your edits.";
});
get("undo-rebuild").addEventListener("click", () => {
  if (previousDraft === null) return;
  get("draft").value = previousDraft;
  get("draft").dispatchEvent(new Event("input"));
  get("lab-status").textContent = "Your hand-edited draft is back.";
  get("draft").focus();
});

for (const button of document.querySelectorAll("[data-answer]")) {
  button.addEventListener("click", () => {
    updatePressed("answer", button.dataset.answer);
    get("challenge-feedback").textContent =
      button.dataset.answer === "specific"
        ? "That gives the agent a feature and a reason for it. Now add something you can check."
        : "“Cool” leaves the look and purpose open. Try the brief that describes what a player should see.";
  });
}

for (const button of document.querySelectorAll("[data-revision-choice]")) {
  button.addEventListener("click", () => {
    const choice = button.dataset.revisionChoice;
    updatePressed("revision-choice", choice);
    get("patch-feedback").textContent =
      choice === "focused"
        ? "One change to look for and two things to keep. You could compare that in seconds."
        : "There’s no clear target here. Pick the change you want to see first and name what to keep.";
  });
}

function renderTheme() {
  document.documentElement.dataset.theme = light ? "light" : "dark";
  get("theme").textContent = light ? "Dark mode" : "Light mode";
}
get("theme").addEventListener("click", () => {
  light = !light;
  renderTheme();
  savePreferences();
});

function renderProgress() {
  const count = progress.size;
  for (const checkbox of checkboxes)
    checkbox.checked = progress.has(checkbox.dataset.check);
  get("hud-progress").textContent = `${count} / ${checkboxes.length}`;
  get("hud-progress").setAttribute(
    "aria-label",
    `${count} of ${checkboxes.length} checkpoints marked`,
  );
  get("progress-meter").value = count;
  get("progress-text").textContent =
    count === checkboxes.length
      ? "5 of 5 marked. You took a prop from brief to playtest."
      : `${count} of ${checkboxes.length} checkpoints marked.`;
  get("reset-progress").disabled = count === 0;
}
for (const checkbox of checkboxes) {
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) progress.add(checkbox.dataset.check);
    else progress.delete(checkbox.dataset.check);
    renderProgress();
    savePreferences();
  });
}
get("reset-progress").addEventListener("click", () => {
  progress.clear();
  renderProgress();
  savePreferences();
});

renderTheme();
renderProp();
get("manual").open = route === "solo";
renderProgress();
seedFields();

let feedbackTimer;

for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const source = get(button.dataset.copy);
    const text = source.value ?? source.textContent;
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      // The local file and private HTTP routes can use the fallback.
    }
    if (!copied) {
      const temporary = document.createElement("textarea");
      temporary.value = text;
      temporary.readOnly = true;
      temporary.className = "copy-helper";
      document.body.append(temporary);
      temporary.select();
      try {
        copied = document.execCommand("copy");
      } catch {
        // Some browsers require the learner to copy from a selection.
      } finally {
        temporary.remove();
      }
    }
    const feedback = get("copy-feedback");
    if (!copied) {
      if (source instanceof HTMLTextAreaElement) {
        source.focus();
        source.select();
      } else {
        const range = document.createRange();
        range.selectNodeContents(source);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    } else {
      button.focus();
    }
    feedback.textContent = copied
      ? "Copied to clipboard."
      : "Text selected. Copy it from the selection.";
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedback.textContent = "";
    }, 4500);
  });
}
