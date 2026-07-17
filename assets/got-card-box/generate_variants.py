#!/usr/bin/env python3
"""Generate 8 Iron-Throne themed card-box STL variants. Outer: 110 x 70 x 40 mm."""
from __future__ import annotations

import math
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parent / "variants"
OUT.mkdir(parents=True, exist_ok=True)

L, W, H = 110.0, 70.0, 40.0
WALL, FLOOR = 2.0, 2.0
LID_H, CLEARANCE, LID_WALL = 14.0, 0.35, 2.0
OVERLAP = 8.0
EMBOSS = 1.1

Tris: list = []


def add_tri(a, b, c):
    Tris.append((a, b, c))


def quad(a, b, c, d):
    add_tri(a, b, c)
    add_tri(a, c, d)


def clear():
    global Tris
    Tris = []


def solid_box(ox, oy, oz, l, w, h):
    o = [
        (ox, oy, oz), (ox + l, oy, oz), (ox + l, oy + w, oz), (ox, oy + w, oz),
        (ox, oy, oz + h), (ox + l, oy, oz + h), (ox + l, oy + w, oz + h), (ox, oy + w, oz + h),
    ]
    quad(o[0], o[3], o[2], o[1])
    quad(o[4], o[5], o[6], o[7])
    quad(o[0], o[1], o[5], o[4])
    quad(o[1], o[2], o[6], o[5])
    quad(o[2], o[3], o[7], o[6])
    quad(o[3], o[0], o[4], o[7])


def box_shell(ox, oy, oz, l, w, h, t, bottom_t):
    o = [
        (ox, oy, oz), (ox + l, oy, oz), (ox + l, oy + w, oz), (ox, oy + w, oz),
        (ox, oy, oz + h), (ox + l, oy, oz + h), (ox + l, oy + w, oz + h), (ox, oy + w, oz + h),
    ]
    ix, iy = ox + t, oy + t
    il, iw = l - 2 * t, w - 2 * t
    iz = oz + bottom_t
    i = [
        (ix, iy, iz), (ix + il, iy, iz), (ix + il, iy + iw, iz), (ix, iy + iw, iz),
        (ix, iy, oz + h), (ix + il, iy, oz + h), (ix + il, iy + iw, oz + h), (ix, iy + iw, oz + h),
    ]
    quad(o[0], o[3], o[2], o[1])
    quad(o[0], o[1], o[5], o[4])
    quad(o[1], o[2], o[6], o[5])
    quad(o[2], o[3], o[7], o[6])
    quad(o[3], o[0], o[4], o[7])
    quad(o[4], o[5], i[5], i[4])
    quad(o[5], o[6], i[6], i[5])
    quad(o[6], o[7], i[7], i[6])
    quad(o[7], o[4], i[4], i[7])
    quad(i[4], i[5], i[1], i[0])
    quad(i[5], i[6], i[2], i[1])
    quad(i[6], i[7], i[3], i[2])
    quad(i[7], i[4], i[0], i[3])
    quad(i[0], i[1], i[2], i[3])


def lid_shell(ox, oy, l, w, h, t, top_t):
    o = [
        (ox, oy, 0), (ox + l, oy, 0), (ox + l, oy + w, 0), (ox, oy + w, 0),
        (ox, oy, h), (ox + l, oy, h), (ox + l, oy + w, h), (ox, oy + w, h),
    ]
    ix, iy = ox + t, oy + t
    il, iw = l - 2 * t, w - 2 * t
    iz = h - top_t
    i_bot = [(ix, iy, 0), (ix + il, iy, 0), (ix + il, iy + iw, 0), (ix, iy + iw, 0)]
    i_top = [(ix, iy, iz), (ix + il, iy, iz), (ix + il, iy + iw, iz), (ix, iy + iw, iz)]
    quad(o[4], o[5], o[6], o[7])
    quad(o[0], o[1], o[5], o[4])
    quad(o[1], o[2], o[6], o[5])
    quad(o[2], o[3], o[7], o[6])
    quad(o[3], o[0], o[4], o[7])
    quad(o[0], o[3], i_bot[3], i_bot[0])
    quad(o[0], i_bot[0], i_bot[1], o[1])
    quad(o[1], i_bot[1], i_bot[2], o[2])
    quad(o[2], i_bot[2], i_bot[3], o[3])
    quad(i_bot[0], i_bot[1], i_top[1], i_top[0])
    quad(i_bot[1], i_bot[2], i_top[2], i_top[1])
    quad(i_bot[2], i_bot[3], i_top[3], i_top[2])
    quad(i_bot[3], i_bot[0], i_top[0], i_top[3])
    quad(i_top[0], i_top[3], i_top[2], i_top[1])


