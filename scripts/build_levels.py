#!/usr/bin/env python3
"""Generátor levelov Miasmy: zapíše src/game/levels.ts (potom spusti prettier).

Legenda znakov je v src/game/level.ts. Mapa má 16 riadkov, zem je predvolene od riadku 12,
hráč teda stojí v riadku 11. Prejazdnosť overuje bot (npm test).
"""
import random
from pathlib import Path

H = 16


class L:
    def __init__(s, w):
        s.w = w
        s.g = [[' '] * w for _ in range(H)]

    def ground(s, x0, x1, top=12, bottom=H - 1):
        for y in range(top, bottom + 1):
            for x in range(x0, x1 + 1):
                s.g[y][x] = '#'

    def plat(s, x0, x1, row, ch='-'):
        for x in range(x0, x1 + 1):
            s.g[row][x] = ch

    def put(s, x, row, ch):
        assert s.g[row][x] == ' ', (x, row, ch, s.g[row][x])
        s.g[row][x] = ch

    def many(s, pts, ch):
        for x, y in pts:
            s.put(x, y, ch)

    def water(s, x0, x1, top=12):
        for y in range(top, H):
            for x in range(x0, x1 + 1):
                s.g[y][x] = 'w'

    def ceiling(s, x0, x1, bottom=None):
        r = random.Random(x0 * 31 + x1)
        b = 1
        for x in range(x0, x1 + 1):
            # Strop sa mení plynulo (náhodná prechádzka), nie po jednom stĺpci.
            if r.random() < 0.3:
                b = max(0, min(2, b + r.choice([-1, 1])))
            for y in range(0, (bottom if bottom is not None else b) + 1):
                s.g[y][x] = '#'

    def rows(s):
        return [''.join(r).rstrip() for r in s.g]


levels = []

# ===== Svet 1: Karanténna štvrť (ulice, strechy, nakazení, prízraky; dážď a blesky) =====

# 1 — Karanténa (úvod)
a = L(112)
a.ground(0, 26); a.put(1, 11, 'P'); a.put(4, 11, '1'); a.many([(8, 11), (10, 11)], 'f'); a.put(13, 11, '2')
a.ground(17, 19, top=10)
a.water(27, 29); a.put(28, 9, 'f')
a.ground(30, 60); a.put(33, 10, 'L'); a.put(35, 11, '3'); a.put(38, 11, '4'); a.plat(41, 42, 11, '^')
a.put(46, 11, '5'); a.put(55, 11, 'g')
a.ground(61, 64, top=10); a.ground(65, 70, top=8); a.plat(66, 68, 5); a.put(67, 4, '*')
a.many([(62, 9), (66, 7)], 'f')
a.ground(71, 111); a.put(80, 11, 'g'); a.plat(87, 88, 11, '^'); a.put(84, 11, 'f')
a.put(99, 11, '6'); a.put(106, 11, 'E')
levels.append(('quarter', 'quarter-1', 'level1',
               ['hintMove', 'hintEmbers', 'hintShrine', 'hintSpikes', 'hintGhoul', 'hintExit'], a))

# 2 — Strechy (plachty vymrštia, zhnité dosky sa prelomia, pád = smrť)
b = L(118)
b.ground(0, 14, top=10); b.put(1, 9, 'P'); b.put(4, 9, '1'); b.put(8, 9, 'f'); b.plat(12, 12, 10, 'b')
b.ground(15, 28, top=5); b.put(17, 4, 'f'); b.put(20, 4, '2'); b.put(26, 4, 'g')
b.plat(29, 33, 5, 'c')
b.ground(34, 41, top=6); b.put(37, 5, 'L')
b.plat(44, 45, 8, 'c'); b.plat(48, 49, 8, 'c'); b.many([(44, 7), (48, 7)], 'f')
b.ground(51, 63, top=9); b.put(57, 8, 'g'); b.put(55, 4, 's'); b.plat(62, 62, 9, 'b')
b.ground(66, 79, top=4); b.put(69, 3, 'f'); b.plat(73, 74, 3, '^')
b.plat(82, 83, 7, 'c'); b.plat(86, 87, 9, 'c'); b.put(86, 8, 'f')
b.ground(90, 117, top=10); b.put(93, 9, 'L'); b.put(100, 9, 'g'); b.plat(104, 105, 9, '^')
b.plat(107, 109, 7); b.put(108, 6, '*'); b.put(111, 5, 's'); b.put(113, 9, 'E')
levels.append(('quarter', 'quarter-2', 'level2', ['hintAwning', 'hintPlanks'], b))

