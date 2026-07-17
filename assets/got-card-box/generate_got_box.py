#!/usr/bin/env python3
"""Iron-Throne themed card box STL: base + lid. Outer mm: 110 x 70 x 40."""
from __future__ import annotations

import math
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parent

# Outer dimensions (mm)
L, W, H = 110.0, 70.0, 40.0
WALL = 2.0
FLOOR = 2.0
LID_H = 14.0
CLEARANCE = 0.35
LID_WALL = 2.0
EMBOSS = 1.1
OVERLAP = 8.0

Tris: list[tuple[tuple[float, float, float], tuple[float, float, float], tuple[float, float, float]]] = []


def add_tri(a, b, c):
    Tris.append((a, b, c))


def quad(a, b, c, d):
    add_tri(a, b, c)
    add_tri(a, c, d)


def solid_box(ox, oy, oz, l, w, h):
    o = [
        (ox, oy, oz),
        (ox + l, oy, oz),
        (ox + l, oy + w, oz),
        (ox, oy + w, oz),
        (ox, oy, oz + h),
        (ox + l, oy, oz + h),
        (ox + l, oy + w, oz + h),
        (ox, oy + w, oz + h),
    ]
    quad(o[0], o[3], o[2], o[1])
    quad(o[4], o[5], o[6], o[7])
    quad(o[0], o[1], o[5], o[4])
    quad(o[1], o[2], o[6], o[5])
    quad(o[2], o[3], o[7], o[6])
    quad(o[3], o[0], o[4], o[7])


def box_shell(ox, oy, oz, l, w, h, t, bottom_t):
    o = [
        (ox, oy, oz),
        (ox + l, oy, oz),
        (ox + l, oy + w, oz),
        (ox, oy + w, oz),
        (ox, oy, oz + h),
        (ox + l, oy, oz + h),
        (ox + l, oy + w, oz + h),
        (ox, oy + w, oz + h),
    ]
    ix, iy = ox + t, oy + t
    il, iw = l - 2 * t, w - 2 * t
    iz = oz + bottom_t
    i = [
        (ix, iy, iz),
        (ix + il, iy, iz),
        (ix + il, iy + iw, iz),
        (ix, iy + iw, iz),
        (ix, iy, oz + h),
        (ix + il, iy, oz + h),
        (ix + il, iy + iw, oz + h),
        (ix, iy + iw, oz + h),
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
        (ox, oy, 0),
        (ox + l, oy, 0),
        (ox + l, oy + w, 0),
        (ox, oy + w, 0),
        (ox, oy, h),
        (ox + l, oy, h),
        (ox + l, oy + w, h),
        (ox, oy + w, h),
    ]
    ix, iy = ox + t, oy + t
    il, iw = l - 2 * t, w - 2 * t
    iz_inner_top = h - top_t
    i_bot = [
        (ix, iy, 0),
        (ix + il, iy, 0),
        (ix + il, iy + iw, 0),
        (ix, iy + iw, 0),
    ]
    i_top = [
        (ix, iy, iz_inner_top),
        (ix + il, iy, iz_inner_top),
        (ix + il, iy + iw, iz_inner_top),
        (ix, iy + iw, iz_inner_top),
    ]
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
    """Sword along +Y (tip up): tip at +length/2-ish, pommel at bottom."""
    tip_y = length * 0.52
    guard_y = -length * 0.12
    grip_y = -length * 0.32
    pom_y = -length * 0.48
    hw = blade_w * 0.5
    return [
        (0.0, tip_y),  # tip
        (hw, tip_y - 4.0),
        (hw, guard_y + 1.5),
        (guard_w * 0.5, guard_y + 1.5),
        (guard_w * 0.5, guard_y - 1.2),
        (hw * 0.9, guard_y - 1.2),
        (hw * 0.85, grip_y),
        (pommel * 0.7, pom_y + 1.5),
        (pommel, pom_y),
        (0.0, pom_y - 1.2),
        (-pommel, pom_y),
        (-pommel * 0.7, pom_y + 1.5),
        (-hw * 0.85, grip_y),
        (-hw * 0.9, guard_y - 1.2),
        (-guard_w * 0.5, guard_y - 1.2),
        (-guard_w * 0.5, guard_y + 1.5),
        (-hw, guard_y + 1.5),
        (-hw, tip_y - 4.0),
    ]


