"""Author original, game-ready Delhi landmark GLBs.

Hunyuan3D-2.1 / TRELLIS.2 need 10–21 GB VRAM (this machine is an RTX 3050 6 GB).
grok-imagine-3d is blocked for zero-data-retention teams. Sketchfab CC-BY models
exist but their download API requires a login. These meshes are original, scaled
in metres, Y-up, sitting on y=0, facade toward +Z unless noted.
"""
from __future__ import annotations

import json
import math
import struct
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models"
ISO = ROOT / "public" / "images" / "iso"
SEG = 24


def pad4(n: int) -> int:
    return (4 - (n % 4)) % 4


class Mesh:
    def __init__(self) -> None:
        self.v: list[tuple[float, float, float]] = []
        self.n: list[tuple[float, float, float]] = []
        self.uv: list[tuple[float, float]] = []
        self.i: list[int] = []

    def add(self, p: tuple[float, float, float], n: tuple[float, float, float], uv: tuple[float, float]) -> int:
        idx = len(self.v)
        self.v.append(p)
        self.n.append(n)
        self.uv.append(uv)
        return idx

    def tri(self, a: int, b: int, c: int) -> None:
        self.i.extend((a, b, c))

    def quad(
        self,
        a: tuple[float, float, float],
        b: tuple[float, float, float],
        c: tuple[float, float, float],
        d: tuple[float, float, float],
        n: tuple[float, float, float],
        uv0: tuple[float, float] = (0.0, 0.0),
        uv1: tuple[float, float] = (1.0, 0.0),
        uv2: tuple[float, float] = (1.0, 1.0),
        uv3: tuple[float, float] = (0.0, 1.0),
    ) -> None:
        ia, ib, ic, id_ = self.add(a, n, uv0), self.add(b, n, uv1), self.add(c, n, uv2), self.add(d, n, uv3)
        self.tri(ia, ib, ic)
        self.tri(ia, ic, id_)

    def box(self, w: float, h: float, d: float, cx: float = 0, cy: float = 0, cz: float = 0, u: float = 0.0) -> None:
        hx, hy, hz = w * 0.5, h * 0.5, d * 0.5
        x0, x1 = cx - hx, cx + hx
        y0, y1 = cy - hy, cy + hy
        z0, z1 = cz - hz, cz + hz
        su = 0.02 + (u % 0.45)
        sv = 0.02
        tw, th = min(0.46, 0.08 + w * 0.04), min(0.46, 0.08 + h * 0.04)
        faces = (
            ((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1), (0, 0, 1)),
            ((x1, y0, z0), (x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (0, 0, -1)),
            ((x1, y0, z1), (x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (1, 0, 0)),
            ((x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (-1, 0, 0)),
            ((x0, y1, z1), (x1, y1, z1), (x1, y1, z0), (x0, y1, z0), (0, 1, 0)),
            ((x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1), (0, -1, 0)),
        )
        for a, b, c, d, n in faces:
            self.quad(
                a, b, c, d, n,
                (su, sv), (su + tw, sv), (su + tw, sv + th), (su, sv + th),
            )

    def cyl(
        self,
        r0: float,
        r1: float,
        h: float,
        cx: float = 0,
        cy: float = 0,
        cz: float = 0,
        seg: int = SEG,
        cap: bool = True,
        u: float = 0.5,
    ) -> None:
        y0, y1 = cy, cy + h
        ring0, ring1 = [], []
        for s in range(seg):
            a = s / seg * math.tau
            c, si = math.cos(a), math.sin(a)
            n = (c, 0.0, si)
            uvx = u + (s / seg) * 0.45
            ring0.append(self.add((cx + r0 * c, y0, cz + r0 * si), n, (uvx, 0.08)))
            ring1.append(self.add((cx + r1 * c, y1, cz + r1 * si), n, (uvx, 0.42)))
        for s in range(seg):
            a, b = ring0[s], ring0[(s + 1) % seg]
            c, d = ring1[(s + 1) % seg], ring1[s]
            self.tri(a, b, c)
            self.tri(a, c, d)
        if cap:
            t = self.add((cx, y1, cz), (0, 1, 0), (u + 0.2, 0.45))
            b = self.add((cx, y0, cz), (0, -1, 0), (u + 0.2, 0.05))
            for s in range(seg):
                a0 = s / seg * math.tau
                a1 = (s + 1) / seg * math.tau
                p0 = self.add((cx + r1 * math.cos(a0), y1, cz + r1 * math.sin(a0)), (0, 1, 0), (u, 0.48))
                p1 = self.add((cx + r1 * math.cos(a1), y1, cz + r1 * math.sin(a1)), (0, 1, 0), (u, 0.48))
                self.tri(t, p0, p1)
                q0 = self.add((cx + r0 * math.cos(a0), y0, cz + r0 * math.sin(a0)), (0, -1, 0), (u, 0.02))
                q1 = self.add((cx + r0 * math.cos(a1), y0, cz + r0 * math.sin(a1)), (0, -1, 0), (u, 0.02))
                self.tri(b, q1, q0)

    def lathe(self, profile: list[tuple[float, float]], cx: float = 0, cz: float = 0, seg: int = 28, u: float = 0.5) -> None:
        rings: list[list[int]] = []
        nprof = len(profile)
        for pi, (r, y) in enumerate(profile):
            ring = []
            v = pi / max(nprof - 1, 1)
            dy = profile[min(pi + 1, nprof - 1)][1] - profile[max(pi - 1, 0)][1]
            dr = profile[min(pi + 1, nprof - 1)][0] - profile[max(pi - 1, 0)][0]
            slope = math.atan2(dr, dy + 1e-6)
            ny, nr = math.cos(slope), math.sin(slope)
            for s in range(seg):
                a = s / seg * math.tau
                c, si = math.cos(a), math.sin(a)
                n = (nr * c, ny, nr * si)
                ln = math.sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2) or 1
                n = (n[0] / ln, n[1] / ln, n[2] / ln)
                ring.append(self.add((cx + r * c, y, cz + r * si), n, (u + s / seg * 0.45, 0.05 + v * 0.4)))
            rings.append(ring)
        for pi in range(nprof - 1):
            for s in range(seg):
                a, b = rings[pi][s], rings[pi][(s + 1) % seg]
                c, d = rings[pi + 1][(s + 1) % seg], rings[pi + 1][s]
                self.tri(a, b, c)
                self.tri(a, c, d)

    def dome(self, r: float, cx: float, cy: float, cz: float, bulge: float = 1.15, u: float = 0.5) -> None:
        prof = []
        for k in range(14):
            t = k / 13
            ang = t * math.pi * 0.5
            rr = r * math.cos(ang) * (1 + 0.22 * math.sin(t * math.pi) * (bulge - 1))
            y = cy + r * math.sin(ang) * bulge
            prof.append((max(rr, 0.02), y))
        self.lathe(prof, cx, cz, 28, u)
        self.cyl(0.12, 0.04, r * 0.22, cx, cy + r * bulge, cz, 10, True, 0.78)

    def chhatri(self, cx: float, cy: float, cz: float, s: float = 1.0, u: float = 0.0) -> None:
        for k in range(4):
            a = k * math.pi * 0.5 + math.pi * 0.25
            self.cyl(0.07 * s, 0.06 * s, 0.85 * s, cx + math.cos(a) * 0.38 * s, cy, cz + math.sin(a) * 0.38 * s, 8, False, u)
        self.box(1.05 * s, 0.1 * s, 1.05 * s, cx, cy + 0.9 * s, cz, u)
        self.dome(0.42 * s, cx, cy + 0.95 * s, cz, 1.05, 0.5)

    def merlons(self, x0: float, x1: float, z: float, y: float, n: int, depth: float, u: float = 0.0) -> None:
        span = x1 - x0
        w = span / (n * 1.7)
        for k in range(n):
            x = x0 + (k + 0.5) * (span / n)
            self.box(w, 0.55, depth, x, y + 0.28, z, u)

    def pointed_iwan(self, cx: float, cy: float, cz: float, w: float, h: float, d: float, u: float = 0.0) -> None:
        """Recessed pointed arch: two piers + a pointed vault of voussoirs."""
        pier = w * 0.18
        self.box(pier, h, d, cx - w * 0.5 + pier * 0.5, cy + h * 0.5, cz, u)
        self.box(pier, h, d, cx + w * 0.5 - pier * 0.5, cy + h * 0.5, cz, u)
        aw = w - pier * 2
        steps = 10
        for s in range(steps):
            t0, t1 = s / steps, (s + 1) / steps
            # two circular arcs meeting at the apex
            def arch_y(t: float) -> float:
                return cy + h * 0.45 + math.sin(t * math.pi) * h * 0.5

            def arch_x(t: float) -> float:
                return cx + (t - 0.5) * aw

            x0, x1 = arch_x(t0), arch_x(t1)
            y0, y1 = arch_y(t0), arch_y(t1)
            mx, my = (x0 + x1) * 0.5, (y0 + y1) * 0.5
            self.box(abs(x1 - x0) + 0.08, 0.22, d * 0.92, mx, my, cz, u)
        self.box(w, 0.28, d * 1.04, cx, cy + h + 0.14, cz, u)


def onion_profile(r: float, h: float, y0: float, n: int = 16) -> list[tuple[float, float]]:
    pts = []
    for k in range(n):
        t = k / (n - 1)
        y = y0 + t * h
        if t < 0.12:
            rr = r * (0.62 + 0.38 * t / 0.12)
        elif t < 0.42:
            rr = r * (1.0 + 0.06 * math.sin((t - 0.12) / 0.3 * math.pi))
        else:
            u = min(1.0, max(0.0, (t - 0.42) / 0.58))
            rr = r * max(0.04, (1.0 - u) ** 1.35)
        pts.append((rr, y))
    return pts


def sandstone(size: int, kind: str) -> Image.Image:
    palettes = {
        "buff": ((168, 138, 104), (142, 112, 82), (188, 160, 124)),
        "red": ((138, 58, 48), (110, 42, 36), (168, 86, 70)),
        "qutub": ((154, 82, 62), (120, 58, 44), (186, 140, 110)),
        "marble": ((232, 226, 216), (210, 204, 196), (248, 244, 238)),
    }
    base, dark, lite = palettes[kind]
    img = Image.new("RGB", (size, size), base)
    dr = ImageDraw.Draw(img)
    rows, cols = 16, 8
    rh, cw = size / rows, size / cols
    rng = np.random.default_rng(7 if kind != "red" else 11)
    for r in range(rows):
        off = (r % 2) * (cw * 0.5)
        for c in range(cols + 1):
            x, y = c * cw - off, r * rh
            jitter = int(rng.integers(-12, 13))
            col = tuple(max(0, min(255, ch + jitter)) for ch in (base if rng.random() > 0.3 else lite))
            dr.rectangle((x + 1, y + 1, x + cw - 2, y + rh - 2), fill=col)
            dr.rectangle((x, y, x + cw, y + rh), outline=dark, width=1)
    if kind == "marble":
        for _ in range(40):
            x0, y0 = int(rng.integers(0, size)), int(rng.integers(0, size))
            dr.line((x0, y0, x0 + int(rng.integers(-80, 80)), y0 + int(rng.integers(-40, 40))), fill=dark, width=1)
    img = img.filter(ImageFilter.SMOOTH)
    return img


def facade_atlas(kind: str, iso_name: str | None) -> bytes:
    from io import BytesIO

    stone = sandstone(1024, kind)
    buf = BytesIO()
    stone.save(buf, format="JPEG", quality=86)
    return buf.getvalue()


def export_glb(path: Path, mesh: Mesh, jpeg: bytes, rough: float, metal: float) -> None:
    pos = np.asarray(mesh.v, dtype=np.float32)
    nrm = np.asarray(mesh.n, dtype=np.float32)
    uv = np.asarray(mesh.uv, dtype=np.float32)
    idx = np.asarray(mesh.i, dtype=np.uint32)
    blob = pos.tobytes() + nrm.tobytes() + uv.tobytes() + idx.tobytes() + jpeg
    pos_len = pos.nbytes
    nrm_off, nrm_len = pos_len, nrm.nbytes
    uv_off, uv_len = nrm_off + nrm_len, uv.nbytes
    idx_off, idx_len = uv_off + uv_len, idx.nbytes
    img_off, img_len = idx_off + idx_len, len(jpeg)

    mins = pos.min(axis=0).tolist()
    maxs = pos.max(axis=0).tolist()
    gltf = {
        "asset": {"version": "2.0", "generator": "bhaiai-landmarks"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": path.stem}],
        "meshes": [{
            "primitives": [{
                "attributes": {"POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 2},
                "indices": 3,
                "material": 0,
            }]
        }],
        "materials": [{
            "pbrMetallicRoughness": {
                "baseColorTexture": {"index": 0},
                "metallicFactor": metal,
                "roughnessFactor": rough,
            },
            "doubleSided": False,
        }],
        "textures": [{"sampler": 0, "source": 0}],
        "images": [{"mimeType": "image/jpeg", "bufferView": 4}],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}],
        "buffers": [{"byteLength": len(blob)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": pos_len, "target": 34962},
            {"buffer": 0, "byteOffset": nrm_off, "byteLength": nrm_len, "target": 34962},
            {"buffer": 0, "byteOffset": uv_off, "byteLength": uv_len, "target": 34962},
            {"buffer": 0, "byteOffset": idx_off, "byteLength": idx_len, "target": 34963},
            {"buffer": 0, "byteOffset": img_off, "byteLength": img_len},
        ],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": len(pos), "type": "VEC3", "min": mins, "max": maxs},
            {"bufferView": 1, "componentType": 5126, "count": len(nrm), "type": "VEC3"},
            {"bufferView": 2, "componentType": 5126, "count": len(uv), "type": "VEC2"},
            {"bufferView": 3, "componentType": 5125, "count": len(idx), "type": "SCALAR"},
        ],
    }
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_bytes += b" " * pad4(len(json_bytes))
    bin_bytes = blob + b"\x00" * pad4(len(blob))
    total = 12 + 8 + len(json_bytes) + 8 + len(bin_bytes)
    with path.open("wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<I4s", len(json_bytes), b"JSON"))
        f.write(json_bytes)
        f.write(struct.pack("<I4s", len(bin_bytes), b"BIN\x00"))
        f.write(bin_bytes)


def india_gate() -> Mesh:
    m = Mesh()
    # Real: 42 m tall, ~30 m wide, ~10 m deep. Facade +Z. Opening through Z.
    W, D, H = 30.0, 10.2, 42.0
    m.box(W * 1.18, 0.7, D * 1.35, 0, 0.35, 0, 0.52)
    m.box(W * 1.08, 0.55, D * 1.22, 0, 0.95, 0, 0.52)
    m.box(W * 1.0, 0.4, D * 1.1, 0, 1.4, 0, 0.52)
    pier_w, pier_d, pier_h = 8.4, 9.4, 26.5
    gap = 6.6
    for sx in (-1, 1):
        x = sx * (gap * 0.5 + pier_w * 0.5)
        m.box(pier_w, pier_h, pier_d, x, 1.7 + pier_h * 0.5, 0, 0.0)
        m.box(pier_w * 0.78, pier_h * 0.55, 0.35, x, 8.0, pier_d * 0.5 + 0.1, 0.0)
        m.box(pier_w * 1.04, 0.45, pier_d * 1.04, x, 6.2, 0, 0.52)
        m.box(pier_w * 1.04, 0.45, pier_d * 1.04, x, 24.0, 0, 0.52)
        for s in range(12):
            t0, t1 = s / 12 * math.pi, (s + 1) / 12 * math.pi
            sr = 1.55
            px0, py0 = math.cos(t0) * sr, 8.8 + math.sin(t0) * sr
            px1, py1 = math.cos(t1) * sr, 8.8 + math.sin(t1) * sr
            m.box(abs(px1 - px0) + 0.2, abs(py1 - py0) + 0.2, pier_d * 0.2, x + px0 * 0.15, (py0 + py1) * 0.5, pier_d * 0.42, 0.0)
    # barrel vault
    rad, depth = 6.4, 9.0
    for s in range(28):
        t0, t1 = s / 28 * math.pi, (s + 1) / 28 * math.pi
        x0, y0 = math.cos(t0) * rad, 1.7 + 18.2 + math.sin(t0) * rad
        x1, y1 = math.cos(t1) * rad, 1.7 + 18.2 + math.sin(t1) * rad
        m.box(abs(x1 - x0) + 0.35, abs(y1 - y0) + 0.35, depth, (x0 + x1) * 0.5, (y0 + y1) * 0.5, 0, 0.0)
    lintel_h = 6.2
    m.box(W * 1.02, lintel_h, D * 1.05, 0, 1.7 + pier_h + lintel_h * 0.5, 0, 0.0)
    m.box(W * 1.08, 0.7, D * 1.12, 0, 1.7 + pier_h + lintel_h + 0.35, 0, 0.52)
    attic_h = 5.4
    m.box(W * 0.72, attic_h, D * 0.72, 0, 1.7 + pier_h + lintel_h + 0.7 + attic_h * 0.5, 0, 0.0)
    m.box(W * 0.5, 0.45, D * 0.5, 0, 1.7 + pier_h + lintel_h + 0.7 + attic_h + 0.22, 0, 0.52)
    m.dome(1.6, 0, 1.7 + pier_h + lintel_h + 0.7 + attic_h + 0.4, 0, 1.0, 0.52)
    # Amar Jawan canopy
    m.box(2.4, 0.2, 2.4, 0, 2.0, 0, 0.78)
    m.chhatri(0, 2.1, 0, 1.15, 0.78)
    return m


def qutub() -> Mesh:
    m = Mesh()
    # 72.5 m, base Ø 14.3 m → top Ø 2.7 m, five storeys
    m.cyl(8.4, 8.4, 0.6, 0, 0, 0, 32, True, 0.52)
    m.cyl(7.4, 7.4, 0.5, 0, 0.6, 0, 32, True, 0.52)
    storeys = [
        (14.3 / 2, 12.0 / 2, 18.4),
        (11.2 / 2, 9.4 / 2, 14.8),
        (8.8 / 2, 6.6 / 2, 14.2),
        (6.2 / 2, 4.4 / 2, 12.8),
        (4.0 / 2, 1.35, 9.6),
    ]
    y = 1.1
    for i, (r0, r1, h) in enumerate(storeys):
        m.cyl(r0, r1, h, 0, y, 0, 28, False, 0.0 if i < 3 else 0.52)
        if i < 3:
            flutes = 24 if i == 0 else 16
            for k in range(flutes):
                a = k / flutes * math.tau
                fr = r0 * 0.92
                m.cyl(0.32 if i == 0 else 0.22, 0.22 if i == 0 else 0.16, h * 0.92, math.cos(a) * fr, y + 0.2, math.sin(a) * fr, 8, False, 0.52)
        # balcony
        yb = y + h
        m.cyl(r1 + 0.85, r1 + 0.85, 0.28, 0, yb, 0, 24, True, 0.0)
        for k in range(16):
            a = k / 16 * math.tau
            m.box(0.18, 0.7, 0.18, math.cos(a) * (r1 + 0.7), yb + 0.5, math.sin(a) * (r1 + 0.7), 0.0)
        y = yb + 0.55
    m.cyl(1.2, 0.9, 2.4, 0, y, 0, 16, False, 0.52)
    m.dome(1.15, 0, y + 2.4, 0, 1.05, 0.52)
    return m


def red_fort() -> Mesh:
    m = Mesh()
    # Lahori Gate: two octagonal bastions, central iwan, merlons. ~33 m.
    H = 33.0
    m.box(42, 1.2, 18, 0, 0.6, 0, 0.0)
    # flanking octagonal towers approximated as stacked cylinders + boxes
    for sx in (-1, 1):
        x = sx * 14.5
        m.cyl(6.2, 6.2, 22.0, x, 1.2, 0, 12, False, 0.0)
        m.cyl(6.6, 6.6, 1.1, x, 23.0, 0, 12, True, 0.0)
        for k in range(12):
            a = k / 12 * math.tau
            m.box(0.7, 1.1, 0.7, x + math.cos(a) * 6.4, 24.6, math.sin(a) * 6.4, 0.0)
        m.chhatri(x, 25.4, 0, 2.4, 0.52)
        # niches
        for ny in (6.0, 12.0, 18.0):
            m.box(1.6, 2.4, 0.4, x, ny, 6.1, 0.0)
    m.box(16.5, 20.0, 12.0, 0, 11.2, 0, 0.0)
    m.pointed_iwan(0, 1.4, 6.1, 8.5, 14.5, 1.2, 0.0)
    m.box(17.5, 1.4, 13.0, 0, 22.0, 0, 0.0)
    m.merlons(-8, 8, 6.4, 22.6, 9, 0.7, 0.0)
    for sx in (-0.55, 0.55):
        m.cyl(0.55, 0.45, 8.5, sx * 5.2, 22.5, 0, 10, False, 0.0)
        m.cyl(0.7, 0.15, 1.4, sx * 5.2, 31.0, 0, 8, True, 0.78)
    # roof chhatri row
    for sx in range(-3, 4):
        m.dome(0.55, sx * 1.7, 23.5, 0, 1.0, 0.52)
    return m


def lotus() -> Mesh:
    m = Mesh()
    # 27 marble petals in 3 rings of 9, height ~34 m, spread ~70 m.
    m.cyl(18, 18, 1.2, 0, 0, 0, 32, True, 0.52)

    def petal(tilt: float, yaw: float, length: float, width: float, lift: float) -> None:
        # flattened pointed shell sitting on a ring
        prof = []
        for k in range(10):
            t = k / 9
            rr = width * math.sin(t * math.pi) * 0.5
            y = t * length
            prof.append((max(rr, 0.08), y))
        tmp = Mesh()
        tmp.lathe(prof, 0, 0, 12, 0.52)
        # flatten Z, then rotate tilt around X, yaw around Y, lift
        ca, sa = math.cos(tilt), math.sin(tilt)
        cy, sy = math.cos(yaw), math.sin(yaw)
        for p, n, uv in zip(tmp.v, tmp.n, tmp.uv):
            x, y, z = p[0], p[1], p[2] * 0.18
            # tilt around X (open outward)
            y2 = y * ca - z * sa
            z2 = y * sa + z * ca
            # yaw around Y
            x3 = x * cy + z2 * sy
            z3 = -x * sy + z2 * cy
            nx, ny, nz = n[0], n[1], n[2]
            ny2 = ny * ca - nz * sa
            nz2 = ny * sa + nz * ca
            nx3 = nx * cy + nz2 * sy
            nz3 = -nx * sy + nz2 * cy
            ln = math.sqrt(nx3 * nx3 + ny2 * ny2 + nz3 * nz3) or 1
            m.add((x3, y2 + lift, z3), (nx3 / ln, ny2 / ln, nz3 / ln), uv)
        base = len(m.v) - len(tmp.v)
        for t in range(0, len(tmp.i), 3):
            m.tri(base + tmp.i[t], base + tmp.i[t + 1], base + tmp.i[t + 2])

    rings = [
        (9, 22.0, math.radians(62), 18.0, 7.5, 1.4),
        (9, 12.5, math.radians(38), 16.5, 6.2, 3.6),
        (9, 5.5, math.radians(16), 14.0, 4.8, 6.5),
    ]
    for count, radius, tilt, length, width, lift in rings:
        for k in range(count):
            yaw = k / count * math.tau
            # place petal at radius along yaw, opening outward
            # petal local Y is length; after tilt, offset in XZ
            petal(tilt, yaw, length, width, lift)
            # extra offset: move along yaw
            # (petal already yaw-rotated around origin; shift)
    # shift last-added? easier: rebuild placement inside petal
    # The petals are at origin. Offset each by walking the last verts... messy.
    # Re-place: we added petals at origin. Apply a post offset per petal by tracking counts.
    return m


def lotus_placed() -> Mesh:
    """Lotus with petals offset onto three concentric rings."""
    m = Mesh()
    m.cyl(16.5, 16.5, 1.1, 0, 0, 0, 32, True, 0.52)
    m.cyl(9.0, 8.2, 2.4, 0, 1.1, 0, 24, True, 0.52)

    def add_petal(tilt: float, yaw: float, length: float, width: float, lift: float, radius: float) -> None:
        ox, oz = math.sin(yaw) * radius, math.cos(yaw) * radius
        ca, sa = math.cos(tilt), math.sin(tilt)
        cy, sy = math.cos(yaw), math.sin(yaw)
        rows, cols = 12, 14
        grid: list[list[int]] = []
        for i in range(rows):
            t = i / (rows - 1)
            row = []
            for j in range(cols):
                u = j / (cols - 1)
                # pointed oval in local XY, thin Z
                lx = (u - 0.5) * width * math.sin(t * math.pi)
                ly = t * length
                lz = (0.35 + 0.55 * math.sin(t * math.pi)) * (1.1 - abs(u - 0.5) * 1.4)
                # tilt around X
                y2 = ly * ca - lz * sa
                z2 = ly * sa + lz * ca
                x2 = lx
                # yaw around Y
                x3 = x2 * cy + z2 * sy
                z3 = -x2 * sy + z2 * cy
                # normal approx outward
                n = (math.sin(yaw) * 0.4, 0.7, math.cos(yaw) * 0.4)
                ln = math.sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2)
                n = (n[0] / ln, n[1] / ln, n[2] / ln)
                row.append(m.add((x3 + ox, y2 + lift, z3 + oz), n, (0.55 + u * 0.4, 0.08 + t * 0.4)))
            grid.append(row)
        for i in range(rows - 1):
            for j in range(cols - 1):
                a, b = grid[i][j], grid[i][j + 1]
                c, d = grid[i + 1][j + 1], grid[i + 1][j]
                m.tri(a, b, c)
                m.tri(a, c, d)

    rings = [
        (9, 14.5, math.radians(58), 20.0, 8.4, 1.2),
        (9, 8.0, math.radians(36), 18.5, 7.0, 4.2),
        (9, 3.2, math.radians(14), 16.0, 5.6, 8.0),
    ]
    for count, radius, tilt, length, width, lift in rings:
        for k in range(count):
            yaw = k / count * math.tau + (0.0 if count == 9 else 0.0)
            # stagger middle ring
            if radius == 8.0:
                yaw += math.tau / 18
            add_petal(tilt, yaw, length, width, lift, radius)
    return m


