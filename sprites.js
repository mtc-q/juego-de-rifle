'use strict';
// ============ SPRITES: pixel art dibujado a mano ============

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Paleta global (Sweetie-16 extendida)
const PAL = {
  ink: '#1a1c2c', purple: '#5d275d', red: '#b13e53', orange: '#ef7d57',
  yellow: '#ffcd75', lime: '#a7f070', green: '#38b764', dgreen: '#257179',
  navy: '#29366f', blue: '#3b5dc9', skyblue: '#41a6f6', cyan: '#73eff7',
  white: '#f4f4f4', lgray: '#94b0c2', gray: '#566c86', dgray: '#333c57',
  brown: '#7a4841', dbrown: '#4e2b23', tan: '#c98f5f', sand: '#e8c170',
  dsand: '#b8863e', skin: '#eeb98a', dskin: '#d68e5e', cream: '#f7e3c0',
  blood: '#8c2333', pink: '#e8a5b2', gold: '#f5b921', dgold: '#c1852a',
  snow: '#e9f4fa', ice: '#a8d8e8', dice: '#6fa8c8', fur: '#9b6a4f',
  black: '#0f0f1b', olive: '#6b7f3f', dolive: '#485c2b', khaki: '#c2b280',
};

const SPR = {};

function _padRows(rows) {
  const w = Math.max(...rows.map(r => r.length));
  return rows.map(r => r.padEnd(w, '.'));
}

function _canvasFrom(rows, pal) {
  rows = _padRows(rows);
  const w = rows[0].length, h = rows.length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const col = pal[rows[y][x]];
    if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  }
  return c;
}

function _flip(c) {
  const f = document.createElement('canvas');
  f.width = c.width; f.height = c.height;
  const g = f.getContext('2d');
  g.translate(c.width, 0); g.scale(-1, 1);
  g.drawImage(c, 0, 0);
  return f;
}

function _flipV(c) {
  const f = document.createElement('canvas');
  f.width = c.width; f.height = c.height;
  const g = f.getContext('2d');
  g.translate(0, c.height); g.scale(1, -1);
  g.drawImage(c, 0, 0);
  return f;
}

function defSprite(name, pal, ...framesRows) {
  const frames = framesRows.map(rows => _canvasFrom(rows, pal));
  SPR[name] = {
    frames,
    flip: frames.map(_flip),
    flipV: frames.map(_flipV),
    w: frames[0].width, h: frames[0].height,
  };
}

function drawSpr(g, name, frame, x, y, flip, scale) {
  const s = SPR[name];
  if (!s) return;
  const f = frame % s.frames.length;
  const img = flip ? s.flip[f] : s.frames[f];
  x = Math.round(x); y = Math.round(y);
  if (scale && scale !== 1) g.drawImage(img, x, y, Math.round(s.w * scale), Math.round(s.h * scale));
  else g.drawImage(img, x, y);
}

function drawSprV(g, name, frame, x, y, flip) {
  const s = SPR[name];
  if (!s) return;
  const f = frame % s.frames.length;
  const img = s.flipV[f];
  g.save();
  if (flip) { g.translate(Math.round(x) + s.w, 0); g.scale(-1, 1); g.drawImage(img, 0, Math.round(y)); }
  else g.drawImage(img, Math.round(x), Math.round(y));
  g.restore();
}

// ============ PERSONAJES (24x18, mirando a la derecha, rifle incluido) ============
// La punta del rifle está en (23,8) — de ahí salen las balas.
const MUZZLE = { x: 23, y: 8 };

const _CHAR_BODY = [
  '.......ssssssss.........', // 3 cara
  '.......sssKssKs.........', // 4 ojos
  '.......ssssssss.........', // 5
  '........dsssss..........', // 6 barbilla
  '.......cccccccc.........', // 7 hombros
  '......ccccccccaGGGGGGGG.', // 8 brazo + cañón
  '......ccccccccWWWG......', // 9 culata
  '......cccccccWW.........', // 10
  '......pppppppp..........', // 11
  '......pppppppp..........', // 12
];
const _LEGS = {
  idle: [
    '......ppp..ppp..........',
    '......ppp..ppp..........',
    '......ppp..ppp..........',
    '......bbb..bbb..........',
    '......bbb..bbb..........',
  ],
  walk1: [
    '......ppp..ppp..........',
    '.....ppp....ppp.........',
    '.....ppp....ppp.........',
    '....bbb......bbb........',
    '....bbb......bbb........',
  ],
  walk2: [
    '......ppp.ppp...........',
    '......ppppppp...........',
    '.......ppppp............',
    '.......bbbb.............',
    '.......bbbb.............',
  ],
  jump: [
    '......ppp..ppp..........',
    '......ppp..ppp..........',
    '......bbb..bbb..........',
    '......bbb..bbb..........',
    '........................',
  ],
};

function defChar(id, hatRows, pal) {
  const mk = legs => hatRows.concat(_CHAR_BODY, _LEGS[legs]);
  defSprite('char_' + id, pal, mk('idle'), mk('walk1'), mk('walk2'), mk('jump'));
}

// Cazador — gorra verde clásica
defChar('cazador', [
  '........hhhhhhh.........',
  '.......hhhhhhhhhh.......',
  '.......hhhhhhhh.........',
], { s: PAL.skin, d: PAL.dskin, K: PAL.ink, c: PAL.green, p: PAL.brown, b: PAL.dbrown, G: PAL.dgray, W: PAL.brown, a: PAL.dskin, h: PAL.dgreen });

// Exploradora — cabello naranja con coleta
defChar('exploradora', [
  '........kkkkkkk.........',
  '.....kk.kkkkkkkk........',
  '....kkk.kkkkkkkk........',
], { s: PAL.skin, d: PAL.dskin, K: PAL.ink, c: PAL.orange, p: PAL.khaki, b: PAL.brown, G: PAL.dgray, W: PAL.brown, a: PAL.dskin, k: PAL.red, h: PAL.red });