def extrude_polygon(poly_xy, z0, z1):
    n = len(poly_xy)
    if n < 3:
        return
    bot = [(x, y, z0) for x, y in poly_xy]
    top = [(x, y, z1) for x, y in poly_xy]
    for i in range(1, n - 1):
        add_tri(bot[0], bot[i + 1], bot[i])
        add_tri(top[0], top[i], top[i + 1])
    for i in range(n):
        j = (i + 1) % n
        quad(bot[i], bot[j], top[j], top[i])


def transform_poly(poly, cx, cy, angle_deg, scale=1.0):
    a = math.radians(angle_deg)
    ca, sa = math.cos(a), math.sin(a)
    out = []
    for x, y in poly:
        x, y = x * scale, y * scale
        out.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return out


def sword_poly(length=28.0, blade_w=2.2, guard_w=7.0, pommel=2.0):
    tip_y = length * 0.52
    guard_y = -length * 0.12
    grip_y = -length * 0.32
    pom_y = -length * 0.48
    hw = blade_w * 0.5
    return [
        (0.0, tip_y), (hw, tip_y - 4.0), (hw, guard_y + 1.5),
        (guard_w * 0.5, guard_y + 1.5), (guard_w * 0.5, guard_y - 1.2),
        (hw * 0.9, guard_y - 1.2), (hw * 0.85, grip_y),
        (pommel * 0.7, pom_y + 1.5), (pommel, pom_y), (0.0, pom_y - 1.2),
        (-pommel, pom_y), (-pommel * 0.7, pom_y + 1.5),
        (-hw * 0.85, grip_y), (-hw * 0.9, guard_y - 1.2),
        (-guard_w * 0.5, guard_y - 1.2), (-guard_w * 0.5, guard_y + 1.5),
        (-hw, guard_y + 1.5), (-hw, tip_y - 4.0),
    ]


def jagged_blade(length=22.0, width=2.0, serrations=5):
    pts = [(0.0, length * 0.5)]
    y = length * 0.5 - 2.0
    step = (length * 0.85) / serrations
    for _ in range(serrations):
        pts.append((width * 0.55, y))
        pts.append((width * 0.35, y - step * 0.35))
        y -= step
    pts.append((width * 0.4, -length * 0.45))
    pts.append((-width * 0.4, -length * 0.45))
    y = -length * 0.45
    for _ in range(serrations):
        y += step
        pts.append((-width * 0.35, y - step * 0.35))
        pts.append((-width * 0.55, y))
    return pts


def ring_prism(cx, cy, r_out, r_in, z0, z1, segs=48):
    for i in range(segs):
        a0 = 2 * math.pi * i / segs
        a1 = 2 * math.pi * (i + 1) / segs
        o0 = (cx + r_out * math.cos(a0), cy + r_out * math.sin(a0))
        o1 = (cx + r_out * math.cos(a1), cy + r_out * math.sin(a1))
        i0 = (cx + r_in * math.cos(a0), cy + r_in * math.sin(a0))
        i1 = (cx + r_in * math.cos(a1), cy + r_in * math.sin(a1))
        add_tri((o0[0], o0[1], z1), (o1[0], o1[1], z1), (i1[0], i1[1], z1))
        add_tri((o0[0], o0[1], z1), (i1[0], i1[1], z1), (i0[0], i0[1], z1))
        add_tri((o0[0], o0[1], z0), (i0[0], i0[1], z0), (i1[0], i1[1], z0))
        add_tri((o0[0], o0[1], z0), (i1[0], i1[1], z0), (o1[0], o1[1], z0))
        quad((o0[0], o0[1], z0), (o1[0], o1[1], z0), (o1[0], o1[1], z1), (o0[0], o0[1], z1))
        quad((i1[0], i1[1], z0), (i0[0], i0[1], z0), (i0[0], i0[1], z1), (i1[0], i1[1], z1))


