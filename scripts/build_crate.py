"""Build an editable supply crate, export it, and verify the export in Blender."""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from math import radians
from pathlib import Path
from tempfile import mkdtemp

import bpy
from mathutils import Euler, Vector


OUTPUT_ROOT = Path(__file__).resolve().parents[1] / "output"
BODY_COLOUR = (0.025, 0.35, 0.32, 1.0)


def from_hex(colour):
    channels = [int(colour[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    return tuple(
        channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4
        for channel in channels
    ) + (1.0,)


def to_hex(colour):
    channels = [min(1, max(0, channel)) for channel in colour[:3]]
    srgb = [
        12.92 * channel if channel <= 0.0031308 else 1.055 * channel ** (1 / 2.4) - 0.055
        for channel in channels
    ]
    return "#" + "".join(f"{round(channel * 255):02X}" for channel in srgb)


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--colour", help="Shell colour as an sRGB #RRGGBB value")
    parser.add_argument("--label", default="", help="Name for this version")
    parser.add_argument("--no-preview", action="store_true", help="Skip preview rendering")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    if args.colour is not None and not re.fullmatch(r"#[0-9a-fA-F]{6}", args.colour):
        parser.error("--colour must use the #RRGGBB format")
    if len(args.label) > 32 or not all(char.isprintable() for char in args.label):
        parser.error("--label must contain at most 32 printable characters")
    return args


def make_material(name, colour, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = colour
    material.use_nodes = True
    surface = material.node_tree.nodes["Principled BSDF"]
    surface.inputs["Base Color"].default_value = colour
    surface.inputs["Metallic"].default_value = metallic
    surface.inputs["Roughness"].default_value = 0.42
    return material


def add_box(name, center, size, material, bevel_width):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    part = bpy.context.object
    part.name = name
    part.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    part.data.materials.append(material)
    bevel = part.modifiers.new("Rounded edges", "BEVEL")
    bevel.width = bevel_width
    bevel.segments = 1
    return part


def build_crate(colour):
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    body = make_material("Painted shell", colour)
    rubber = make_material("Graphite bumpers", (0.025, 0.035, 0.045, 1.0))
    latch = make_material("Amber hardware", (0.95, 0.34, 0.035, 1.0), metallic=0.3)

    root = bpy.data.objects.new("Supply Crate", None)
    scene.collection.objects.link(root)
    parts = [
        add_box("Shell", (0, 0, 0.41), (1.08, 0.72, 0.70), body, 0.065),
        add_box("Base bumper", (0, 0, 0.06), (1.20, 0.80, 0.12), rubber, 0.035),
        add_box("Lid bumper", (0, 0, 0.75), (1.20, 0.80, 0.14), rubber, 0.035),
        add_box("Lid panel", (0, 0, 0.825), (1.06, 0.66, 0.07), body, 0.025),
        add_box("Handle", (0, 0, 0.94), (0.37, 0.08, 0.07), rubber, 0.015),
    ]
    for side, x in (("Left", -1), ("Right", 1)):
        parts.extend([
            add_box(f"{side} handle mount", (x * 0.155, 0, 0.885),
                    (0.06, 0.08, 0.09), rubber, 0.012),
            add_box(f"{side} latch", (x * 0.34, -0.37, 0.66),
                    (0.12, 0.09, 0.17), latch, 0.015),
        ])
    for index in range(3):
        parts.append(add_box(f"Front marking {index + 1}",
                             ((index - 1) * 0.085, -0.362, 0.38),
                             (0.05, 0.015, 0.085), latch, 0.005))
    for part in parts:
        part.parent = root

    bpy.ops.object.select_all(action="DESELECT")
    parts[0].select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                space = area.spaces.active
                space.shading.color_type = "MATERIAL"
                space.region_3d.view_location = (0, 0, 0.45)
                space.region_3d.view_rotation = Euler(
                    (radians(67), 0, radians(27)), "XYZ"
                ).to_quaternion()
                space.region_3d.view_distance = 2.6


def check_asset(colour):
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    materials = {material.name for obj in meshes for material in obj.data.materials}
    if len(meshes) != 12 or materials != {"Painted shell", "Graphite bumpers", "Amber hardware"}:
        raise RuntimeError("Expected 12 mesh parts and the three crate materials.")
    shell = bpy.data.materials["Painted shell"].node_tree.nodes.get("Principled BSDF")
    if shell is None or any(
        abs(actual - expected) > 0.00001
        for actual, expected in zip(shell.inputs["Base Color"].default_value, colour)
    ):
        raise RuntimeError("The saved shell material does not match the chosen colour.")

    corners = [obj.matrix_world @ vertex.co for obj in meshes for vertex in obj.data.vertices]
    minimum = [min(point[axis] for point in corners) for axis in range(3)]
    maximum = [max(point[axis] for point in corners) for axis in range(3)]
    size = [upper - lower for lower, upper in zip(minimum, maximum)]
    expected_size = (1.20, 0.815, 0.975)
    if abs(minimum[2]) > 0.001 or any(
        abs(actual - expected) > 0.001 for actual, expected in zip(size, expected_size)
    ):
        raise RuntimeError(f"Unexpected crate size or ground height: {size}, {minimum[2]}")

    for obj in meshes:
        obj.data.calc_loop_triangles()
    triangles = sum(len(obj.data.loop_triangles) for obj in meshes)
    if not 0 < triangles <= 1000:
        raise RuntimeError(f"Expected between 1 and 1,000 triangles. Found {triangles}.")
    return {
        "triangles": triangles,
        "dimensions": [round(dimension, 3) for dimension in size],
        "ground": round(minimum[2], 3),
    }


def render_previews(output):
    # Only the re-imported scene gets a camera and render settings.
    scene = bpy.context.scene
    camera = bpy.data.objects.new("Preview Camera", bpy.data.cameras.new("Preview Camera"))
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 1.75
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 480
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = True
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "MATERIAL"
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.show_shadows = True
    scene.view_settings.view_transform = "Standard"
    for material in bpy.data.materials:
        if material.use_nodes:
            surface = material.node_tree.nodes.get("Principled BSDF")
            if surface is not None:
                material.diffuse_color = surface.inputs["Base Color"].default_value

    for angle, location in (("front", (2.3, -3.5, 2.5)), ("back", (-2.3, 3.5, 2.5))):
        camera.location = location
        camera.rotation_euler = (Vector((0, 0, 0.48)) - camera.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = str(output / f"preview-{angle}.png")
        if bpy.ops.render.render(write_still=True) != {"FINISHED"}:
            raise RuntimeError(f"Blender could not render the {angle} view.")


def main():
    if not bpy.app.background:
        raise RuntimeError("Run this script from the terminal with Blender's --background option.")

    args = arguments()
    colour = from_hex(args.colour) if args.colour else BODY_COLOUR
    label = args.label.strip() or ("Custom crate" if args.colour else "Crate from script")
    now = datetime.now(timezone.utc)
    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-") or "crate"
    OUTPUT_ROOT.mkdir(exist_ok=True)
    output = Path(mkdtemp(prefix=f"crate-{now:%Y%m%d-%H%M%S}-{slug}-", dir=OUTPUT_ROOT))
    blend_path = output / "supply-crate.blend"
    glb_path = output / "supply-crate.glb"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_crate(colour)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB", export_apply=True)

    bpy.ops.wm.open_mainfile(filepath=str(blend_path))
    check_asset(colour)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    metrics = check_asset(colour)
    triangles = metrics["triangles"]
    print(f"Verified editable Blender file and GLB export ({triangles} export triangles): {output}")

    manifest = {
        "label": label,
        "created_at": now.isoformat(),
        "colour": args.colour.upper() if args.colour else to_hex(colour),
        "blender": bpy.app.version_string,
        "verified": True,
        "previews": False,
        "preview_error": None,
        **metrics,
    }
    if not args.no_preview:
        try:
            render_previews(output)
        except (RuntimeError, ValueError) as error:
            manifest["preview_error"] = str(error)
        else:
            manifest["previews"] = True
    temporary_manifest = output / "manifest.tmp"
    temporary_manifest.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    temporary_manifest.replace(output / "manifest.json")
    print(f"WORKSHOP_RUN {output.name}", flush=True)


if __name__ == "__main__":
    main()