// Tanque — casco de metal, uniforme militar
defChar('tanque', [
  '.......iiiiiiiii........',
  '......iiiiiiiiiii.......',
  '......ii.......ii.......',
], { s: PAL.dskin, d: PAL.brown, K: PAL.ink, c: PAL.olive, p: PAL.dolive, b: PAL.black, G: PAL.dgray, W: PAL.dbrown, a: PAL.brown, i: PAL.gray, h: PAL.gray });

// Francotirador — sombrero boonie y bufanda
defChar('francotirador', [
  '........hhhhhh..........',
  '......hhhhhhhhhh........',
  '.....hhhhhhhhhhhh.......',
], { s: PAL.skin, d: PAL.dskin, K: PAL.ink, c: PAL.navy, p: PAL.dgray, b: PAL.black, G: PAL.dgray, W: PAL.dbrown, a: PAL.dskin, h: PAL.dolive });

// Trampero — gorro de piel con orejeras
defChar('trampero', [
  '.......iihhhhii.........',
  '......ihhhhhhhhi........',
  '......ihhhhhhhhi........',
], { s: PAL.skin, d: PAL.dskin, K: PAL.ink, c: PAL.tan, p: PAL.brown, b: PAL.dbrown, G: PAL.dgray, W: PAL.brown, a: PAL.dskin, h: PAL.fur, i: PAL.cream });

// ============ ANIMALES (mirando a la derecha) ============

// VENADO 22x14 — bosque
defSprite('venado', { a: PAL.dbrown, h: PAL.tan, K: PAL.ink, c: PAL.tan, w: PAL.cream, d: PAL.dbrown, n: PAL.ink },
  [
    '..............a...a...',
    '..........a...a..a....',
    '..........aa..aaa.....',
    '...........aaaa.......',
    '...........hhhh.......',
    '...........hKhn.......',
    '....ccccccchhh........',
    '...ccccccccch.........',
    '..wcccccccccc.........',
    '..wccccccccc..........',
    '...cc......cc.........',
    '...cc......cc.........',
    '...cc......cc.........',
    '...dd......dd.........',
  ],
  [
    '..............a...a...',
    '..........a...a..a....',
    '..........aa..aaa.....',
    '...........aaaa.......',
    '...........hhhh.......',
    '...........hKhn.......',
    '....ccccccchhh........',
    '...ccccccccch.........',
    '..wcccccccccc.........',
    '..wccccccccc..........',
    '..cc........cc........',
    '..cc........cc........',
    '.cc..........cc.......',
    '.dd..........dd.......',
  ]);

// CONEJO 12x10
defSprite('conejo', { e: PAL.cream, h: PAL.cream, K: PAL.ink, c: PAL.cream, w: PAL.white, d: PAL.pink },
  [
    '..e...e.....',
    '..e...e.....',
    '..hhhhh.....',
    '..hhKhh.....',
    'cchhhhh.....',
    'ccccccc.....',
    'wcccccc.....',
    'wcccccc.....',
    '.cc..cc.....',
    '.dd..dd.....',
  ],
  [
    '..e...e.....',
    '..e...e.....',
    '..hhhhh.....',
    '..hhKhh.....',
    'cchhhhh.....',
    'ccccccc.....',
    'wcccccc.....',
    'wcccccc.....',
    'cc....cc....',
    'dd....dd....',
  ]);

// JABALÍ 18x11
defSprite('jabali', { c: PAL.dbrown, h: PAL.dbrown, K: PAL.red, t: PAL.cream, d: PAL.black, m: PAL.brown },
  [
    '.....mmmm.........',
    '...mmmmmmmm.......',
    '..ccccccccccchh...',
    '.cccccccccccchhh..',
    '.ccccccccccccKhh..',
    '.cccccccccccchht..',
    '.ccccccccccccht...',
    '.cccccccccccc.....',
    '..cc......cc......',
    '..cc......cc......',
    '..dd......dd......',
  ],
  [
    '.....mmmm.........',
    '...mmmmmmmm.......',
    '..ccccccccccchh...',
    '.cccccccccccchhh..',
    '.ccccccccccccKhh..',
    '.cccccccccccchht..',
    '.ccccccccccccht...',
    '.cccccccccccc.....',
    '.cc........cc.....',
    'cc..........cc....',
    'dd..........dd....',
  ]);

// OSO 22x16 (y OSO POLAR con paleta blanca)
const _BEAR_ROWS = [
  [
    '..............ee.ee...',
    '.............hhhhhh...',
    '.............hhKhhh...',
    '....ccccccccchhhhnn...',
    '...cccccccccchhhn.....',
    '..cccccccccccchh......',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..ccc.....cccc........',
    '..ccc.....cccc........',
    '..ccc.....cccc........',
    '..ddd.....dddd........',
    '..ddd.....dddd........',
  ],
  [
    '..............ee.ee...',
    '.............hhhhhh...',
    '.............hhKhhh...',
    '....ccccccccchhhhnn...',
    '...cccccccccchhhn.....',
    '..cccccccccccchh......',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..ccc......ccc........',
    '.ccc........ccc.......',
    '.ccc........ccc.......',
    '.ddd........ddd.......',
    'ddd..........ddd......',
  ],
];
defSprite('oso', { e: PAL.brown, h: PAL.brown, K: PAL.ink, c: PAL.brown, d: PAL.dbrown, n: PAL.ink }, ..._BEAR_ROWS);
defSprite('osopolar', { e: PAL.snow, h: PAL.snow, K: PAL.ink, c: PAL.snow, d: PAL.ice, n: PAL.ink }, ..._BEAR_ROWS);