def circle_poly(cx, cy, r, segs=24):
    return [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in (i * 2 * math.pi / segs for i in range(segs))]


def write_binary_stl(path: Path, tris, name=b"box"):
    def normal(a, b, c):
        ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
        vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
        nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
        ln = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        return nx / ln, ny / ln, nz / ln

    with path.open("wb") as f:
        f.write(name[:80].ljust(80, b"\0"))
        f.write(struct.pack("<I", len(tris)))
        for a, b, c in tris:
            n = normal(a, b, c)
            f.write(struct.pack("<12fH", *n, *a, *b, *c, 0))
    print(f"  {path.name}: {len(tris)} tris")


# --- motifs ---------------------------------------------------------------

def throne_full(cx, cy, z0, zh, scale=1.0, blade_count=10, short=False):
    z_mid = z0 + (zh - z0) * 0.72
    z_low = z0 + (zh - z0) * 0.45
    s = scale
    seat = [(cx - 14 * s, cy - 8 * s), (cx + 14 * s, cy - 8 * s),
            (cx + 12 * s, cy + 4 * s), (cx - 12 * s, cy + 4 * s)]
    extrude_polygon(seat, z0, z_mid)
    cushion = [(cx - 11 * s, cy - 5 * s), (cx + 11 * s, cy - 5 * s),
               (cx + 9.5 * s, cy + 1.5 * s), (cx - 9.5 * s, cy + 1.5 * s)]
    extrude_polygon(cushion, z0, zh)
    for side, base_ang in ((-1, 18), (1, -18)):
        for i, (ang_off, sc, dy) in enumerate([(0, 0.72, -2), (12 * side, 0.85, 1),
                                               (22 * side, 0.95, 4), (32 * side, 0.78, 7)]):
            poly = transform_poly(sword_poly(26, 1.8, 5.5, 1.6),
                                  cx + side * (16 + i * 1.2) * s, cy + dy * s,
                                  base_ang + ang_off, sc * s)
            extrude_polygon(poly, z0, zh if i % 2 == 0 else z_mid)
    blade_len = 22 if short else 30
    angles = [(-50 + i * 100 / (blade_count - 1)) for i in range(blade_count)]
    blade = jagged_blade(blade_len, 2.1, 5 if short else 6)
    for ang in angles:
        sc = (0.75 if short else 0.85) + 0.08 * (1.0 - abs(ang) / 55.0)
        poly = transform_poly(blade, cx + ang * 0.12 * s, cy + (5 if short else 6.5) * s, ang, sc * s)
        extrude_polygon(poly, z0, zh if abs(ang) < 25 else z_mid)
    for ang, dx, dy in ((-35, -6, -14), (35, 6, -14), (12, 0, -16)):
        poly = transform_poly(sword_poly(22, 1.6, 5.0, 1.4), cx + dx * s, cy + dy * s, ang, 0.7 * s)
        extrude_polygon(poly, z0, z_low)


def throne_outline(cx, cy, z0, zh, scale=1.0, stroke=1.2):
    """Minimal line-art throne as thickened outline strips."""
    s = scale
    # seat outline (frame)
    outer = [(cx - 16 * s, cy - 10 * s), (cx + 16 * s, cy - 10 * s),
             (cx + 14 * s, cy + 6 * s), (cx - 14 * s, cy + 6 * s)]
    inner = [(cx - 16 * s + stroke, cy - 10 * s + stroke),
             (cx + 16 * s - stroke, cy - 10 * s + stroke),
             (cx + 14 * s - stroke, cy + 6 * s - stroke),
             (cx - 14 * s + stroke, cy + 6 * s - stroke)]
    # approximate outline with bars
    bars = [
        [outer[0], outer[1], (outer[1][0], outer[1][1] + stroke), (outer[0][0], outer[0][1] + stroke)],
        [(outer[3][0], outer[3][1] - stroke), (outer[2][0], outer[2][1] - stroke), outer[2], outer[3]],
        [outer[0], (outer[0][0] + stroke, outer[0][1]), (outer[3][0] + stroke, outer[3][1]), outer[3]],
        [(outer[1][0] - stroke, outer[1][1]), outer[1], outer[2], (outer[2][0] - stroke, outer[2][1])],
    ]
    for b in bars:
        extrude_polygon(b, z0, zh)
    # backrest arcs as thin blades outline
    for ang in (-40, -20, 0, 20, 40):
        poly = transform_poly(
            [(-stroke * 0.5, -2), (stroke * 0.5, -2), (stroke * 0.35, 22 * s), (-stroke * 0.35, 22 * s)],
            cx + ang * 0.15 * s, cy + 4 * s, ang, 1.0,
        )
        extrude_polygon(poly, z0, zh)
    # arm hints
    for side in (-1, 1):
        poly = transform_poly(
            [(-stroke * 0.5, -8 * s), (stroke * 0.5, -8 * s), (stroke * 0.5, 8 * s), (-stroke * 0.5, 8 * s)],
            cx + side * 18 * s, cy - 2 * s, side * 25, 1.0,
        )
        extrude_polygon(poly, z0, zh)
    _ = inner  # reserved