# 3 — Prízraky (rozžiarenie fakle, hod iskry)
c = L(116)
c.ground(0, 28); c.put(1, 11, 'P'); c.put(5, 11, '1'); c.put(17, 7, 's'); c.many([(10, 11), (13, 11)], 'f')
c.put(24, 11, '2')
c.water(29, 32)
c.ground(33, 54); c.put(36, 10, 'L'); c.put(42, 6, 's'); c.put(49, 7, 's'); c.plat(45, 46, 11, '^')
c.plat(39, 41, 9); c.put(40, 8, 'f')
c.ground(55, 58, top=10); c.ground(59, 63, top=8); c.put(61, 7, 'f')
c.plat(64, 69, 8, 'c'); c.put(67, 4, 's')
c.ground(70, 82, top=9); c.put(77, 8, 'g'); c.put(73, 8, 'f')
c.water(83, 86)
c.ground(87, 115); c.put(90, 10, 'L'); c.put(97, 6, 's'); c.put(104, 11, 'g'); c.plat(100, 101, 11, '^')
c.put(108, 5, 's'); c.plat(94, 96, 9); c.put(95, 8, '*'); c.put(111, 11, 'E')
levels.append(('quarter', 'quarter-3', 'level3', ['hintWraith', 'hintFlare'], c))

# 4 — Šibeničné námestie
d = L(132)
d.ground(0, 18); d.put(1, 11, 'P'); d.put(8, 11, 'f'); d.put(13, 11, 'g')
d.ground(19, 22, top=10); d.ground(23, 27, top=8); d.put(25, 4, 's')
d.plat(28, 33, 8, 'c'); d.put(31, 7, 'f')
d.ground(34, 40, top=8); d.plat(41, 42, 8, '^'); d.ground(43, 46, top=8); d.put(45, 7, 'L')
d.water(47, 51)
d.ground(52, 77); d.put(58, 11, 'g'); d.put(66, 11, 'g'); d.put(62, 6, 's'); d.plat(70, 71, 11, '^')
d.plat(60, 62, 9); d.put(61, 8, 'f'); d.plat(75, 75, 12, 'b')
d.ground(78, 88, top=7); d.put(82, 6, 'f'); d.put(86, 6, 'g')
d.plat(89, 94, 7, 'c'); d.put(92, 3, 's')
d.ground(95, 100, top=7); d.put(97, 6, 'L')
d.plat(103, 104, 9, 'c'); d.plat(107, 108, 11, 'c')
d.ground(110, 131); d.put(115, 11, 'g'); d.plat(119, 120, 11, '^'); d.put(123, 6, 's')
d.plat(112, 114, 8); d.put(113, 7, '*'); d.put(117, 11, 'f'); d.put(127, 11, 'E')
levels.append(('quarter', 'quarter-4', 'level4', [], d))

# ===== Svet 2: Katakomby (žumpa, slizké kamene, padajúce murivo, roje múch) =====

# 5 — Kostnica
e = L(116)
e.ceiling(0, 115)
e.ground(0, 22); e.put(1, 11, 'P'); e.put(4, 11, '1'); e.put(9, 11, 'f')
e.water(23, 26); e.put(24, 9, 'f')
e.ground(27, 46); e.put(30, 10, 'L'); e.put(33, 11, '2'); e.plat(36, 44, 12, 'i')
e.put(40, 11, 'f')
e.water(47, 50)
e.ground(51, 70); e.put(53, 11, '3'); e.ground(56, 68, top=5, bottom=7)
e.many([(57, 8), (59, 8), (61, 8), (63, 8), (65, 8), (67, 8)], 'v'); e.put(62, 11, 'f')
e.water(71, 79); e.plat(72, 73, 11, 'c'); e.plat(76, 77, 10, 'c'); e.put(76, 9, 'f')
e.ground(80, 115); e.put(83, 10, 'L'); e.put(89, 11, 'g'); e.put(96, 6, 's')
e.plat(99, 101, 9); e.put(100, 8, '*'); e.plat(104, 105, 11, '^'); e.put(111, 11, 'E')
levels.append(('catacombs', 'catacombs-1', 'level5', ['hintSewage', 'hintSlick', 'hintDebris'], e))

# 6 — Roje
f = L(116)
f.ceiling(0, 115)
f.ground(0, 18); f.put(1, 11, 'P'); f.put(5, 11, '1'); f.many([(12, 9), (16, 8)], 'r'); f.put(9, 11, 'f')
f.water(19, 22)
f.ground(23, 42); f.many([(29, 9), (35, 8)], 'r'); f.put(39, 10, 'L'); f.put(32, 11, 'g'); f.put(26, 11, 'f')
f.ground(43, 46, top=10); f.ground(47, 50, top=8)
f.water(51, 62); f.plat(52, 53, 9, 'c'); f.plat(56, 57, 9, 'c'); f.plat(60, 61, 9, 'c')
f.many([(54, 6), (58, 5)], 'r'); f.many([(52, 8), (60, 8)], 'f')
f.ground(63, 80, top=9); f.put(66, 8, 'L'); f.put(73, 8, 'g'); f.put(77, 4, 's')
f.water(81, 86); f.plat(83, 84, 10, 'i')
f.ground(87, 115); f.many([(92, 9), (97, 7)], 'r'); f.put(101, 6, 's'); f.put(104, 11, 'g')
f.plat(94, 96, 9); f.put(95, 8, '*'); f.put(99, 11, 'f'); f.put(111, 11, 'E')
levels.append(('catacombs', 'catacombs-2', 'level6', ['hintRats'], f))