// MONO 14x13 — jungla (lanza cocos)
defSprite('mono', { h: PAL.fur, K: PAL.ink, f: PAL.cream, c: PAL.fur, t: PAL.fur, n: PAL.dbrown, o: PAL.dbrown },
  [
    '....hhhh......',
    '...hhffff.....',
    '...hhfKfK.....',
    '...hhffff.....',
    '..t.hfff......',
    '.tt.cccc.oo...',
    '.t.ccccccooo..',
    '.t.cccccc.oo..',
    '.ttcccccc.....',
    '..tccccc......',
    '...cc.cc......',
    '...cc.cc......',
    '...nn.nn......',
  ],
  [
    '....hhhh......',
    '...hhffff.....',
    '...hhfKfK.....',
    '...hhffff.....',
    '..t.hfffoo....',
    '.tt.ccccooo...',
    '.t.cccccc.o...',
    '.t.cccccc.....',
    '.ttcccccc.....',
    '..tccccc......',
    '..cc...cc.....',
    '..cc...cc.....',
    '..nn...nn.....',
  ]);

// TUCÁN 16x12 — volador jungla
defSprite('tucan', { b: PAL.black, w: PAL.white, o: PAL.orange, y: PAL.yellow, K: PAL.white, d: PAL.dgray },
  [
    '......bbb.......',
    '.....bbbbb......',
    '.....bbKbboooo..',
    '.bbbbbbbbbooooo.',
    'bbbbbbbbwwoooo..',
    'bbbbbbbbww......',
    '.bbbbbbbww......',
    '..bbbbbbw.......',
    '...bbbbb........',
    '....yy..........',
    '....yy..........',
    '................',
  ],
  [
    '......bbb.......',
    '.....bbbbb......',
    '.....bbKbboooo..',
    '.bbbbbbbbbooooo.',
    'dbbbbbbbwwoooo..',
    'ddbbbbbbww......',
    'dddbbbbww.......',
    '..dddbbw........',
    '....ddd.........',
    '....yy..........',
    '....yy..........',
    '................',
  ]);

// SERPIENTE 22x7 — jungla
defSprite('serpiente', { g: PAL.green, d: PAL.dgreen, K: PAL.red, t: PAL.red, y: PAL.yellow },
  [
    '..................gg..',
    '.................gggg.',
    '.gggg....gggg....gKgg.',
    'gggggg..gggggg..gggg.t',
    'ggydgggggydggggggggg.t',
    '.ggddggggggddgggggg...',
    '..gggg....gggg........',
  ],
  [
    '..................gg..',
    '.................gggg.',
    'g.gggg....gggg...gKgg.',
    'gggggg..gggggg..gggg.t',
    '.gydgggggydgggggggggt.',
    '..ddggggggddggggggg...',
    '...gg......gg.........',
  ]);

// JAGUAR 22x13 — jungla (y PANTERA para el boss via paleta)
const _JAG_ROWS = [
  [
    '..................ee..',
    '.............hhhhhhh..',
    '.............hhKhhh...',
    '....ccccccccchhhhnn...',
    '...ccocccoccchhh......',
    '..cccccoccccoch.......',
    '..cocccccoccccc.......',
    '..ccccoccccocc........',
    '..cccccccccccc........',
    '..ccc.....ccc.........',
    '..ccc.....ccc.........',
    '..ccc.....ccc.........',
    '..ddd.....ddd.........',
  ],
  [
    '..................ee..',
    '.............hhhhhhh..',
    '.............hhKhhh...',
    '....ccccccccchhhhnn...',
    '...ccocccoccchhh......',
    '..cccccoccccoch.......',
    '..cocccccoccccc.......',
    '..ccccoccccocc........',
    '..cccccccccccc........',
    '..cc.......cc.........',
    '.cc.........cc........',
    '.cc.........cc........',
    '.dd.........dd........',
  ],
];
defSprite('jaguar', { e: PAL.yellow, h: PAL.yellow, K: PAL.ink, c: PAL.yellow, o: PAL.dbrown, d: PAL.dsand, n: PAL.ink }, ..._JAG_ROWS);

// ESCORPIÓN 18x12 — desierto
defSprite('escorpion', { c: PAL.dsand, d: PAL.brown, K: PAL.red, s: PAL.red, p: PAL.brown },
  [
    '.......ss.........',
    '......sss.........',
    '......dd..........',
    '......dd..........',
    '.....ddd......pp..',
    '....ddd.....ppp...',
    '..ccccccccccpp....',
    '.cccccccccccpp....',
    '.ccccccccccKc.....',
    '..cccccccccc......',
    '..d.d.d..d.d.d....',
    '..d.d.d..d.d.d....',
  ],
  [
    '.......ss.........',
    '......sss.........',
    '......dd..........',
    '......dd..........',
    '.....ddd......pp..',
    '....ddd.....ppp...',
    '..ccccccccccpp....',
    '.cccccccccccpp....',
    '.ccccccccccKc.....',
    '..cccccccccc......',
    '.d.d.d....d.d.d...',
    '.d.d.d....d.d.d...',
  ]);

// BUITRE 16x12 — volador desierto
defSprite('buitre', { b: PAL.dbrown, w: PAL.brown, p: PAL.pink, K: PAL.ink, o: PAL.dsand },
  [
    '.....bbb........',
    '....bbbbb.......',
    '....bbbbb..pp...',
    '.bbbbbbbbbbppK..',
    'bbbbbbbbbbbpoo..',
    'bbbbbbbbbbb.....',
    '.bbbbbbbbb......',
    '..bbbbbbb.......',
    '...bbbbb........',
    '....ww..........',
    '................',
    '................',
  ],
  [
    '................',
    '................',
    '...........pp...',
    '.bbbbbbbbbbppK..',
    'bbbbbbbbbbbpoo..',
    'bbbbbbbbbbb.....',
    '.bbbbbbbbbb.....',
    '..bbbbbbbb......',
    '...bbbbbb.......',
    '....bbbb........',
    '.....ww.........',
    '................',
  ]);

