import bpy, sys, mathutils, os
d = sys.argv[sys.argv.index("--")+1]
for f in sorted(os.listdir(d)):
    with bpy.data.libraries.load(os.path.join(d, f)) as (s, t): t.objects = s.objects
    pts = [o.matrix_world @ mathutils.Vector(c) for o in t.objects if o and o.type == 'MESH' for c in o.bound_box]
    lo = [round(min(p[i] for p in pts), 1) for i in range(3)]; hi = [round(max(p[i] for p in pts), 1) for i in range(3)]
    print(f, lo, hi)