# 7 — Stoky
g = L(118)
g.ceiling(0, 117)
g.water(13, 96)
g.ground(0, 12); g.put(1, 11, 'P'); g.put(9, 11, 'f')
g.plat(13, 15, 11, 'c'); g.ground(16, 20, top=11); g.plat(16, 20, 11, 'i'); g.put(18, 10, 'f')
g.plat(23, 24, 11, 'c'); g.ground(27, 33, top=10); g.put(30, 9, 'L'); g.put(32, 6, 'r')
g.plat(36, 37, 10, 'c'); g.plat(40, 41, 9, 'c'); g.plat(44, 45, 9, 'c'); g.put(42, 4, 's')
g.many([(40, 8), (44, 8)], 'f')
g.ground(48, 56, top=9); g.plat(48, 56, 9, 'i'); g.put(52, 8, 'g')
g.ground(48, 56, top=3, bottom=5); g.many([(49, 6), (51, 6), (53, 6), (55, 6)], 'v')
g.plat(59, 60, 10, 'c'); g.plat(63, 64, 10, 'c')
g.ground(67, 74, top=10); g.put(70, 9, 'L'); g.many([(72, 6), (66, 7)], 'r')
g.plat(77, 78, 10, 'c'); g.plat(81, 82, 9, 'c'); g.plat(83, 85, 6); g.put(84, 5, '*')
g.plat(85, 86, 9, 'c'); g.plat(89, 90, 10, 'c'); g.put(88, 5, 's')
g.ground(93, 96, top=11); g.put(94, 10, 'f')
g.ground(97, 117); g.put(103, 11, 'g'); g.put(108, 7, 's'); g.put(113, 11, 'E')
levels.append(('catacombs', 'catacombs-3', 'level7', [], g))

# 8 — Morový prameň
h = L(126)
h.ceiling(0, 125)
h.ground(0, 16); h.put(1, 11, 'P'); h.put(10, 9, 'r'); h.put(7, 11, 'f')
h.water(17, 20)
h.ground(21, 38); h.plat(26, 27, 11, '^'); h.put(31, 6, 's'); h.put(35, 11, 'g'); h.put(23, 11, 'f')
h.water(39, 49); h.plat(40, 41, 10, 'c'); h.plat(43, 44, 8, 'c'); h.plat(46, 47, 6, 'c')
h.many([(40, 9), (46, 5)], 'f')
h.ceiling(46, 62, 0)
h.ground(50, 62, top=6); h.put(53, 5, 'L'); h.many([(57, 3), (60, 4)], 'r')
h.water(63, 74); h.plat(63, 70, 9, 'i'); h.plat(71, 74, 9, 'c'); h.put(67, 8, 'f')
h.ground(75, 96); h.ground(78, 90, top=5, bottom=7)
h.many([(79, 8), (81, 8), (83, 8), (85, 8), (87, 8), (89, 8)], 'v'); h.put(84, 11, 'g')
h.put(93, 10, 'L'); h.plat(91, 92, 11, '^')
h.water(97, 102); h.plat(99, 100, 11, 'c')
h.ground(103, 125); h.many([(108, 9), (112, 8)], 'r'); h.put(115, 6, 's'); h.put(110, 11, 'g')
h.plat(105, 107, 9); h.put(106, 8, '*'); h.put(120, 11, 'E')
levels.append(('catacombs', 'catacombs-4', 'level8', [], h))

# ===== Svet 3: Morové jamy (otvorený cintorín: vietor v nárazoch, blesky, veľké prízraky) =====

# 9 — Cintorínska brána
a = L(120)
a.ground(0, 20); a.put(1, 11, 'P'); a.put(4, 11, '1'); a.put(8, 11, 'f')
a.plat(12, 12, 11, '#'); a.put(14, 11, '2')
a.water(21, 24)
a.ground(25, 46); a.plat(30, 30, 11, '#'); a.put(33, 10, 'L'); a.plat(36, 37, 11, '^'); a.put(42, 11, 'g')
a.water(47, 52); a.plat(49, 50, 11, 'c')
a.ground(53, 72); a.plat(57, 57, 11, '#'); a.put(59, 11, 'f'); a.put(62, 7, 's'); a.plat(64, 65, 11, '^')
a.plat(68, 68, 11, '#')
a.water(73, 76)
a.ground(77, 80, top=10)
a.water(81, 84)
a.ground(85, 119); a.plat(89, 89, 11, '#'); a.put(93, 10, 'L'); a.plat(97, 99, 9); a.put(98, 8, '*')
a.put(102, 11, 'g'); a.put(106, 6, 's'); a.plat(109, 110, 11, '^'); a.put(115, 11, 'E')
levels.append(('pits', 'pits-1', 'level9', ['hintWind', 'hintShelter'], a))