// COYOTE 20x12 (LOBO y HIENA con paletas distintas; 'm' = lomo/manchas)
const _COYOTE_ROWS = [
  [
    '................ee..',
    '...........hhhhhh...',
    '...........hhKhhh...',
    '..mmmmmmmmmhhhhnn...',
    '.mmmmmmmmmmmhhh.....',
    'tcccccccccccch......',
    'ttcccccccccccc......',
    '.tccccccccccc.......',
    '..ccc.....ccc.......',
    '..ccc.....ccc.......',
    '..ccc.....ccc.......',
    '..ddd.....ddd.......',
  ],
  [
    '................ee..',
    '...........hhhhhh...',
    '...........hhKhhh...',
    '..mmmmmmmmmhhhhnn...',
    '.mmmmmmmmmmmhhh.....',
    'tcccccccccccch......',
    'ttcccccccccccc......',
    '.tccccccccccc.......',
    '..cc.......cc.......',
    '.cc.........cc......',
    '.cc.........cc......',
    '.dd.........dd......',
  ],
];
defSprite('coyote', { e: PAL.tan, h: PAL.tan, K: PAL.ink, c: PAL.tan, m: PAL.brown, t: PAL.brown, d: PAL.dbrown, n: PAL.ink }, ..._COYOTE_ROWS);
defSprite('lobo', { e: PAL.lgray, h: PAL.lgray, K: PAL.skyblue, c: PAL.lgray, m: PAL.gray, t: PAL.gray, d: PAL.dgray, n: PAL.ink }, ..._COYOTE_ROWS);
defSprite('hiena', { e: PAL.khaki, h: PAL.khaki, K: PAL.ink, c: PAL.khaki, m: PAL.dbrown, t: PAL.dbrown, d: PAL.dbrown, n: PAL.ink }, ..._COYOTE_ROWS);

// LAGARTO 16x8 — desierto
defSprite('lagarto', { g: PAL.olive, d: PAL.dolive, K: PAL.ink, t: PAL.olive },
  [
    '............gg..',
    '...........gggg',
    '.tt.ggggggggKgg.',
    'ttggggggggggg...',
    't.gggggggggg....',
    '..gg..gg..gg....',
    '.gg....gg..gg...',
    '................',
  ],
  [
    '............gg..',
    '...........gggg',
    'tt..ggggggggKgg.',
    '.ttgggggggggg...',
    't.gggggggggg....',
    '..gg...gg.gg....',
    '..gg..gg...gg...',
    '................',
  ]);

// GACELA 20x14 — sabana (cuernos curvos)
defSprite('gacela2', { a: PAL.dbrown, h: PAL.sand, K: PAL.ink, c: PAL.sand, w: PAL.cream, d: PAL.dsand, n: PAL.ink },
  [
    '.............a..a...',
    '............a..a....',
    '............aa.a....',
    '.............aaa....',
    '.............hhh....',
    '.............hKn....',
    '....ccccccccchh.....',
    '...ccccccccch.......',
    '..wccccccccc........',
    '..wcccccccc.........',
    '...cc.....cc........',
    '...cc.....cc........',
    '...cc.....cc........',
    '...dd.....dd........',
  ],
  [
    '.............a..a...',
    '............a..a....',
    '............aa.a....',
    '.............aaa....',
    '.............hhh....',
    '.............hKn....',
    '....ccccccccchh.....',
    '...ccccccccch.......',
    '..wccccccccc........',
    '..wcccccccc.........',
    '..cc.......cc.......',
    '..cc.......cc.......',
    '.cc.........cc......',
    '.dd.........dd......',
  ]);

// CEBRA 20x14 — sabana
defSprite('cebra', { w: PAL.white, k: PAL.black, K: PAL.ink, m: PAL.black, d: PAL.dgray, n: PAL.ink },
  [
    '...............mm...',
    '.............wwww...',
    '.............wKwn...',
    '..mkwkwkwkwkwwww....',
    '.mwkwkwkwkwkww......',
    '.wkwkwkwkwkwkw......',
    '.wwkwkwkwkwkww......',
    '.wkwkwkwkwkwkw......',
    '.wwwwwwwwwwwww......',
    '..ww......ww........',
    '..ww......ww........',
    '..ww......ww........',
    '..dd......dd........',
    '....................',
  ],
  [
    '...............mm...',
    '.............wwww...',
    '.............wKwn...',
    '..mkwkwkwkwkwwww....',
    '.mwkwkwkwkwkww......',
    '.wkwkwkwkwkwkw......',
    '.wwkwkwkwkwkww......',
    '.wkwkwkwkwkwkw......',
    '.wwwwwwwwwwwww......',
    '.ww........ww.......',
    'ww..........ww......',
    'ww..........ww......',
    'dd..........dd......',
    '....................',
  ]);

// LEÓN 22x14 — sabana
const _LION_ROWS = [
  [
    '.............mmmmm....',
    '............mmmmmmm...',
    '...........mmhhhhmm...',
    '...........mmhKhhnn...',
    '....ccccccmmmhhhmm....',
    '...cccccccmmmmmmm.....',
    '..cccccccccmmmm.......',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    'e.ccc.....ccc.........',
    'eeccc.....ccc.........',
    '.eccc.....ccc.........',
    '..ddd.....ddd.........',
  ],
  [
    '.............mmmmm....',
    '............mmmmmmm...',
    '...........mmhhhhmm...',
    '...........mmhKhhnn...',
    '....ccccccmmmhhhmm....',
    '...cccccccmmmmmmm.....',
    '..cccccccccmmmm.......',
    '..cccccccccccc........',
    '..cccccccccccc........',
    '..cccccccccccc........',
    'e.cc.......cc.........',
    'eecc.......cc.........',
    '.ecc........cc........',
    '..dd........dd........',
  ],
];
defSprite('leon', { m: PAL.dsand, h: PAL.sand, K: PAL.ink, c: PAL.sand, e: PAL.dsand, d: PAL.dbrown, n: PAL.ink }, ..._LION_ROWS);

