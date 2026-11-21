"""Launch the local Game Asset Workshop."""

import argparse
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output"
STATIC = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/guide.css": ("guide.css", "text/css; charset=utf-8"),
    "/guide.js": ("guide.js", "text/javascript; charset=utf-8"),
    "/media/field-crate.webp": ("media/field-crate.webp", "image/webp"),
    "/media/signal-crate.webp": ("media/signal-crate.webp", "image/webp"),
    "/media/forest-lantern.webp": ("media/forest-lantern.webp", "image/webp"),
    "/media/forest-lantern-revision.webp": ("media/forest-lantern-revision.webp", "image/webp"),
    "/media/orbital-battery.webp": ("media/orbital-battery.webp", "image/webp"),
    "/media/orbital-battery-revision.webp": ("media/orbital-battery-revision.webp", "image/webp"),
    "/example": ("example.html", "text/html; charset=utf-8"),
    "/style.css": ("style.css", "text/css; charset=utf-8"),
    "/app.js": ("app.js", "text/javascript; charset=utf-8"),
}
FILES = {
    "supply-crate.blend": "application/octet-stream",
    "supply-crate.glb": "model/gltf-binary",
    "preview-front.png": "image/png",
    "preview-back.png": "image/png",
}
RUN_ID = re.compile(r"crate-[a-z0-9_-]{8,80}")
LEGACY_ID = re.compile(r"crate-[a-z0-9_]{8}")
COLOUR = re.compile(r"#[0-9a-fA-F]{6}")


def read_run(folder):
    if (
        not RUN_ID.fullmatch(folder.name)
        or OUTPUT.is_symlink()
        or not folder.is_dir()
        or folder.is_symlink()
    ):
        return None
    blend = folder / "supply-crate.blend"
    glb = folder / "supply-crate.glb"
    if any(not path.is_file() or path.is_symlink() for path in (blend, glb)):
        return None

    manifest = folder / "manifest.json"
    if manifest.is_file() and not manifest.is_symlink():
        try:
            run = json.loads(manifest.read_text(encoding="utf-8"))
            if (
                not isinstance(run, dict)
                or run.get("verified") is not True
                or not isinstance(run.get("created_at"), str)
            ):
                return None
            run["previews"] = run.get("previews") is True and all(
                (folder / name).is_file() and not (folder / name).is_symlink()
                for name in ("preview-front.png", "preview-back.png")
            )
        except (OSError, ValueError):
            return None
    elif LEGACY_ID.fullmatch(folder.name):
        run = {
            "label": "Earlier crate",
            "created_at": datetime.fromtimestamp(folder.stat().st_mtime, timezone.utc).isoformat(),
            "colour": None,
            "triangles": None,
            "dimensions": None,
            "ground": None,
            "blender": None,
            "verified": False,
            "previews": False,
            "preview_error": None,
        }
    else:
        return None

    return {
        **run, "id": folder.name, "folder": str(folder),
        "blend_path": str(blend), "glb_path": str(glb),
    }


def find_blender(executable):
    path = shutil.which(executable)
    if path is None:
        return None, None, "Blender is missing. Install it or restart the workshop with --blender and the full executable path."
    path = str(Path(path).resolve())
    try:
        probe = subprocess.run([path, "--version"], capture_output=True, text=True, timeout=10, check=True)
        version = next(line.strip() for line in probe.stdout.splitlines() if line.startswith("Blender "))
    except (OSError, subprocess.SubprocessError, StopIteration):
        return None, None, "Blender could not start. Check the installation and restart the workshop."
    return path, version, None


class WorkshopServer(ThreadingHTTPServer):
    def __init__(self, port, blender):
        self.blender, self.version, self.setup_error = find_blender(blender)
        self.build_lock = Lock()
        super().__init__(("127.0.0.1", port), WorkshopRequest)
        self.host = f"127.0.0.1:{self.server_port}"