def jagged_blade(length=22.0, width=2.0, serrations=5):
    """Long irregular blade tip-up for throne back."""
    pts = [(0.0, length * 0.5)]  # tip
    # right edge down with notches
    y = length * 0.5 - 2.0
    step = (length * 0.85) / serrations
    for i in range(serrations):
        pts.append((width * 0.55, y))
        pts.append((width * 0.35, y - step * 0.35))
        y -= step
    pts.append((width * 0.4, -length * 0.45))
    pts.append((-width * 0.4, -length * 0.45))
    y = -length * 0.45
    for i in range(serrations):
        y += step
        pts.append((-width * 0.35, y - step * 0.35))
        pts.append((-width * 0.55, y))
    return pts


def write_binary_stl(path: Path, tris, name=b"got_box"):
    def normal(a, b, c):
        ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
        vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
        nx = uy * vz - uz * vy
        ny = uz * vx - ux * vz
        nz = ux * vy - uy * vx
        length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        return nx / length, ny / length, nz / length

    with path.open("wb") as f:
        f.write(name[:80].ljust(80, b"\0"))
        f.write(struct.pack("<I", len(tris)))
        for a, b, c in tris:
            n = normal(a, b, c)
            f.write(struct.pack("<12fH", *n, *a, *b, *c, 0))
    print(f"Wrote {path.name}: {len(tris)} triangles")


def decorate_iron_throne(cx, cy, z0, z_high, z_mid=None, z_low=None):
    """Lid top relief: Iron Throne silhouette from fused blades."""
    z_mid = z0 + (z_high - z0) * 0.72 if z_mid is None else z_mid
    z_low = z0 + (z_high - z0) * 0.45 if z_low is None else z_low

    # Seat platform
    seat = [
        (cx - 14, cy - 8),
        (cx + 14, cy - 8),
        (cx + 12, cy + 4),
        (cx - 12, cy + 4),
    ]
    extrude_polygon(seat, z0, z_mid)

    # Seat cushion ridge
    cushion = [
        (cx - 11, cy - 5),
        (cx + 11, cy - 5),
        (cx + 9.5, cy + 1.5),
        (cx - 9.5, cy + 1.5),
    ]
    extrude_polygon(cushion, z0, z_high)

    # Armrest blade bundles (left / right)
    for side, base_ang in ((-1, 18), (1, -18)):
        for i, (ang_off, sc, dy) in enumerate(
            [
                (0, 0.72, -2),
                (12 * side, 0.85, 1),
                (22 * side, 0.95, 4),
                (32 * side, 0.78, 7),
            ]
        ):
            poly = transform_poly(
                sword_poly(26, 1.8, 5.5, 1.6),
                cx + side * (16 + i * 1.2),
                cy + dy,
                base_ang + ang_off,
                sc,
            )
            zh = z_high if i % 2 == 0 else z_mid
            extrude_polygon(poly, z0, zh)

    # Backrest: fan of jagged blades rising behind the seat
    blade = jagged_blade(30, 2.1, 6)
    angles = [-55, -40, -28, -16, -6, 6, 16, 28, 40, 55]
    for i, ang in enumerate(angles):
        sc = 0.85 + 0.08 * (1.0 - abs(ang) / 55.0)
        # pivot near seat back, tip upward
        poly = transform_poly(blade, cx + ang * 0.12, cy + 6.5, ang, sc)
        zh = z_high if abs(ang) < 25 else z_mid
        if abs(ang) > 40:
            zh = z_low + (z_mid - z_low) * 0.6
        extrude_polygon(poly, z0, zh)

    # Crossed swords under the seat (forge pile)
    for ang, dx, dy in ((-35, -6, -14), (35, 6, -14), (12, 0, -16), (-12, 2, -12)):
        poly = transform_poly(sword_poly(22, 1.6, 5.0, 1.4), cx + dx, cy + dy, ang, 0.7)
        extrude_polygon(poly, z0, z_low)

    # Crown of tips — small spikes above the highest blades
    for i, dx in enumerate([-10, -5, 0, 5, 10]):
        spike = [
            (cx + dx, cy + 28),
            (cx + dx + 1.1, cy + 20),
            (cx + dx - 1.1, cy + 20),
        ]
        extrude_polygon(spike, z0, z_high if i == 2 else z_mid)

    # Corner rivet bosses (forged plate feel)
    for dx, dy in [(-46, -26), (46, -26), (-46, 26), (46, 26)]:
        rivet = [
            (cx + dx + 2.2 * math.cos(a), cy + dy + 2.2 * math.sin(a))
            for a in (i * math.pi / 4 for i in range(8))
        ]
        extrude_polygon(rivet, z0, z_mid)

    # Thin border frame — hammered plate edge
    m = 3.0
    # approximate as four bars
    for bar in (
        [(cx - 52, cy - 32), (cx + 52, cy - 32), (cx + 52, cy - 32 + m), (cx - 52, cy - 32 + m)],
        [(cx - 52, cy + 32 - m), (cx + 52, cy + 32 - m), (cx + 52, cy + 32), (cx - 52, cy + 32)],
        [(cx - 52, cy - 32), (cx - 52 + m, cy - 32), (cx - 52 + m, cy + 32), (cx - 52, cy + 32)],
        [(cx + 52 - m, cy - 32), (cx + 52, cy - 32), (cx + 52, cy + 32), (cx + 52 - m, cy + 32)],
    ):
        # clamp roughly to lid; using relative offsets from center with ~104x64 inner
        extrude_polygon(bar, z0, z_low)