# 10 — Masové hroby
b = L(124)
b.ground(0, 22); b.put(1, 11, 'P'); b.put(4, 11, '1'); b.put(14, 5, 'S'); b.put(9, 11, 'f')
b.water(23, 26)
b.ground(27, 46); b.plat(30, 30, 11, '#'); b.put(33, 10, 'L'); b.put(40, 11, 'g'); b.plat(44, 45, 11, '^')
b.ground(47, 52); b.plat(48, 48, 11, '#'); b.plat(51, 51, 12, 'b')
b.ground(53, 62, top=7); b.put(57, 3, 'S'); b.put(55, 6, 'f')
b.plat(63, 66, 7, 'c')
b.ground(67, 72, top=8); b.plat(71, 71, 7, '#'); b.put(69, 7, 'L')
b.water(73, 77)
b.ground(78, 123); b.plat(82, 82, 11, '#'); b.put(87, 11, 'g'); b.put(93, 6, 'S'); b.plat(96, 97, 11, '^')
b.put(103, 11, 'g'); b.plat(106, 106, 11, '#'); b.plat(109, 111, 8); b.put(110, 7, '*')
b.put(100, 11, 'f'); b.put(119, 11, 'E')
levels.append(('pits', 'pits-2', 'level10', ['hintBigWraith'], b))

# 11 — Kopáči
c = L(126)
c.ground(0, 14); c.put(1, 11, 'P'); c.put(8, 11, 'f')
c.ground(15, 20, top=10); c.plat(19, 19, 9, '#')
c.plat(23, 24, 10, 'c'); c.plat(27, 28, 10, 'c')
c.ground(30, 44, top=9); c.plat(33, 33, 8, '#'); c.put(36, 8, 'L'); c.put(41, 8, 'g'); c.put(39, 4, 's')
c.water(45, 49)
c.ground(50, 68); c.plat(54, 54, 11, '#'); c.put(58, 11, 'g'); c.put(62, 11, 'g'); c.put(60, 5, 'S')
c.plat(67, 67, 12, 'b')
c.ground(70, 78, top=7, bottom=8); c.put(72, 6, 'f'); c.plat(75, 75, 6, '#'); c.put(77, 3, 's')
c.plat(80, 83, 9, 'c')
c.ground(85, 98, top=10); c.put(89, 9, 'L'); c.plat(92, 92, 9, '#'); c.put(95, 9, 'g')
c.water(99, 103); c.plat(101, 101, 11, 'c')
c.ground(104, 125); c.plat(108, 108, 11, '#'); c.put(112, 6, 'S'); c.plat(115, 116, 11, '^')
c.plat(117, 119, 9); c.put(118, 8, '*'); c.put(110, 11, 'f'); c.put(121, 11, 'E')
levels.append(('pits', 'pits-3', 'level11', [], c))

# 12 — Jama
d = L(134)
d.ground(0, 14); d.put(1, 11, 'P'); d.put(7, 11, 'f'); d.plat(13, 13, 12, 'b')
d.ground(17, 24, top=7, bottom=8); d.plat(20, 20, 6, '#'); d.put(23, 3, 's')
d.plat(27, 28, 9, 'c'); d.plat(31, 32, 11, 'c')
d.ground(35, 48); d.plat(38, 38, 11, '#'); d.put(42, 11, 'g'); d.plat(45, 46, 11, '^'); d.put(48, 10, 'L')
d.water(49, 54); d.plat(51, 52, 11, 'c')
d.ground(55, 60, top=10); d.plat(59, 59, 9, '#')
d.plat(62, 63, 10, 'c'); d.plat(66, 67, 10, 'c')
d.ground(70, 83, top=10); d.put(72, 9, 'f'); d.put(77, 5, 'S'); d.put(75, 9, 'g'); d.plat(82, 82, 10, 'b')
d.ground(85, 92, top=5); d.put(87, 4, 'L'); d.plat(91, 91, 4, '#')
d.plat(94, 95, 9, 'c'); d.plat(98, 99, 11, 'c')
d.ground(102, 133); d.plat(106, 106, 11, '#'); d.put(110, 11, 'g'); d.put(114, 6, 'S'); d.plat(118, 119, 11, '^')
d.put(122, 6, 'S'); d.plat(123, 124, 9); d.put(123, 8, '*'); d.put(112, 11, 'f'); d.put(129, 11, 'E')
levels.append(('pits', 'pits-4', 'level12', [], d))

# ===== Svet 4: Katedrála (visiace plošiny, padajúce murivo, všetko dokopy) =====