// PINGÜINO 10x12 — ártico
defSprite('pinguino', { b: PAL.black, w: PAL.white, o: PAL.orange, K: PAL.white },
  [
    '...bbbb...',
    '..bbbbbb..',
    '..bKbbbb..',
    '..bbbboo..',
    '..bwwbb...',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '..bwwbb...',
    '..oo.oo...',
    '..........',
  ],
  [
    '...bbbb...',
    '..bbbbbb..',
    '..bKbbbb..',
    '..bbbboo..',
    '..bwwbb...',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '.bbwwwbb..',
    '..bwwbb...',
    '.oo...oo..',
    '..........',
  ]);

// FOCA 18x9 — ártico
defSprite('foca', { g: PAL.lgray, d: PAL.gray, K: PAL.ink, w: PAL.white },
  [
    '..............gg..',
    '.............gggg.',
    '.............gKgg.',
    '.gg.....gggggggg..',
    'gggg..gggggggggg..',
    'ggggggggggggggg...',
    '.ggggggggggggg....',
    '..ggwwggggggg.....',
    '....dd...dd.......',
  ],
  [
    '..............gg..',
    '.............gggg.',
    '.gg..........gKgg.',
    'gggg....gggggggg..',
    '.ggg..gggggggggg..',
    'ggggggggggggggg...',
    '.ggggggggggggg....',
    '..ggwwggggggg.....',
    '....dd....dd......',
  ]);

// MAMUT 26x20 — boss ártico
defSprite('mamut', { c: PAL.brown, d: PAL.dbrown, K: PAL.red, t: PAL.cream, h: PAL.fur },
  [
    '...................hhh....',
    '..............hhhhhhhhh...',
    '.....hhhhhhhhhhhhhhhhhh...',
    '....hhhhhhhhhhhhhhhKhh....',
    '...hhhhhhhhhhhhhhhhhhh....',
    '..cccccccccccccchhhhhd....',
    '..ccccccccccccccchhhdd....',
    '..cccccccccccccccc.tdd....',
    '..cccccccccccccc.ttddd....',
    '..cccccccccccccc.t.ddd....',
    '..cccccccccccccctt..dd....',
    '..cccccccccccccc....dd....',
    '..cccccccccccccc....dd....',
    '..ccccc....ccccc..........',
    '..ccccc....ccccc..........',
    '..ccccc....ccccc..........',
    '..ccccc....ccccc..........',
    '..ddddd....ddddd..........',
    '..........................',
    '..........................',
  ],
  [
    '...................hhh....',
    '..............hhhhhhhhh...',
    '.....hhhhhhhhhhhhhhhhhh...',
    '....hhhhhhhhhhhhhhhKhh....',
    '...hhhhhhhhhhhhhhhhhhh....',
    '..cccccccccccccchhhhhd....',
    '..ccccccccccccccchhhdd....',
    '..cccccccccccccccc.tdd....',
    '..cccccccccccccc.ttddd....',
    '..cccccccccccccc.t.ddd....',
    '..cccccccccccccctt..dd....',
    '..cccccccccccccc....dd....',
    '..cccccccccccccc....dd....',
    '..cccc......cccc..........',
    '..cccc......cccc..........',
    '.cccc........cccc.........',
    '.cccc........cccc.........',
    '.dddd........dddd.........',
    '..........................',
    '..........................',
  ]);

// Bosses con paleta especial (se dibujan escalados x3)
defSprite('boss_oso', { e: PAL.dbrown, h: PAL.dbrown, K: PAL.red, c: PAL.dbrown, d: PAL.black, n: PAL.red }, ..._BEAR_ROWS);
defSprite('boss_jaguar', { e: PAL.gold, h: PAL.dgray, K: PAL.gold, c: PAL.dgray, o: PAL.black, d: PAL.black, n: PAL.gold }, ..._JAG_ROWS);
defSprite('boss_leon', { m: PAL.dbrown, h: PAL.dsand, K: PAL.red, c: PAL.dsand, e: PAL.dbrown, d: PAL.black, n: PAL.red }, ..._LION_ROWS);
// boss escorpión: reusar filas del escorpión con paleta roja
(function () {
  const rows = [
    [
      '.......ss.........',
      '......sss.........',
      '......dd..........',
      '......dd..........',
      '.....ddd......pp..',
      '....ddd.....ppp...',
      '..ccccccccccpp....',
      '.cccccccccccpp....',
      '.ccccccccccKc.....',
      '..cccccccccc......',
      '..d.d.d..d.d.d....',
      '..d.d.d..d.d.d....',
    ],
    [
      '.......ss.........',
      '......sss.........',
      '......dd..........',
      '......dd..........',
      '.....ddd......pp..',
      '....ddd.....ppp...',
      '..ccccccccccpp....',
      '.cccccccccccpp....',
      '.ccccccccccKc.....',
      '..cccccccccc......',
      '.d.d.d....d.d.d...',
      '.d.d.d....d.d.d...',
    ],
  ];
  defSprite('boss_escorpion', { c: PAL.blood, d: PAL.dbrown, K: PAL.yellow, s: PAL.gold, p: PAL.dbrown }, ...rows);
})();

// ============ OBJETOS ============