def forge_plates(cx, cy, z0, zh, half_l=50, half_w=30):
    # plate grid
    cols, rows = 4, 3
    mw, mh = half_l * 2 / cols, half_w * 2 / rows
    gap = 0.8
    for r in range(rows):
        for c in range(cols):
            x0 = cx - half_l + c * mw + gap
            y0 = cy - half_w + r * mh + gap
            x1 = x0 + mw - 2 * gap
            y1 = y0 + mh - 2 * gap
            extrude_polygon([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], z0, z0 + (zh - z0) * 0.55)
    # rivets
    for dx in (-half_l + 4, -half_l / 3, half_l / 3, half_l - 4):
        for dy in (-half_w + 4, 0, half_w - 4):
            extrude_polygon(circle_poly(cx + dx, cy + dy, 1.6, 10), z0, zh)


def crossed_swords(cx, cy, z0, zh):
    for ang in (-40, 40):
        poly = transform_poly(sword_poly(48, 3.0, 10, 2.4), cx, cy, ang, 1.0)
        extrude_polygon(poly, z0, zh)
    # central seal
    ring_prism(cx, cy, 10, 7.5, z0, zh, segs=36)
    # simple crown
    crown = [
        (cx - 6, cy - 1), (cx - 4, cy - 1), (cx - 4, cy + 2), (cx - 2, cy + 0.5),
        (cx - 1, cy + 3.5), (cx, cy + 1), (cx + 1, cy + 3.5), (cx + 2, cy + 0.5),
        (cx + 4, cy + 2), (cx + 4, cy - 1), (cx + 6, cy - 1), (cx + 6, cy - 3),
        (cx - 6, cy - 3),
    ]
    extrude_polygon(crown, z0, zh)


def ice_fire(cx, cy, z0, zh):
    # left ice crystals
    for i, (dx, dy, sc, ang) in enumerate([
        (-28, -10, 1.0, -15), (-35, 5, 0.8, 10), (-22, 12, 0.9, -5),
        (-30, -18, 0.7, 25), (-18, -5, 0.75, -30), (-40, -5, 0.65, 5),
    ]):
        crystal = transform_poly(
            [(0, 10), (3, 2), (1.5, -8), (-1.5, -8), (-3, 2)],
            cx + dx, cy + dy, ang, sc,
        )
        extrude_polygon(crystal, z0, zh if i % 2 == 0 else z0 + (zh - z0) * 0.7)
    # right flames
    for i, (dx, dy, sc, ang) in enumerate([
        (28, -8, 1.0, 10), (35, 6, 0.85, -12), (22, 14, 0.9, 8),
        (32, -16, 0.7, -20), (20, -4, 0.8, 18), (40, 0, 0.7, -5),
    ]):
        flame = transform_poly(
            [(0, 11), (2.5, 4), (3.5, -2), (1.5, -9), (-1.2, -7), (-3, 0), (-2, 5)],
            cx + dx, cy + dy, ang, sc,
        )
        extrude_polygon(flame, z0, zh if i % 2 == 0 else z0 + (zh - z0) * 0.65)
    # center ring + tiny throne
    ring_prism(cx, cy, 12, 9.5, z0, zh, segs=40)
    throne_full(cx, cy, z0, z0 + (zh - z0) * 0.85, scale=0.35, blade_count=7, short=True)


