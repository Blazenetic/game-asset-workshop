"use strict";

const $ = (id) => document.getElementById(id);
const state = { runs: [], selected: [null, null], view: "front", busy: false };
const agentPrompt =
  "Read the workshop README and build a starter crate. Ask me what colour fits my game, then build a named version with that colour. Give me the editable Blender file and GLB for both versions so I can compare them.";
const ideasPrompt =
  "Ask me about my fictional game setting, then suggest three supply crate shell colours. Give each a short name and a #RRGGBB code I can paste into the workshop.";

function status(message, kind = "") {
  $("status").textContent = message;
  $("status").className = `status ${kind}`;
}
function diagnostics(details) {
  $("diagnostics").hidden = !details;
  $("diagnostics").open = false;
  $("details-text").textContent = details || "";
  $("error-copy-status").textContent = "";
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function fileUrl(run, name) {
  return `/files/${encodeURIComponent(run.id)}/${encodeURIComponent(name)}`;
}
function runName(run) {
  return run.label || run.id;
}
function runDate(run) {
  const date = new Date(run.created_at);
  return Number.isNaN(date.getTime())
    ? run.created_at || "Date unavailable"
    : date.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}
function filePath(run, extension) {
  const supplied = extension === "blend" ? run.blend_path : run.glb_path;
  if (supplied) return supplied;
  const folder = run.folder || "";
  const separator = folder.includes("\\") && !folder.includes("/") ? "\\" : "/";
  return `${folder.replace(/[\\/]+$/, "")}${separator}supply-crate.${extension}`;
}
async function copyText(text, success, target = "copy-status") {
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch (_) {
    /* Try the local fallback below. */
  }
  if (!copied) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.append(field);
    field.select();
    try {
      copied = document.execCommand("copy");
    } catch (_) {
      /* Show selectable text instead. */
    }
    field.remove();
  }
  $(target).textContent = copied
    ? success
    : "Could not copy automatically. Select and copy this text: " + text;
}
function setBusy(busy) {
  state.busy = busy;
  $("build-colour").disabled = busy;
  $("build-script").disabled = busy;
}

function renderPreview(container, run, side) {
  container.replaceChildren();
  if (!run || !run.previews) {
    const message = run
      ? "No preview for this build. Open its Blender file to inspect it."
      : "Build a crate to see it here.";
    container.append(element("p", "", message));
    return;
  }
  const image = element("img");
  image.src = fileUrl(run, `preview-${side}.png`);
  image.alt = `${side === "front" ? "Front" : "Back"} view of ${runName(run)}`;
  image.addEventListener("error", () => {
    container.replaceChildren(
      element(
        "p",
        "",
        "The preview could not load. Open the Blender file to inspect the crate.",
      ),
    );
  });
  container.append(image);
}

function handoff(run) {
  const actions = element("div", "run-actions");
  [
    ["blend", "Download Blender file"],
    ["glb", "Download GLB"],
  ].forEach(([ext, label]) => {
    const link = element("a", "", label);
    link.href = fileUrl(run, `supply-crate.${ext}`);
    link.download = `supply-crate.${ext}`;
    const copy = element("button", "", `Copy .${ext} path`);
    copy.type = "button";
    copy.addEventListener("click", () =>
      copyText(
        filePath(run, ext),
        `Copied the .${ext} path for ${runName(run)}.`,
        "path-status",
      ),
    );
    actions.append(link, copy);
  });
  return actions;
}