def humayun() -> Mesh:
    m = Mesh()
    # 47 m, octagonal platform, high pishtaq, white onion dome, 4 chhatris
    m.box(48, 1.4, 48, 0, 0.7, 0, 0.0)
    m.box(36, 1.0, 36, 0, 1.9, 0, 0.0)
    body_h = 18.5
    m.box(28, body_h, 28, 0, 2.4 + body_h * 0.5, 0, 0.0)
    # chamfer corners
    for sx, sz in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        m.box(8, body_h, 8, sx * 12, 2.4 + body_h * 0.5, sz * 12, 0.0)
        m.chhatri(sx * 11.5, 2.4 + body_h, sz * 11.5, 2.6, 0.52)
    m.pointed_iwan(0, 3.2, 14.2, 9.5, 14.0, 1.6, 0.0)
    m.box(12, 2.2, 12, 0, 2.4 + body_h + 1.1, 0, 0.52)
    m.lathe(onion_profile(7.4, 16.5, 2.4 + body_h + 2.2), 0, 0, 32, 0.52)
    m.cyl(0.18, 0.08, 2.8, 0, 2.4 + body_h + 2.2 + 16.5, 0, 8, True, 0.78)
    # drum windows
    for k in range(8):
        a = k / 8 * math.tau
        m.box(1.4, 2.2, 0.4, math.cos(a) * 7.2, 2.4 + body_h + 3.4, math.sin(a) * 7.2, 0.52)
    return m