# 13 — Hlavná loď
i = L(118)
i.ground(0, 14); i.put(1, 11, 'P'); i.put(4, 11, '1'); i.put(9, 11, 'f')
i.put(15, 12, 'H'); i.many([(17, 9), (19, 9)], 'f')
i.ground(21, 38); i.put(24, 10, 'L'); i.put(30, 7, 's'); i.put(34, 11, 'g')
i.put(39, 12, 'H'); i.put(46, 12, 'H'); i.many([(42, 9)], 'f')
i.ground(52, 64); i.ground(53, 63, top=5, bottom=7); i.many([(54, 8), (56, 8), (58, 8), (60, 8), (62, 8)], 'v')
i.put(59, 11, 'f')
i.ground(65, 75, top=10); i.put(72, 6, 's'); i.put(70, 9, 'g')
i.put(76, 10, 'H'); i.put(79, 7, 'f')
i.ground(82, 96, top=10); i.plat(85, 87, 7); i.put(86, 6, '*'); i.put(91, 6, 'S'); i.plat(89, 89, 9, '^')
i.ground(97, 117); i.put(100, 10, 'L'); i.put(106, 11, 'g'); i.put(113, 11, 'E')
levels.append(('cathedral', 'cathedral-1', 'level13', ['hintMover'], i))

# 14 — Zvonica
j = L(120)
j.ground(0, 16); j.put(1, 11, 'P'); j.put(8, 11, 'f'); j.put(12, 9, 'r')
j.put(17, 12, 'V')
j.ground(19, 26, top=8); j.put(21, 7, 'L'); j.put(25, 4, 's')
j.put(27, 8, 'H'); j.put(34, 8, 'H'); j.many([(30, 5), (37, 5)], 'f')
j.ground(40, 46, top=8); j.put(44, 4, 'r')
j.put(47, 12, 'V')
j.ground(49, 64); j.put(55, 6, 'S'); j.put(52, 9, 'r'); j.put(58, 11, 'g'); j.put(61, 10, 'L'); j.plat(63, 64, 11, '^')
j.plat(66, 67, 11, 'c'); j.plat(70, 71, 11, 'c')
j.ground(73, 84); j.put(79, 11, 'g'); j.put(76, 11, 'f')
j.put(85, 12, 'V'); j.put(87, 8, 'H'); j.put(90, 5, 'f')
j.ground(93, 100, top=8); j.plat(96, 98, 5); j.put(97, 4, '*'); j.put(99, 3, 's')
j.put(101, 8, 'H'); j.put(104, 5, 'f')
j.ground(107, 119, top=8); j.put(109, 7, 'L'); j.put(115, 7, 'E')
levels.append(('cathedral', 'cathedral-2', 'level14', [], j))

# 15 — Krypta pod oltárom
k = L(130)
k.ground(0, 12); k.put(1, 11, 'P'); k.put(8, 11, 'f')
k.put(13, 12, 'V')
k.ground(15, 22, top=8); k.put(20, 4, 's'); k.put(18, 7, 'f')
k.plat(23, 24, 8, 'c'); k.plat(27, 28, 8, 'c'); k.many([(23, 7)], 'f')
k.ground(30, 35, top=8); k.put(32, 7, 'L')
k.put(36, 8, 'H'); k.put(43, 8, 'H'); k.put(50, 8, 'H'); k.many([(39, 5), (53, 5)], 'f'); k.put(47, 2, 'r')
k.ground(56, 62, top=8); k.plat(59, 60, 7, '^')
k.put(63, 12, 'V')
k.ground(65, 82); k.ground(66, 80, top=5, bottom=7)
k.many([(67, 8), (69, 8), (71, 8), (73, 8), (75, 8), (77, 8), (79, 8)], 'v'); k.put(74, 11, 'g'); k.put(68, 11, 'f')
k.put(83, 12, 'H'); k.put(90, 12, 'H'); k.many([(86, 9), (93, 9)], 'f')
k.ground(96, 102); k.put(99, 10, 'L')
k.put(103, 12, 'V')
k.ground(105, 112, top=8); k.plat(108, 110, 5); k.put(109, 4, '*'); k.put(111, 3, 'S')
k.put(113, 8, 'H'); k.put(116, 5, 'f')
k.ground(119, 129, top=8); k.put(124, 7, 'g'); k.put(127, 7, 'E')
levels.append(('cathedral', 'cathedral-3', 'level15', [], k))