def decorate_side_blades(ox, oy, oz, l, w, h, outward=1.0):
    """Vertical blade ridges on long sides (base or lid exterior)."""
    depth = 0.7 * outward
    # Front (-Y) and back (+Y)
    for y0, ny in ((oy, -1.0), (oy + w, 1.0)):
        for i in range(9):
            x = ox + 12 + i * (l - 24) / 8
            # triangular prism sticking out
            tip = (x, y0 + ny * depth, oz + h * 0.55)
            a = (x - 1.3, y0, oz + 4)
            b = (x + 1.3, y0, oz + 4)
            c = (x + 1.3, y0, oz + h - 3)
            d = (x - 1.3, y0, oz + h - 3)
            # faces
            add_tri(a, b, tip)
            add_tri(b, c, tip)
            add_tri(c, d, tip)
            add_tri(d, a, tip)
            # skip sealing base into wall — floating ok for visual; seal for manifold:
            if ny < 0:
                quad(a, d, c, b)
            else:
                quad(b, c, d, a)


def main():
    global Tris
    base_h = H - LID_H + OVERLAP

    # --- BASE ---
    Tris = []
    box_shell(0, 0, 0, L, W, base_h, WALL, FLOOR)
    pad = 4.0
    for px, py in [
        (WALL, WALL),
        (L - WALL - pad, WALL),
        (WALL, W - WALL - pad),
        (L - WALL - pad, W - WALL - pad),
    ]:
        solid_box(px, py, FLOOR, pad, pad, 1.2)
    decorate_side_blades(0, 0, 0, L, W, base_h)
    write_binary_stl(OUT / "got_card_box_base_110x70x40.stl", Tris, b"Iron Throne Box Base")

    # --- LID ---
    Tris = []
    lid_L = L + 2 * (CLEARANCE + 0.15)
    lid_W = W + 2 * (CLEARANCE + 0.15)
    ox = -(CLEARANCE + 0.15)
    oy = -(CLEARANCE + 0.15)
    lid_shell(ox, oy, lid_L, lid_W, LID_H, LID_WALL, FLOOR)
    decorate_iron_throne(
        ox + lid_L / 2,
        oy + lid_W / 2,
        LID_H,
        LID_H + EMBOSS,
    )
    decorate_side_blades(ox, oy, 0, lid_L, lid_W, LID_H)
    write_binary_stl(OUT / "got_card_box_lid_110x70x40.stl", Tris, b"Iron Throne Box Lid")

    # --- CLOSED PREVIEW ---
    Tris = []
    solid_box(0, 0, 0, L, W, H)
    decorate_iron_throne(L / 2, W / 2, H, H + EMBOSS)
    decorate_side_blades(0, 0, 0, L, W, H)
    write_binary_stl(
        OUT / "got_card_box_closed_preview_110x70x40.stl",
        Tris,
        b"Iron Throne Box Preview",
    )


if __name__ == "__main__":
    main()