def wolf_throne(cx, cy, z0, zh):
    throne_full(cx, cy - 2, z0, zh, scale=0.9, blade_count=7, short=True)
    # geometric wolf head hint above seat (angular, original)
    wolf = [
        (cx, cy + 22),           # snout tip up-ish / forehead peak
        (cx + 6, cy + 16),
        (cx + 10, cy + 20),      # right ear
        (cx + 7, cy + 12),
        (cx + 9, cy + 6),
        (cx + 4, cy + 8),
        (cx, cy + 4),            # brow
        (cx - 4, cy + 8),
        (cx - 9, cy + 6),
        (cx - 7, cy + 12),
        (cx - 10, cy + 20),      # left ear
        (cx - 6, cy + 16),
    ]
    extrude_polygon(wolf, z0, zh)
    # eyes
    extrude_polygon(circle_poly(cx - 3.5, cy + 11, 1.2, 8), z0, zh)
    extrude_polygon(circle_poly(cx + 3.5, cy + 11, 1.2, 8), z0, zh)


def dragon_bone(cx, cy, z0, zh, ox, oy, lid_l, lid_w):
    # curved rib arches on lid
    for i, dx in enumerate([-36, -18, 0, 18, 36]):
        for side in (-1, 1):
            rib = []
            for t in range(9):
                u = t / 8.0
                x = cx + dx + side * (4 + 6 * math.sin(u * math.pi))
                y = cy - 22 + u * 44
                rib.append((x, y))
            # thicken as strip
            strip = []
            for (x, y) in rib:
                strip.append((x + side * 1.2, y))
            for (x, y) in reversed(rib):
                strip.append((x - side * 1.2, y))
            extrude_polygon(strip, z0, zh if i % 2 == 0 else z0 + (zh - z0) * 0.7)
    # nest of curved blades center
    for ang in range(0, 360, 30):
        poly = transform_poly(
            [(0, 4), (2, 8), (1.2, 18), (-1.2, 18), (-2, 8)],
            cx, cy, ang, 1.0,
        )
        extrude_polygon(poly, z0, zh)
    # scale row near edges
    for x in range(int(ox + 8), int(ox + lid_l - 8), 8):
        for y, zmul in ((oy + 6, 0.6), (oy + lid_w - 6, 0.6)):
            sc = [(x, y - 2.5), (x + 3.5, y), (x, y + 2.5), (x - 3.5, y)]
            extrude_polygon(sc, z0, z0 + (zh - z0) * zmul)


def end_panel_throne(ox, oy, oz, l, w, h):
    """Throne relief on short end (+X face), extruded in +X."""
    # Work in YZ plane at x = ox+l, emboss +X
    depth = EMBOSS
    x0 = ox + l
    # map throne from local u(y), v(z) centered on end face
    cy, cz = oy + w / 2, oz + h * 0.42

    def extrude_yz(poly_yz, d):
        # poly in (y,z), extrude along +x from x0 to x0+d
        n = len(poly_yz)
        if n < 3:
            return
        a = [(x0, y, z) for y, z in poly_yz]
        b = [(x0 + d, y, z) for y, z in poly_yz]
        for i in range(1, n - 1):
            add_tri(a[0], a[i], a[i + 1])  # flush face (into box) — winding
            add_tri(b[0], b[i + 1], b[i])
        for i in range(n):
            j = (i + 1) % n
            quad(a[i], a[j], b[j], b[i])

    # seat
    seat = [(cy - 12, cz - 4), (cy + 12, cz - 4), (cy + 10, cz + 3), (cy - 10, cz + 3)]
    extrude_yz(seat, depth * 0.7)
    # blades fan in YZ (angle in plane)
    for ang in (-45, -30, -15, 0, 15, 30, 45):
        blade = jagged_blade(18, 1.8, 4)
        a = math.radians(ang)
        ca, sa = math.cos(a), math.sin(a)
        poly = []
        for x, y in blade:  # local; y up -> z, x -> y
            # tip up in +z
            ly, lz = x, y
            yy = cy + ly * ca - lz * sa * 0.15
            zz = cz + 4 + ly * sa + lz * ca
            poly.append((yy, zz))
        extrude_yz(poly, depth if abs(ang) < 20 else depth * 0.75)
    # crossed under
    for ang in (-30, 30):
        sw = transform_poly(sword_poly(16, 1.4, 4, 1.2), 0, 0, ang, 0.8)
        poly = [(cy + x, cz - 8 + y) for x, y in sw]
        extrude_yz(poly, depth * 0.55)


