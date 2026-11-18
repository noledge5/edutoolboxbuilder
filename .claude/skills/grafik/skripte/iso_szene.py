# Usage: python iso_szene.py -- szene.json out.png [size]
# szene.json: {"paket": "<ordner mit .blend>", "teile": [{"datei": "Buildings/Blends/House_1.blend", "pos": [x,y,z], "dreh": grad, "skala": 1}]}
import bpy, sys, json, math, mathutils, os
args = sys.argv[sys.argv.index("--")+1:]
sz = json.load(open(args[0])); out = args[1]; size = int(args[2]) if len(args) > 2 else 768
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
for t in sz["teile"]:
    with bpy.data.libraries.load(os.path.join(sz["paket"], t["datei"])) as (src, dst):
        dst.objects = src.objects
    root = bpy.data.objects.new("teil", None); sc.collection.objects.link(root)
    for o in dst.objects:
        if o is None or o.type in ('CAMERA', 'LIGHT'): continue
        sc.collection.objects.link(o)
        if o.parent is None: o.parent = root
    root.location = t.get("pos", (0, 0, 0)); root.rotation_euler[2] = math.radians(t.get("dreh", 0))
    root.scale = [t.get("skala", 1)] * 3
bpy.context.view_layer.update()
objs = [o for o in sc.objects if o.type == 'MESH']
pts = [o.matrix_world @ mathutils.Vector(c) for o in objs for c in o.bound_box]
lo = mathutils.Vector([min(p[i] for p in pts) for i in range(3)]); hi = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
mid = (lo + hi) / 2; diag = (hi - lo).length
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam)
cam.data.type = 'ORTHO'; cam.data.ortho_scale = diag * 0.95
cam.rotation_euler = (math.radians(60), 0, math.radians(45))
cam.location = mid + cam.rotation_euler.to_matrix() @ mathutils.Vector((0, 0, 1)) * diag * 3
cam.data.clip_end = diag * 10; sc.camera = cam
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = sz.get("sonne", 3.5); sun.rotation_euler = (math.radians(45), math.radians(20), math.radians(-30))
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes["Background"]; bg.inputs[0].default_value = sz.get("himmel", (1, 0.97, 0.9, 1)); bg.inputs[1].default_value = sz.get("umgebung", 0.6)
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 32; sc.cycles.use_denoising = False
sc.render.film_transparent = True; sc.render.resolution_x = sc.render.resolution_y = size
sc.view_settings.view_transform = 'Standard'; sc.render.image_settings.color_mode = 'RGBA'
sc.render.filepath = out; bpy.ops.render.render(write_still=True); print("OK", out)