class WorkshopRequest(BaseHTTPRequestHandler):
    def local_request(self):
        host = self.headers.get("Host")
        origin = self.headers.get("Origin")
        if host == self.server.host and origin in (None, f"http://{self.server.host}"):
            return True
        self.send_json(HTTPStatus.FORBIDDEN, {"error": "Open the workshop at the local address printed in your terminal."})
        return False

    def send_data(self, status, data, content_type, attachment=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy",
                         "default-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'")
        if attachment:
            self.send_header("Content-Disposition", f'attachment; filename="{attachment}"')
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, status, value):
        self.send_data(status, json.dumps(value).encode("utf-8"), "application/json; charset=utf-8")

    def do_GET(self):
        if not self.local_request():
            return
        path = urlsplit(self.path).path
        if path == "/api/state":
            runs = []
            if OUTPUT.is_dir():
                runs = [run for folder in OUTPUT.iterdir() if (run := read_run(folder))]
                runs.sort(key=lambda run: run["created_at"], reverse=True)
            self.send_json(HTTPStatus.OK, {
                "blender": self.server.version, "error": self.server.setup_error, "runs": runs,
            })
            return
        if path in STATIC:
            name, content_type = STATIC[path]
            self.send_data(HTTPStatus.OK, (ROOT / "web" / name).read_bytes(), content_type)
            return

        parts = path.split("/")
        if len(parts) == 4 and parts[1] == "files":
            _, _, run_id, name = parts
            if RUN_ID.fullmatch(run_id) and name in FILES:
                folder = OUTPUT / run_id
                run = read_run(folder)
                file = folder / name
                if run and (name.startswith("supply-") or run["previews"]) and not file.is_symlink():
                    try:
                        data = file.read_bytes()
                    except OSError:
                        pass
                    else:
                        self.send_data(HTTPStatus.OK, data, FILES[name],
                                       name if name.startswith("supply-") else None)
                        return
        self.send_json(HTTPStatus.NOT_FOUND, {"error": "This workshop file is unavailable."})

    def do_POST(self):
        if not self.local_request():
            return
        if self.path != "/api/build":
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "This workshop action is unavailable."})
            return
        if self.server.setup_error:
            self.send_json(HTTPStatus.SERVICE_UNAVAILABLE, {"error": self.server.setup_error})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if self.headers.get_content_type() != "application/json" or not 0 < size <= 4096:
                raise ValueError
            self.connection.settimeout(10)
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                raise ValueError
            colour, label = data.get("colour"), data.get("label", "")
        except (OSError, ValueError):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "The build request could not be read."})
            return
        if colour is not None and (not isinstance(colour, str) or not COLOUR.fullmatch(colour)):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Use a colour in #RRGGBB format, such as #C84438."})
            return
        if not isinstance(label, str) or len(label) > 32 or not all(char.isprintable() for char in label):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Use up to 32 printable characters for the version name."})
            return
        if not self.server.build_lock.acquire(blocking=False):
            self.send_json(HTTPStatus.CONFLICT, {"error": "Blender is still building a crate. Try again when it finishes."})
            return
        try:
            self.build(colour, label.strip())
        finally:
            self.server.build_lock.release()

    def build(self, colour, label):
        command = [
            self.server.blender, "--background", "--factory-startup", "--python-exit-code", "1",
            "--python", str(ROOT / "scripts" / "build_crate.py"), "--", f"--label={label}",
        ]
        if colour is not None:
            command.append(f"--colour={colour}")
        try:
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    errors="replace", timeout=120)
        except subprocess.TimeoutExpired:
            self.send_json(HTTPStatus.GATEWAY_TIMEOUT, {
                "error": "Blender took too long. Earlier crates are still available. Try building again.",
            })
            return
        except OSError as error:
            self.send_json(HTTPStatus.SERVICE_UNAVAILABLE, {
                "error": "Blender could not start. Check the installation and restart the workshop.",
                "details": str(error),
            })
            return

        run_id = next(
            (line.removeprefix("WORKSHOP_RUN ") for line in reversed(result.stdout.splitlines())
             if line.startswith("WORKSHOP_RUN ")), "",
        )
        run = read_run(OUTPUT / run_id) if result.returncode == 0 and RUN_ID.fullmatch(run_id) else None
        if run is None:
            details = (result.stdout + "\n" + result.stderr).replace(str(ROOT), ".").strip()[-10000:]
            self.send_json(HTTPStatus.UNPROCESSABLE_ENTITY, {
                "error": "Blender could not finish checking this crate. Earlier crates are still available.",
                "details": details,
            })
            return

        self.send_json(HTTPStatus.CREATED, {"run": run})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--blender", default="blender", help="Path to the Blender executable")
    parser.add_argument("--port", type=int, default=8765, help="Local port, or 0 for a free port")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("--port must be between 0 and 65535")
    try:
        server = WorkshopServer(args.port, args.blender)
    except OSError as error:
        parser.exit(1, f"Could not start the workshop: {error}. Try again with --port 0.\n")
    with server:
        print(f"Open the workshop at http://{server.host}/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