# 16 — Hranica (finále)
q = L(140)
q.ground(0, 14); q.put(1, 11, 'P'); q.put(10, 4, 'S'); q.put(7, 11, 'f')
q.put(15, 12, 'V')
q.ground(17, 24, top=8); q.put(21, 4, 's'); q.put(19, 7, 'f')
q.put(25, 8, 'H')
q.ground(31, 40, top=8); q.put(34, 7, 'L'); q.put(38, 7, 'g')
q.plat(41, 42, 8, 'c'); q.plat(45, 46, 8, 'c'); q.many([(41, 7), (45, 7)], 'f')
q.ground(48, 54, top=8); q.put(51, 3, 'S')
q.plat(56, 58, 10, 'c')
q.ground(60, 76); q.plat(64, 65, 11, '^'); q.many([(68, 9), (71, 8)], 'r'); q.put(73, 10, 'L'); q.plat(76, 76, 12, 'b')
q.ground(79, 86, top=7); q.put(83, 2, 'S'); q.put(81, 6, 'f')
q.put(87, 7, 'H')
q.ground(93, 100, top=7); q.put(96, 6, 'L')
q.ground(101, 139); q.plat(104, 110, 12, 'i'); q.ground(112, 124, top=5, bottom=7)
q.many([(113, 8), (116, 8), (119, 8), (122, 8)], 'v'); q.put(108, 6, 'S'); q.put(118, 11, 'g'); q.put(127, 6, 's')
q.put(126, 7, 'r'); q.plat(128, 130, 9, '-'); q.put(129, 8, '*'); q.put(106, 11, 'f'); q.put(135, 11, 'E')
levels.append(('cathedral', 'cathedral-4', 'level16', [], q))


# ===== Druhá polovica každého levelu: ťažšie úseky skladané z blokov =====
# Každý level sa za pôvodnou (ručne navrhnutou) časťou predĺži zhruba na dvojnásobok.
# Bloky sú navrhnuté v medziach skoku (najviac 4 políčka do diaľky, 3 do výšky);
# obťažnosť stúpa so svetom a levelom. Náhoda je pevne zasiata podľa id levelu.

WORLD_BLOCKS = {
    'quarter': ['pit', 'spikes', 'step', 'planks', 'ghouls', 'bounce', 'ledges', 'wraiths',
                'barricade', 'sneak', 'rats'],
    'catacombs': ['water', 'spikes', 'planks', 'ghouls', 'debris', 'slick', 'rats', 'ledges',
                  'wraiths', 'barricade', 'fog', 'fog'],
    'pits': ['pit', 'water', 'spikes', 'planks', 'ghouls', 'bounce', 'step', 'wraiths', 'great',
             'fog', 'barricade', 'rats'],
    'cathedral': ['movers', 'lift', 'debris', 'ghouls', 'planks', 'ledges', 'spikes', 'great',
                  'pit', 'barricade', 'fog', 'sneak', 'rats'],
}

# Nové prvky Miasmy sa predstavia s tabuľou na začiatku druhej polovice levelu.
INTRO = {
    'quarter-1': ('barricade', 'hintBarricade'),
    'quarter-2': ('sneak', 'hintShield'),
    'catacombs-1': ('fog', 'hintMiasma'),
}