// Moneda 8x8 (3 frames de giro)
defSprite('coin', { g: PAL.gold, d: PAL.dgold, w: PAL.cream },
  ['..gggg..', '.gggggg.', 'ggwwggdg', 'ggwggggd', 'ggwggggd', 'ggggggdd', '.gggggg.', '..gggg..'],
  ['...gg...', '..gggg..', '..gwgd..', '..gwgd..', '..gwgd..', '..gggd..', '..gggg..', '...gg...'],
  ['....g...', '...gg...', '...gd...', '...gd...', '...gd...', '...gd...', '...gg...', '....g...']);

// Gema 8x8 (vale 5)
defSprite('gem', { r: PAL.red, p: PAL.pink, d: PAL.blood },
  ['..rrrr..', '.rpprrd.', 'rpprrrdd', 'rprrrrdd', '.rrrrdd.', '..rrdd..', '...rd...', '........']);

// Corazón 8x7
defSprite('heart', { r: PAL.red, p: PAL.pink },
  ['.rr.rr..', 'rprrrrr.', 'rrrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....']);
defSprite('heart_empty', { r: PAL.dgray, p: PAL.gray },
  ['.rr.rr..', 'rprrrrr.', 'rrrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....']);

// Carne 9x8
defSprite('meat', { m: PAL.red, d: PAL.blood, b: PAL.cream, h: PAL.pink },
  ['..mmmm...', '.mmhmmm..', '.mmmmmm..', '.mmmmmb..', '..mmmbbb.', '...mbb.b.', '....b....', '.........']);

// Piel 9x8
defSprite('pelt', { p: PAL.fur, d: PAL.brown, c: PAL.cream },
  ['p.ppppp.p', 'ppcccccpp', '.pcccccp.', '.pcccccp.', '.pcccccp.', 'ppcccccpp', 'p.ppppp.p', '.........']);

// Resorte 12x8 (2 frames)
defSprite('spring', { m: PAL.gray, d: PAL.dgray, r: PAL.red },
  ['..rrrrrrrr..', '..rrrrrrrr..', '...m.mm.m...', '...mm..mm...', '...m.mm.m...', '...mm..mm...', '..dddddddd..', '..dddddddd..'],
  ['............', '............', '............', '..rrrrrrrr..', '..rrrrrrrr..', '...mmmmmm...', '..dddddddd..', '..dddddddd..']);

// Bandera checkpoint 12x20 (2 frames: gris / verde activada)
defSprite('flag_off', { p: PAL.gray, f: PAL.lgray, b: PAL.dgray },
  [
    'pp..........', 'pp..........', 'ppffff......', 'ppffffff....', 'ppffffff....', 'ppffff......',
    'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........',
    'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........',
    'bbbb........', 'bbbb........',
  ]);
defSprite('flag_on', { p: PAL.gray, f: PAL.green, b: PAL.dgray },
  [
    'pp..........', 'pp..........', 'ppffff......', 'ppffffff....', 'ppffffff....', 'ppffff......',
    'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........',
    'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........', 'pp..........',
    'bbbb........', 'bbbb........',
  ]);

// Coco 6x6 (proyectil del mono)
defSprite('coco', { c: PAL.dbrown, d: PAL.black },
  ['.cccc.', 'cccccc', 'ccdccc', 'cccccc', 'cccccc', '.cccc.']);

// Aguijón 8x4 (proyectil del escorpión boss)
defSprite('stinger', { s: PAL.gold, d: PAL.red },
  ['....ss..', '..ssssd.', 'ssssssdd', '..ssssd.']);

// Carámbano 6x10 (ártico / boss mamut)
defSprite('icicle', { i: PAL.ice, w: PAL.snow, d: PAL.dice },
  ['iwiiid', 'iwiiid', '.wiid.', '.wiid.', '.wid..', '.wid..', '..wd..', '..wd..', '..w...', '..w...']);

// Roca 8x7 (boss oso)
defSprite('rock', { r: PAL.gray, d: PAL.dgray, l: PAL.lgray },
  ['..rrrr..', '.rlrrrd.', 'rrlrrrdd', 'rrrrrrdd', 'rrrrrdd.', '.rrrdd..', '..ddd...']);

// Onda de rugido 12x12 (boss león)
defSprite('roarwave', { o: PAL.orange, y: PAL.yellow },
  ['....oo......', '..oo..o.....', '.o.....o....', 'o..yy...o...', 'o.y..y..o...', 'o.y...y.o...',
   'o.y...y.o...', 'o.y..y..o...', 'o..yy...o...', '.o.....o....', '..oo..o.....', '....oo......']);

// ============ TILES por bioma (16x16 pre-renderizados) ============
const TILES = {}; // TILES[bioma] = {top, fill, plat}

function _makeTile(fn) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  fn(c.getContext('2d'));
  return c;
}

function _dither(g, x, y, w, h, colA, colB, rnd, prob) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    g.fillStyle = rnd() < prob ? colB : colA;
    g.fillRect(i, j, 1, 1);
  }
}

function buildTiles() {
  const defs = {
    bosque:  { grass: PAL.green,  grass2: PAL.lime,  dirt: PAL.brown, dirt2: PAL.dbrown, plat: PAL.brown, plat2: PAL.dbrown },
    jungla:  { grass: PAL.dgreen, grass2: PAL.green, dirt: PAL.dbrown, dirt2: PAL.black, plat: PAL.olive, plat2: PAL.dolive },
    desierto:{ grass: PAL.sand,   grass2: PAL.khaki, dirt: PAL.dsand, dirt2: PAL.brown, plat: PAL.dsand, plat2: PAL.brown },
    sabana:  { grass: PAL.khaki,  grass2: PAL.sand,  dirt: PAL.tan,  dirt2: PAL.brown, plat: PAL.tan,  plat2: PAL.brown },
    artico:  { grass: PAL.snow,   grass2: PAL.white, dirt: PAL.ice,  dirt2: PAL.dice,  plat: PAL.ice,  plat2: PAL.dice },
  };
  for (const [name, d] of Object.entries(defs)) {
    const rnd = mulberry32(name.length * 999 + 5);
    TILES[name] = {
      top: _makeTile(g => {
        _dither(g, 0, 0, 16, 4, d.grass, d.grass2, rnd, 0.35);
        _dither(g, 0, 4, 16, 12, d.dirt, d.dirt2, rnd, 0.15);
        g.fillStyle = d.grass2;
        for (let i = 0; i < 4; i++) g.fillRect(Math.floor(rnd() * 15), 4, 1, 1);
      }),
      fill: _makeTile(g => _dither(g, 0, 0, 16, 16, d.dirt, d.dirt2, rnd, 0.12)),
      plat: _makeTile(g => {
        _dither(g, 0, 0, 16, 6, d.plat, d.plat2, rnd, 0.2);
        g.fillStyle = d.plat2;
        g.fillRect(0, 5, 16, 1); g.fillRect(5, 0, 1, 6); g.fillRect(11, 0, 1, 6);
        g.clearRect(0, 6, 16, 10);
      }),
    };
  }
}