function renderComparison() {
  const container = $("comparison");
  container.replaceChildren();
  ["A", "B"].forEach((side, index) => {
    const card = element("article", "compare-card");
    const top = element("div", "compare-top");
    const label = element("label", "", `VERSION ${side}`);
    label.htmlFor = `compare-${index}`;
    const select = element("select");
    select.id = `compare-${index}`;
    if (!state.runs.length) {
      const option = element("option", "", "No runs yet");
      option.value = "";
      select.append(option);
      select.disabled = true;
    } else {
      state.runs.forEach((run) => {
        const option = element(
          "option",
          "",
          `${runName(run)} · ${runDate(run)}`,
        );
        option.value = run.id;
        select.append(option);
      });
      select.value = state.selected[index];
      select.addEventListener("change", () => {
        state.selected[index] = select.value;
        renderComparison();
        document.getElementById(`compare-${index}`).focus();
      });
    }
    top.append(label, select);
    const preview = element("div", "preview");
    const run = state.runs.find((item) => item.id === state.selected[index]);
    renderPreview(preview, run, state.view);
    const details = [run?.colour];
    if (run?.verified) {
      details.push(`Verified · ${run.triangles} triangles`);
      details.push(`${run.dimensions.join(" × ")} m`);
      details.push("Rests on the ground");
    }
    const caption = element(
      "div",
      "compare-caption",
      details.filter(Boolean).join(" · "),
    );
    caption.hidden = !caption.textContent;
    card.append(top, preview, caption);
    if (run) card.append(handoff(run));
    container.append(card);
  });
}
function renderRuns() {
  const container = $("runs");
  container.replaceChildren();
  $("run-count").textContent =
    `${state.runs.length} ${state.runs.length === 1 ? "RUN" : "RUNS"}`;
  if (!state.runs.length) {
    container.append(
      element(
        "p",
        "empty",
        "No builds yet. Pick a colour to make your first crate.",
      ),
    );
    return;
  }
  state.runs.forEach((run) => {
    const row = element("article", "run");
    const info = element("div");
    info.append(
      element("div", "run-name", runName(run)),
      element(
        "div",
        "run-meta",
        `${runDate(run)}${run.colour ? ` · ${run.colour}` : ""}`,
      ),
    );
    const verification = element(
      "div",
      "run-meta",
      `${run.verified ? "Verified" : "Verification unavailable"}${run.triangles != null ? ` · ${run.triangles} triangles` : ""}`,
    );
    const inspect = element("button", "secondary", "Compare");
    inspect.type = "button";
    inspect.setAttribute("aria-label", `Compare ${runName(run)}`);
    inspect.addEventListener("click", () => {
      state.selected[1] = run.id;
      renderComparison();
      $("compare-1").focus();
    });
    row.append(info, verification, inspect);
    container.append(row);
  });
}
function setRuns(runs, builtId = null) {
  state.runs = Array.isArray(runs) ? runs : [];
  const has = (id) => state.runs.some((run) => run.id === id);
  if (builtId) {
    const previous = state.selected[1] || state.selected[0];
    state.selected = [
      has(previous) && previous !== builtId
        ? previous
        : state.runs[1]?.id || builtId,
      builtId,
    ];
  } else if (!has(state.selected[0]) || !has(state.selected[1])) {
    const preferred = state.runs.filter((run) => run.verified && run.previews);
    const choices = preferred.length >= 2 ? preferred : state.runs;
    state.selected = [
      choices[choices.length - 1]?.id || null,
      choices[0]?.id || null,
    ];
  }
  renderComparison();
  renderRuns();
  const latest = state.runs[0];
  renderPreview($("latest-preview"), latest, "front");
  $("latest-caption").textContent = latest ? runName(latest) : "";
  $("latest-caption").hidden = !latest;
}
async function loadState() {
  try {
    const response = await fetch("/api/state");
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.error || `Could not load workshop (${response.status}).`,
      );
    setRuns(data.runs);
    status(
      data.error ||
        (data.blender
          ? `Ready to build · ${data.blender}`
          : "Blender was not found. Check your setup before building."),
      data.error || !data.blender ? "error" : "",
    );
  } catch (error) {
    status(`Could not connect to the workshop: ${error.message}`, "error");
  }
}
async function build(colour) {
  if (state.busy) return;
  setBusy(true);
  diagnostics("");
  status(
    "Building and checking your crate in Blender. This can take a moment…",
    "busy",
  );
  try {
    const response = await fetch("/api/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colour, label: $("label").value.trim() }),
    });
    const data = await response.json();
    if (!response.ok || !data.run) {
      status(data.error || `Build failed (${response.status}).`, "error");
      diagnostics(data.details);
      return;
    }
    setRuns(
      [data.run, ...state.runs.filter((run) => run.id !== data.run.id)],
      data.run.id,
    );
    status(
      `Built ${runName(data.run)}.${data.run.preview_error ? " The build succeeded, but its preview is unavailable." : " Your new crate is ready to compare."}`,
    );
    if (data.run.preview_error) diagnostics(data.run.preview_error);
  } catch (error) {
    status(`Could not complete the build: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}
$("build-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const chosen = document.querySelector('input[name="palette"]:checked').value;
  const colour =
    chosen === "custom" ? $("hex").value.trim().toUpperCase() : chosen;
  if (!/^#[0-9A-F]{6}$/.test(colour)) {
    status(
      "Enter a colour as # followed by six hex characters, such as #C84438.",
      "error",
    );
    $("hex").focus();
    return;
  }
  build(colour);
});
$("build-script").addEventListener("click", () => build(null));
$("hex").addEventListener("input", () => {
  document.querySelector('input[name="palette"][value="custom"]').checked =
    true;
  if (/^#[0-9a-fA-F]{6}$/.test($("hex").value))
    $("picker").value = $("hex").value;
});
document
  .querySelectorAll('input[name="palette"]')
  .forEach((radio) =>
    radio.addEventListener("change", () => $("hex").setCustomValidity("")),
  );
$("picker").addEventListener("input", () => {
  $("hex").value = $("picker").value.toUpperCase();
  document.querySelector('input[name="palette"][value="custom"]').checked =
    true;
});
document.querySelectorAll("[data-view]").forEach((button) =>
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    document
      .querySelectorAll("[data-view]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    renderComparison();
  }),
);
$("copy-agent").addEventListener("click", () =>
  copyText(agentPrompt, "Coding agent prompt copied."),
);
$("copy-error").addEventListener("click", () =>
  copyText(
    $("details-text").textContent,
    "Build details copied. Check them for personal information before sharing.",
    "error-copy-status",
  ),
);
$("copy-ideas").addEventListener("click", () =>
  copyText(ideasPrompt, "Colour ideas prompt copied."),
);
renderComparison();
renderRuns();
loadState();