class Gen:
    def __init__(s, lv, x, y, rng, world, diff):
        s.lv, s.x, s.y, s.rng, s.world, s.diff = lv, x, y, rng, world, diff
        s.since_ember = 0

    def free(s, x, row):
        return 0 <= row < H and 0 <= x < s.lv.w and s.lv.g[row][x] == ' '

    def put(s, x, row, ch):
        if s.free(x, row):
            s.lv.g[row][x] = ch
            return True
        return False

    def flat(s, n, ember=True, rock=True):
        s.lv.ground(s.x, s.x + n - 1, top=s.y)
        if ember:
            # Uhlíky čím ďalej, tým redšie.
            # Vo vetre a pri visiacich plošinách sa čaká, preto je tam uhlíkov viac.
            gap = {'pits': 7, 'cathedral': 13}.get(s.world, 20) + s.diff // 2
            for i in range(n):
                s.since_ember += 1
                if s.since_ember >= gap and s.put(s.x + i, s.y - 1, 'f'):
                    s.since_ember = 0
        if rock and s.world == 'pits' and n >= 5 and s.rng.random() < 0.35:
            # Náhrobok: závetrie pred vetrom.
            s.put(s.x + n // 2, s.y - 1, '#')
        s.x += n

    def gap_ember(s, x, row):
        if s.put(x, row, 'f'):
            s.since_ember = 0

    def block(s, kind):
        r = s.rng
        d = s.diff
        if kind == 'pit' or kind == 'water':
            w = 3 if d < 6 else r.choice([3, 4])
            if kind == 'water':
                s.lv.water(s.x, s.x + w - 1, top=s.y)
            s.x += w
            s.flat(4)
        elif kind == 'spikes':
            s.flat(3)
            w = 2 if d < 8 else r.choice([2, 3])
            s.lv.ground(s.x, s.x + w - 1, top=s.y)
            s.lv.plat(s.x, s.x + w - 1, s.y - 1, '^')
            s.x += w
            s.flat(4)
        elif kind == 'step':
            dy = r.choice([-2, 2, -3, 3]) if d >= 4 else r.choice([-2, 2])
            ny = min(12, max(6, s.y + dy))
            s.y = ny
            s.flat(r.randint(4, 7))
        elif kind == 'planks':
            # Vo vetre len krátke mostíky (dosky sa prelomia skôr, než vietor utíchne).
            n = 2 if s.world == 'pits' else 2 + d // 5 + r.randint(0, 1)
            x0 = s.x
            s.x += 2
            for k in range(n):
                s.lv.plat(s.x, s.x + 1, s.y, 'c')
                if k % 2 == 0:
                    s.gap_ember(s.x, s.y - 2)
                s.x += 4
            s.x -= 2
            s.lv.water(x0, s.x - 1, top=min(H - 1, s.y + 2))
            for x in range(x0, s.x):
                if s.lv.g[s.y][x] == 'c':
                    for row in range(s.y + 1, s.y + 2):
                        s.lv.g[row][x] = ' '
            s.flat(4)
        elif kind == 'ghouls':
            n = 10 + r.randint(0, 4)
            low = d >= 5 and s.y - 5 >= 1 and r.random() < 0.6
            x0 = s.x
            s.flat(n)
            if low:
                # Nízky strop: nakazeného treba preskočiť tesne.
                s.lv.ground(x0 + 2, x0 + n - 3, top=s.y - 6, bottom=s.y - 5)
            count = 1 if d < 6 else 2
            for k in range(count):
                s.put(x0 + n - 3 - k * 4, s.y - 1, 'g')
        elif kind == 'bounce':
            if s.y - 5 < 3:
                return s.block('spikes')
            s.flat(1)
            s.lv.ground(s.x, s.x + 3, top=s.y)
            s.lv.plat(s.x + 1, s.x + 1, s.y, 'b')
            s.x += 4
            s.y -= 5
            s.flat(r.randint(5, 8))
            if r.random() < 0.5:
                s.put(s.x - 3, s.y - 4, 's')
            while s.y < 10:
                s.y += 2
                s.flat(r.randint(3, 5))
        elif kind == 'ledges':
            if s.y - 6 < 3:
                return s.block('pit')
            s.flat(2)
            s.lv.plat(s.x + 1, s.x + 3, s.y - 3)
            s.gap_ember(s.x + 2, s.y - 4)
            s.lv.plat(s.x + 5, s.x + 7, s.y - 6)
            s.x += 9
            s.y -= 6
            s.flat(r.randint(4, 6))
            s.y += 3
            s.flat(3)
            s.y += 3
            s.flat(3)
        elif kind == 'debris':
            if s.y - 7 < 0:
                return s.block('spikes')
            n = 8 + r.randint(0, 4) + d // 4
            x0 = s.x
            s.flat(n)
            s.lv.ground(x0, x0 + n - 1, top=max(0, s.y - 8), bottom=s.y - 6)
            for x in range(x0 + 1, x0 + n - 1, 2):
                s.put(x, s.y - 5, 'v')
        elif kind == 'slick':
            n = 6 + r.randint(0, 4)
            x0 = s.x
            s.flat(n)
            s.lv.plat(x0, x0 + n - 1, s.y, 'i')
            s.flat(2)
        elif kind == 'rats':
            # Kŕdeľ potkanov: kým svietiš, držia sa na okraji svetla.
            x0 = s.x
            s.flat(8)
            s.put(x0 + 4, s.y - 1, 'r')
            if d >= 7:
                s.put(x0 + 7, s.y - 1, 'r')
        elif kind == 'wraiths':
            x0 = s.x
            s.flat(9)
            s.put(x0 + 4, s.y - 5, 's')
            if d >= 6:
                s.put(x0 + 8, s.y - 3, 's')
        elif kind == 'great':
            x0 = s.x
            s.flat(10)
            s.put(x0 + 5, s.y - 5, 'S')
        elif kind == 'barricade':
            # Zabednená ulička: vyššia, než sa dá preskočiť; treba ju podpáliť.
            s.flat(4)
            w = 1 if d < 6 else 2
            top = max(0, s.y - 8)
            s.lv.ground(s.x, s.x + w - 1, top=s.y)
            for x in range(s.x, s.x + w):
                for row in range(top, s.y):
                    s.lv.g[row][x] = 'x'
            s.x += w
            x0 = s.x
            s.flat(6)
            if d >= 4 and r.random() < 0.5:
                s.put(x0 + 4, s.y - 1, 'g')
        elif kind == 'fog':
            # Oblak miazmy nad zemou; v ťažších leveloch za ním byliny.
            n = 6 + d // 3
            x0 = s.x
            s.flat(n, rock=False)
            for x in range(x0, x0 + n):
                for row in range(max(0, s.y - 3), s.y):
                    if s.lv.g[row][x] in ' f':
                        s.lv.g[row][x] = '~' if s.lv.g[row][x] == ' ' else 'f'
            s.flat(3, ember=False, rock=False)
            if n >= 8:
                s.put(s.x - 2, s.y - 1, 'h')
        elif kind == 'sneak':
            # Chodba s nízkym stropom a tromi nakazenými: s ukrytou fakľou idú pomaly.
            if s.y - 5 < 1:
                return s.block('ghouls')
            n = 18
            x0 = s.x
            s.flat(n, rock=False)
            s.lv.ground(x0 + 2, x0 + n - 3, top=max(0, s.y - 6), bottom=s.y - 5)
            for dx in (6, 11, 15):
                s.put(x0 + dx, s.y - 1, 'g')
        elif kind == 'movers':
            if s.y > 12:
                return s.block('pit')
            s.put(s.x, s.y, 'H')
            s.gap_ember(s.x + 3, s.y - 1)
            if d >= 13 and r.random() < 0.6:
                s.put(s.x + 7, s.y, 'H')
                s.gap_ember(s.x + 10, s.y - 1)
                s.x += 13
            else:
                s.x += 6
            s.flat(4)
        elif kind == 'lift':
            if s.y - 4 < 4:
                return s.block('movers')
            s.put(s.x, s.y, 'V')
            s.gap_ember(s.x - 1, s.y - 2)
            s.x += 2
            s.y -= 4
            s.flat(r.randint(5, 7))
            while s.y < 10:
                s.y += 2
                s.flat(3)


def sprinkle(lv, x0, x1, every):
    """Doplní uhlíky nad rovnú zem (kde je voľno) zhruba každých `every` stĺpcov."""
    last = x0
    for x in range(x0, x1):
        if x - last < every:
            continue
        for row in range(1, H):
            if lv.g[row][x] == '#' and lv.g[row - 1][x] == ' ' and (row < 2 or lv.g[row - 2][x] == ' '):
                lv.g[row - 1][x] = 'f'
                last = x
                break


def extend(lv, world, id_, diff, extra, hints):
    """Predĺži level o `extra` stĺpcov: pôvodná vatra zmizne, nová je na konci."""
    ex = None
    for row in range(H):
        for x in range(lv.w):
            if lv.g[row][x] == 'E':
                ex = (x, row)
                lv.g[row][x] = ' '
    y = ex[1] + 1
    width = lv.w + extra + 40
    for r in lv.g:
        r.extend([' '] * (width - lv.w))
    old = lv.w
    lv.w = width
    if world == 'pits':
        sprinkle(lv, 4, old - 4, 8)
    rng = random.Random(sum(ord(c) * (i + 1) for i, c in enumerate(id_)))
    g = Gen(lv, old, y, rng, world, diff)
    g.flat(4)
    if id_ in INTRO:
        kind, hint = INTRO[id_]
        hints.append(hint)
        g.put(g.x - 2, g.y - 1, str(len(hints)))
        g.block(kind)
        g.flat(3)
    pool = WORLD_BLOCKS[world]
    # Na cintoríne sa čaká na vietor, preto dve kaplnky; inde jedna v polovici.
    shrines = [old + extra // 3, old + 2 * extra // 3] if world == 'pits' else [old + extra // 2]
    last = None
    while g.x < old + extra:
        kind = rng.choice([k for k in pool if k != last])
        last = kind
        g.block(kind)
        g.flat(rng.randint(2, 4))
        if shrines and g.x >= shrines[0]:
            shrines.pop(0)
            g.flat(2)
            g.put(g.x - 1, g.y - 1, 'L')
            g.flat(3)
    g.flat(6, ember=False, rock=False)
    assert g.put(g.x - 3, g.y - 1, 'E'), id_
    lv.w = g.x
    for r in lv.g:
        del r[lv.w:]
    if world == 'catacombs':
        lv.ceiling(old, lv.w - 1)


for i, (world, id_, name, hints, lv) in enumerate(levels):
    if hints is None:
        hints = []
    levels[i] = (world, id_, name, hints, lv)
    extend(lv, world, id_, i, lv.w, hints)


out = [
    "import type { LevelDef } from './level';",
    '',
    '/** Štyri svety po štyroch leveloch. Generuje scripts/build_levels.py; legenda znakov je v level.ts. */',
    'export const LEVELS: LevelDef[] = [',
]
for world, id_, name, hints, lv in levels:
    out.append('  {')
    out.append(f"    id: '{id_}',")
    out.append(f"    world: '{world}',")
    out.append(f"    name: '{name}',")
    if hints:
        out.append('    hints: [' + ', '.join(f"'{h}'" for h in hints) + '],')
    out.append('    rows: [')
    for r in lv.rows():
        out.append(f"      '{r}',")
    out.append('    ],')
    out.append('  },')
out.append('];')
target = Path(__file__).resolve().parent.parent / 'src' / 'game' / 'levels.ts'
target.write_text('\n'.join(out) + '\n')
print(f'{len(levels)} levelov → {target}')