def rivets_on_lid(cx, cy, z0, zh):
    for dx in (-48, -24, 0, 24, 48):
        for dy in (-28, 0, 28):
            if abs(dx) < 15 and abs(dy) < 12:
                continue
            extrude_polygon(circle_poly(cx + dx, cy + dy, 1.5, 8), z0, z0 + (zh - z0) * 0.7)


def side_blades(ox, oy, oz, l, w, h):
    depth = 0.65
    for y0, ny in ((oy, -1.0), (oy + w, 1.0)):
        for i in range(9):
            x = ox + 12 + i * (l - 24) / 8
            tip = (x, y0 + ny * depth, oz + h * 0.55)
            a = (x - 1.2, y0, oz + 4)
            b = (x + 1.2, y0, oz + 4)
            c = (x + 1.2, y0, oz + h - 3)
            d = (x - 1.2, y0, oz + h - 3)
            add_tri(a, b, tip)
            add_tri(b, c, tip)
            add_tri(c, d, tip)
            add_tri(d, a, tip)


def side_scales(ox, oy, oz, l, w, h):
    """Dragon-bone scale rows on long sides."""
    for y0, ny in ((oy, -1.0), (oy + w, 1.0)):
        for row, zc in enumerate((oz + h * 0.35, oz + h * 0.65)):
            for i in range(10):
                x = ox + 10 + i * (l - 20) / 9 + (4 if row else 0)
                d = 0.7
                # diamond sticking out
                tip = (x, y0 + ny * d, zc)
                p = [
                    (x - 3, y0, zc),
                    (x, y0, zc + 3),
                    (x + 3, y0, zc),
                    (x, y0, zc - 3),
                ]
                for j in range(4):
                    add_tri(p[j], p[(j + 1) % 4], tip)


# --- assembly helpers -----------------------------------------------------

def make_base(path: Path, side_fn=None, end_fn=None):
    clear()
    base_h = H - LID_H + OVERLAP
    box_shell(0, 0, 0, L, W, base_h, WALL, FLOOR)
    pad = 4.0
    for px, py in [(WALL, WALL), (L - WALL - pad, WALL),
                   (WALL, W - WALL - pad), (L - WALL - pad, W - WALL - pad)]:
        solid_box(px, py, FLOOR, pad, pad, 1.2)
    if side_fn:
        side_fn(0, 0, 0, L, W, base_h)
    if end_fn:
        end_fn(0, 0, 0, L, W, base_h)
    write_binary_stl(path, Tris, b"base")


def make_lid(path: Path, decorate_fn, side_fn=None, end_fn=None):
    clear()
    lid_L = L + 2 * (CLEARANCE + 0.15)
    lid_W = W + 2 * (CLEARANCE + 0.15)
    ox = -(CLEARANCE + 0.15)
    oy = -(CLEARANCE + 0.15)
    lid_shell(ox, oy, lid_L, lid_W, LID_H, LID_WALL, FLOOR)
    cx, cy = ox + lid_L / 2, oy + lid_W / 2
    decorate_fn(cx, cy, LID_H, LID_H + EMBOSS, ox, oy, lid_L, lid_W)
    if side_fn:
        side_fn(ox, oy, 0, lid_L, lid_W, LID_H)
    if end_fn:
        # throne on lid short end too (upper part when box stands)
        end_fn(ox, oy, 0, lid_L, lid_W, LID_H)
    write_binary_stl(path, Tris, b"lid")


def make_preview(path: Path, decorate_fn, side_fn=None, end_fn=None):
    clear()
    solid_box(0, 0, 0, L, W, H)
    decorate_fn(L / 2, W / 2, H, H + EMBOSS, 0, 0, L, W)
    if side_fn:
        side_fn(0, 0, 0, L, W, H)
    if end_fn:
        end_fn(0, 0, 0, L, W, H)
    write_binary_stl(path, Tris, b"preview")