// ============ DECORACIONES por bioma (pre-renderizadas) ============
const DECOS = {}; // DECOS[bioma] = [canvas,...]

function _decoCanvas(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  fn(g);
  return c;
}

function _px(g, color) { g.fillStyle = color; return (x, y, w = 1, h = 1) => g.fillRect(x, y, w, h); }

function buildDecos() {
  DECOS.bosque = [
    // pino grande
    _decoCanvas(24, 40, g => {
      const t = _px(g, PAL.dbrown); t(10, 30, 4, 10);
      g.fillStyle = PAL.dgreen;
      for (let i = 0; i < 5; i++) g.fillRect(2 + i * 2, 6 + i * 6, 20 - i * 4, 6);
      g.fillStyle = PAL.green;
      for (let i = 0; i < 5; i++) g.fillRect(3 + i * 2, 6 + i * 6, 8 - i, 2);
      g.fillStyle = PAL.dgreen; g.fillRect(10, 0, 4, 8);
    }),
    // arbusto
    _decoCanvas(16, 10, g => {
      g.fillStyle = PAL.dgreen; g.fillRect(1, 3, 14, 7);
      g.fillStyle = PAL.green; g.fillRect(3, 1, 10, 6); g.fillRect(0, 5, 16, 3);
      g.fillStyle = PAL.lime; g.fillRect(4, 2, 2, 2); g.fillRect(9, 3, 2, 1);
    }),
    // hongo
    _decoCanvas(8, 8, g => {
      g.fillStyle = PAL.cream; g.fillRect(3, 4, 2, 4);
      g.fillStyle = PAL.red; g.fillRect(1, 1, 6, 3); g.fillRect(2, 0, 4, 1);
      g.fillStyle = PAL.white; g.fillRect(2, 1, 1, 1); g.fillRect(5, 2, 1, 1);
    }),
  ];
  DECOS.jungla = [
    // árbol de jungla con lianas
    _decoCanvas(28, 44, g => {
      g.fillStyle = PAL.brown; g.fillRect(12, 24, 4, 20);
      g.fillStyle = PAL.dgreen; g.fillRect(0, 4, 28, 14);
      g.fillStyle = PAL.green; g.fillRect(2, 0, 22, 10); g.fillRect(4, 12, 8, 4);
      g.fillStyle = PAL.lime; g.fillRect(4, 2, 4, 2); g.fillRect(16, 4, 5, 2);
      g.fillStyle = PAL.dgreen; g.fillRect(4, 18, 2, 14); g.fillRect(22, 18, 2, 10);
    }),
    // helecho grande
    _decoCanvas(18, 14, g => {
      g.fillStyle = PAL.green;
      g.fillRect(8, 6, 2, 8);
      for (let i = 0; i < 4; i++) { g.fillRect(2 + i, 8 - i * 2, 6, 2); g.fillRect(10 - i, 8 - i * 2, 6, 2); }
      g.fillStyle = PAL.lime; g.fillRect(8, 0, 2, 4);
    }),
    // flor tropical
    _decoCanvas(8, 10, g => {
      g.fillStyle = PAL.green; g.fillRect(3, 5, 2, 5);
      g.fillStyle = PAL.red; g.fillRect(1, 1, 6, 4);
      g.fillStyle = PAL.pink; g.fillRect(2, 0, 4, 2);
      g.fillStyle = PAL.yellow; g.fillRect(3, 2, 2, 2);
    }),
  ];
  DECOS.desierto = [
    // saguaro
    _decoCanvas(20, 32, g => {
      g.fillStyle = PAL.green; g.fillRect(8, 4, 5, 28);
      g.fillRect(2, 10, 4, 3); g.fillRect(2, 6, 3, 7);
      g.fillRect(15, 14, 4, 3); g.fillRect(16, 9, 3, 8);
      g.fillStyle = PAL.dgreen; g.fillRect(9, 4, 1, 28); g.fillRect(12, 4, 1, 28);
      g.fillStyle = PAL.lime; g.fillRect(10, 4, 1, 3);
    }),
    // cráneo de vaca
    _decoCanvas(12, 8, g => {
      g.fillStyle = PAL.cream; g.fillRect(3, 1, 6, 5); g.fillRect(1, 0, 3, 3); g.fillRect(8, 0, 3, 3);
      g.fillStyle = PAL.black; g.fillRect(4, 3, 1, 1); g.fillRect(7, 3, 1, 1);
      g.fillStyle = PAL.khaki; g.fillRect(4, 6, 4, 2);
    }),
    // roca del desierto
    _decoCanvas(14, 8, g => {
      g.fillStyle = PAL.dsand; g.fillRect(1, 2, 12, 6);
      g.fillStyle = PAL.sand; g.fillRect(3, 0, 6, 4);
      g.fillStyle = PAL.brown; g.fillRect(9, 4, 4, 4);
    }),
  ];
  DECOS.sabana = [
    // acacia
    _decoCanvas(32, 30, g => {
      g.fillStyle = PAL.dbrown; g.fillRect(14, 14, 3, 16); g.fillRect(10, 10, 3, 6); g.fillRect(19, 11, 3, 5);
      g.fillStyle = PAL.dolive; g.fillRect(0, 4, 32, 7);
      g.fillStyle = PAL.olive; g.fillRect(2, 2, 28, 5);
      g.fillStyle = PAL.khaki; g.fillRect(6, 2, 4, 2); g.fillRect(20, 3, 6, 2);
    }),
    // pasto alto
    _decoCanvas(14, 10, g => {
      g.fillStyle = PAL.khaki;
      for (let i = 0; i < 7; i++) g.fillRect(i * 2, 2 + (i % 3), 1, 8 - (i % 3));
      g.fillStyle = PAL.sand;
      for (let i = 0; i < 4; i++) g.fillRect(1 + i * 3, i % 2, 1, 9);
    }),
    // termitero
    _decoCanvas(12, 14, g => {
      g.fillStyle = PAL.tan; g.fillRect(4, 0, 4, 14); g.fillRect(2, 4, 8, 10); g.fillRect(1, 9, 10, 5);
      g.fillStyle = PAL.brown; g.fillRect(5, 2, 1, 12); g.fillRect(8, 6, 1, 8);
    }),
  ];
  DECOS.artico = [
    // pino nevado
    _decoCanvas(24, 36, g => {
      g.fillStyle = PAL.dbrown; g.fillRect(10, 28, 4, 8);
      g.fillStyle = PAL.dgreen;
      for (let i = 0; i < 4; i++) g.fillRect(2 + i * 2, 6 + i * 6, 20 - i * 4, 6);
      g.fillStyle = PAL.snow;
      for (let i = 0; i < 4; i++) g.fillRect(2 + i * 2, 6 + i * 6, 20 - i * 4, 2);
      g.fillRect(10, 0, 4, 7);
    }),
    // cristal de hielo
    _decoCanvas(12, 14, g => {
      g.fillStyle = PAL.ice; g.fillRect(4, 2, 4, 12); g.fillRect(1, 6, 3, 8); g.fillRect(8, 5, 3, 9);
      g.fillStyle = PAL.cyan; g.fillRect(5, 2, 1, 12); g.fillRect(2, 6, 1, 8);
      g.fillStyle = PAL.white; g.fillRect(4, 2, 1, 3);
    }),
    // muñeco de nieve
    _decoCanvas(10, 12, g => {
      g.fillStyle = PAL.snow; g.fillRect(2, 6, 6, 6); g.fillRect(3, 1, 4, 5);
      g.fillStyle = PAL.black; g.fillRect(4, 2, 1, 1); g.fillRect(6, 2, 1, 1);
      g.fillStyle = PAL.orange; g.fillRect(5, 3, 3, 1);
      g.fillStyle = PAL.dgray; g.fillRect(3, 0, 4, 1);
    }),
  ];
}