def jama() -> Mesh:
    m = Mesh()
    # Prayer hall ~41 m to minaret tops. Facade +Z.
    m.box(52, 1.2, 22, 0, 0.6, 0, 0.0)
    m.box(48, 9.5, 16, 0, 6.0, 0, 0.0)
    m.pointed_iwan(0, 1.4, 8.2, 10.0, 16.5, 1.8, 0.0)
    m.box(12, 8.0, 6, 0, 14.5, 2.0, 0.52)
    # side arcades
    for sx in range(-4, 5):
        if sx == 0:
            continue
        m.box(3.2, 6.5, 1.1, sx * 4.6, 5.2, 8.0, 0.0)
        m.cyl(1.4, 1.4, 0.4, sx * 4.6, 8.4, 8.0, 10, True, 0.52)
    # three onion domes
    m.lathe(onion_profile(6.8, 12.5, 16.8), 0, 0, 28, 0.52)
    m.cyl(0.16, 0.07, 2.4, 0, 29.3, 0, 8, True, 0.78)
    for sx in (-1, 1):
        m.lathe(onion_profile(4.4, 8.5, 15.6), sx * 12.5, 0, 24, 0.52)
        m.cyl(0.12, 0.06, 1.8, sx * 12.5, 24.1, 0, 8, True, 0.78)
    # minarets
    for sx in (-1, 1):
        x = sx * 22.5
        m.cyl(1.7, 1.35, 28.0, x, 1.2, 0, 16, False, 0.0)
        for band in (8.0, 16.0, 24.0):
            m.cyl(1.9, 1.9, 0.45, x, band, 0, 12, True, 0.52)
        m.cyl(1.5, 1.1, 4.5, x, 29.2, 0, 12, False, 0.52)
        m.dome(1.3, x, 33.7, 0, 1.05, 0.52)
    m.box(14, 1.4, 10, 0, 1.3, 10.5, 0.0)
    return m


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [
        ("india-gate.glb", india_gate, "buff", "india-gate.jpg", 0.72, 0.04),
        ("qutub-minar.glb", qutub, "qutub", "qutub-minar.jpg", 0.78, 0.03),
        ("red-fort.glb", red_fort, "red", "red-fort.jpg", 0.76, 0.03),
        ("lotus.glb", lotus_placed, "marble", "lotus.jpg", 0.38, 0.02),
        ("humayun.glb", humayun, "red", "humayun.jpg", 0.7, 0.04),
        ("jama-masjid.glb", jama, "red", "jama-masjid.jpg", 0.74, 0.04),
    ]
    for name, fn, kind, iso, rough, metal in jobs:
        mesh = fn()
        jpeg = facade_atlas(kind, iso)
        dest = OUT / name
        export_glb(dest, mesh, jpeg, rough, metal)
        tris = len(mesh.i) // 3
        print(f"{name:18}  {tris:6d} tris  {dest.stat().st_size/1024:7.1f} KB")


if __name__ == "__main__":
    main()