def emit_variant(slug: str, decorate_fn, side_fn=None, end_fn=None, extra_parts=None):
    folder = OUT / slug
    folder.mkdir(parents=True, exist_ok=True)
    print(slug)
    make_base(folder / f"{slug}_base.stl", side_fn=side_fn, end_fn=end_fn)
    make_lid(folder / f"{slug}_lid.stl", decorate_fn, side_fn=side_fn, end_fn=end_fn)
    make_preview(folder / f"{slug}_preview.stl", decorate_fn, side_fn=side_fn, end_fn=end_fn)
    if extra_parts:
        for name, fn in extra_parts:
            clear()
            fn()
            write_binary_stl(folder / f"{slug}_{name}.stl", Tris, name.encode())


def main():
    # 01 — throne on end, plated lid
    def d01(cx, cy, z0, zh, ox, oy, ll, lw):
        forge_plates(cx, cy, z0, z0 + (zh - z0) * 0.5, half_l=48, half_w=28)
        rivets_on_lid(cx, cy, z0, zh)

    emit_variant(
        "01_end_throne",
        d01,
        side_fn=None,
        end_fn=end_panel_throne,
    )

    # 02 — crossed swords
    def d02(cx, cy, z0, zh, *a):
        crossed_swords(cx, cy, z0, zh)

    emit_variant("02_crossed_swords", d02, side_fn=side_blades)

    # 03 — forge + small medallion
    def d03(cx, cy, z0, zh, *a):
        forge_plates(cx, cy, z0, zh, half_l=50, half_w=30)
        ring_prism(cx, cy, 16, 13.5, z0, zh, segs=40)
        throne_full(cx, cy, z0, zh, scale=0.42, blade_count=7, short=True)

    emit_variant("03_forge", d03)

    # 04 — ice & fire
    def d04(cx, cy, z0, zh, *a):
        ice_fire(cx, cy, z0, zh)

    emit_variant("04_ice_fire", d04)

    # 05 — wolf throne
    def d05(cx, cy, z0, zh, *a):
        wolf_throne(cx, cy, z0, zh)

    emit_variant("05_wolf_throne", d05, side_fn=side_blades)

    # 06 — dragon bone
    def d06(cx, cy, z0, zh, ox, oy, ll, lw):
        dragon_bone(cx, cy, z0, zh, ox, oy, ll, lw)

    emit_variant("06_dragon_bone", d06, side_fn=side_scales)

    # 07 — minimal line art
    def d07(cx, cy, z0, zh, *a):
        throne_outline(cx, cy, z0, z0 + 0.75, scale=1.15, stroke=1.1)

    emit_variant("07_minimal", d07)

    # 08 — two-layer: plate lid + separate throne applique
    def d08(cx, cy, z0, zh, *a):
        forge_plates(cx, cy, z0, z0 + (zh - z0) * 0.55, half_l=50, half_w=30)
        rivets_on_lid(cx, cy, z0, zh)
        # shallow recess marker ring for placing applique
        ring_prism(cx, cy, 22, 20, z0, z0 + (zh - z0) * 0.35, segs=40)

    def applique():
        # standalone throne medallion, sitting on z=0
        throne_full(0, 0, 0, EMBOSS + 0.4, scale=0.55, blade_count=8, short=False)
        ring_prism(0, 0, 20, 17.5, 0, 0.5, segs=40)
        # thin base disc
        extrude_polygon(circle_poly(0, 0, 21, 40), 0, 0.4)

    emit_variant("08_two_layer", d08, extra_parts=[("applique", applique)])

    # index readme
    (OUT / "README.md").write_text(
        """# Варианты коробки 110×70×40 мм — мотив Железного трона

В каждой папке: `*_base.stl`, `*_lid.stl`, `*_preview.stl` (+ превью PNG).

| # | Папка | Идея |
|---|-------|------|
| 01 | `01_end_throne` | Трон на торце, крышка — кованые пластины |
| 02 | `02_crossed_swords` | Скрещённые мечи + корона |
| 03 | `03_forge` | Кузня, мелкий медальон-трон |
| 04 | `04_ice_fire` | Лёд / пламя + кольцо в центре |
| 05 | `05_wolf_throne` | Северный трон + геом. волк |
| 06 | `06_dragon_bone` | Рёбра / чешуя / гнездо |
| 07 | `07_minimal` | Контур трона line-art |
| 08 | `08_two_layer` | Крышка-пластины + отдельный `*_applique.stl` |

Единицы STL — миллиметры. Пересборка: `python3 ../generate_variants.py`
""",
        encoding="utf-8",
    )
    print("Done →", OUT)


if __name__ == "__main__":
    main()