// ============ FONDOS PARALLAX por bioma ============
const BGS = {}; // BGS[bioma] = {sky:[colores], far:canvas, near:canvas, sun, aurora}

function _silhouette(w, h, color, color2, seed, jag, base) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const rnd = mulberry32(seed);
  let y = base;
  for (let x = 0; x < w; x += 4) {
    y += Math.floor((rnd() - 0.5) * jag * 2);
    y = Math.max(6, Math.min(h - 4, y));
    g.fillStyle = color;
    g.fillRect(x, y, 4, h - y);
    if (rnd() < 0.3) { g.fillStyle = color2; g.fillRect(x, y, 4, 2); }
  }
  return c;
}

function buildBGs() {
  BGS.bosque = {
    sky: ['#8bd0ba', '#a8dcc8', '#c8ead8'],
    far: _silhouette(480, 100, '#5ba88f', '#6fbfa2', 11, 6, 40),
    near: _silhouette(480, 120, '#3d8a72', '#4d9d82', 22, 10, 50),
    sun: { x: 400, y: 40, r: 14, color: '#fff7d6' },
  };
  BGS.jungla = {
    sky: ['#7ec850', '#9fd86a', '#c0e88a'],
    far: _silhouette(480, 110, '#4a9440', '#5aa850', 33, 4, 30),
    near: _silhouette(480, 130, '#2e6e30', '#3c8040', 44, 8, 45),
    sun: { x: 90, y: 35, r: 12, color: '#fffbe0' },
  };
  BGS.desierto = {
    sky: ['#ffce8a', '#ffb570', '#ff9c5c'],
    far: _silhouette(480, 90, '#d89050', '#e8a060', 55, 3, 50),
    near: _silhouette(480, 110, '#b87038', '#c88048', 66, 5, 55),
    sun: { x: 240, y: 45, r: 18, color: '#fff2c0' },
  };
  BGS.sabana = {
    sky: ['#ff9a56', '#ff7e4a', '#e86a48'],
    far: _silhouette(480, 85, '#a04830', '#b05838', 77, 2, 55),
    near: _silhouette(480, 105, '#703020', '#804028', 88, 4, 58),
    sun: { x: 150, y: 55, r: 22, color: '#ffdca0' },
  };
  BGS.artico = {
    sky: ['#1a2c50', '#243a64', '#31497a'],
    far: _silhouette(480, 100, '#4a6a9a', '#5a7aaa', 99, 8, 45),
    near: _silhouette(480, 120, '#33507e', '#40608e', 110, 12, 55),
    sun: { x: 380, y: 35, r: 10, color: '#e8f0ff' },
    aurora: true,
  };
}

function initSprites() {
  buildTiles();
  buildDecos();
  buildBGs();
}
