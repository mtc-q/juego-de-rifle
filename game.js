'use strict';
// ============ RIFLE QUEST — juego principal ============

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const VW = 480, VH = 270;

function fitCanvas() {
  const s = Math.max(1, Math.floor(Math.min(window.innerWidth / VW, window.innerHeight / VH)));
  canvas.style.width = (VW * s) + 'px';
  canvas.style.height = (VH * s) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// ---------- FUENTE PIXEL 3x5 ----------
const FONT = {
  A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['011','100','100','100','011'],
  D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],
  G:['011','100','101','101','011'],H:['101','101','111','101','101'],I:['111','010','010','010','111'],
  J:['001','001','001','101','010'],K:['101','101','110','101','101'],L:['100','100','100','100','111'],
  M:['101','111','111','101','101'],N:['110','101','101','101','101'],O:['010','101','101','101','010'],
  P:['110','101','110','100','100'],Q:['010','101','101','010','001'],R:['110','101','110','101','101'],
  S:['011','100','010','001','110'],T:['111','010','010','010','010'],U:['101','101','101','101','111'],
  V:['101','101','101','101','010'],W:['101','101','111','111','101'],X:['101','101','010','101','101'],
  Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],
  '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],
  '3':['111','001','011','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],
  '6':['111','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],
  '9':['111','101','111','001','111'],'-':['000','000','111','000','000'],'!':['010','010','010','000','010'],
  '¡':['010','000','010','010','010'],':':['000','010','000','010','000'],'.':['000','000','000','000','010'],
  ',':['000','000','000','010','100'],'+':['000','010','111','010','000'],'?':['110','001','010','000','010'],
  '¿':['010','000','010','100','011'],"'":['010','010','000','000','000'],
};
function _norm(ch) {
  const map = { 'Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','Ñ':'N','Ü':'U','—':'-' };
  return map[ch] || ch;
}
function pixTextW(text, s) { return text.length * 4 * s - s; }
function pixText(g, text, x, y, s, color, align) {
  text = text.toUpperCase();
  if (align === 'center') x -= Math.floor(pixTextW(text, s) / 2);
  else if (align === 'right') x -= pixTextW(text, s);
  g.fillStyle = color;
  for (const chRaw of text) {
    const ch = _norm(chRaw);
    const gl = FONT[ch];
    if (gl) {
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
        if (gl[r][c] === '1') g.fillRect(x + c * s, y + r * s, s, s);
      }
    }
    x += 4 * s;
  }
}
function uiText(g, text, x, y, color, size, align) {
  g.font = (size || 7) + 'px monospace';
  g.textAlign = align || 'left';
  g.textBaseline = 'top';
  g.fillStyle = color;
  g.fillText(text, x, y);
  g.textAlign = 'left';
}

// ---------- INPUT ----------
const keys = {}, pressed = {};
const GAME_KEYS = new Set(['KeyW','KeyA','KeyS','KeyD','KeyF','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Minus','NumpadSubtract','Enter','Space','Escape','KeyP','KeyM','KeyR']);
window.addEventListener('keydown', e => {
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  if (!e.repeat) pressed[e.code] = true;
  keys[e.code] = true;
  AudioSys.ensure();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
function anyPressed(...codes) { return codes.some(c => pressed[c]); }

function playerInput(idx, solo) {
  if (idx === 0) {
    const inp = {
      left: keys.KeyA, right: keys.KeyD, down: keys.KeyS,
      jump: keys.KeyW, jumpPressed: pressed.KeyW, fire: keys.KeyF,
    };
    if (solo) { // en solitario también sirven las flechas
      inp.left = inp.left || keys.ArrowLeft;
      inp.right = inp.right || keys.ArrowRight;
      inp.down = inp.down || keys.ArrowDown;
      inp.jump = inp.jump || keys.ArrowUp;
      inp.jumpPressed = inp.jumpPressed || pressed.ArrowUp;
      inp.fire = inp.fire || keys.Minus || keys.NumpadSubtract;
    }
    return inp;
  }
  return {
    left: keys.ArrowLeft, right: keys.ArrowRight, down: keys.ArrowDown,
    jump: keys.ArrowUp, jumpPressed: pressed.ArrowUp,
    fire: keys.Minus || keys.NumpadSubtract,
  };
}

// ---------- ESTADO GLOBAL ----------
const game = {
  state: 'title',
  time: 0,
  nPlayers: 1,
  charSel: [0, 1],
  selDone: [false, false],
  selCursor: 0,
  unlocked: 0,
  completed: new Array(20).fill(false),
  coins: 0,
  inv: {},
  upg: { dmg: 0, firerate: 0, hp: 0, speed: 0, djump: 0 },
  curLevel: 0,
  mapCursor: 0,
  shopCursor: 0,
  pauseCursor: 0,
  paused: false,
  level: null,
  players: [], bullets: [], eprojs: [], animals: [], drops: [], parts: [], floats: [],
  plats: [], springs: [], checkpoints: [], coinsE: [], ambient: [],
  boss: null, exitE: null,
  camX: 0, camY: 0, shake: 0,
  checkpointPos: { x: 0, y: 0 },
  snapshot: null,
  hunted: 0,
  levelTitleT: 0,
  soldTotal: 0,
  msg: '', msgT: 0,

  addParticle(x, y, vx, vy, color, life, grav = true) {
    this.parts.push({ x, y, vx, vy, color, life, maxLife: life, grav });
  },
  addFloat(x, y, text, color) {
    this.floats.push({ x, y, text, color: color || PAL.white, t: 60 });
  },
  onBossDead(boss) {
    const d = boss.def;
    this.inv[d.trophy] = (this.inv[d.trophy] || 0) + 1;
    this.addFloat(boss.x, boss.y - 20, '¡' + LOOT[d.trophy].label + '!', PAL.gold);
    for (let i = 0; i < d.coins; i++) {
      this.drops.push({ type: 'coin', x: boss.x + boss.w / 2, y: boss.y + boss.h / 2, vx: (Math.random() - 0.5) * 5, vy: -3 - Math.random() * 3, t: 0 });
    }
    for (let i = 0; i < 30; i++) this.addParticle(boss.x + boss.w / 2, boss.y + boss.h / 2, (Math.random() - 0.5) * 5, -Math.random() * 4, [PAL.gold, PAL.orange, PAL.red][i % 3], 50);
    if (this.exitE) this.exitE.open = true;
    this.hunted++;
    setTimeout(() => SFX.win(), 800);
  },
};

// ---------- GUARDADO ----------
function saveGame() {
  try {
    localStorage.setItem('rifleQuestSave', JSON.stringify({
      unlocked: game.unlocked, completed: game.completed, coins: game.coins,
      upg: game.upg, inv: game.inv, nPlayers: game.nPlayers, charSel: game.charSel,
    }));
  } catch (e) { /* sin almacenamiento */ }
}
function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem('rifleQuestSave'));
    if (!d) return;
    game.unlocked = d.unlocked || 0;
    game.completed = d.completed || game.completed;
    game.coins = d.coins || 0;
    game.upg = Object.assign(game.upg, d.upg);
    game.inv = d.inv || {};
    game.nPlayers = d.nPlayers || 1;
    game.charSel = d.charSel || [0, 1];
  } catch (e) { /* guardado corrupto */ }
}
function wipeSave() {
  localStorage.removeItem('rifleQuestSave');
  game.unlocked = 0; game.completed = new Array(20).fill(false);
  game.coins = 0; game.inv = {}; game.upg = { dmg: 0, firerate: 0, hp: 0, speed: 0, djump: 0 };
}

// ---------- CARGA DE NIVEL ----------
function loadLevel(idx) {
  const lvl = genLevel(idx);
  game.level = lvl;
  game.curLevel = idx;
  setPhysicsWorld(lvl, game);
  game.bullets = []; game.eprojs = []; game.animals = []; game.drops = [];
  game.parts = []; game.floats = []; game.plats = []; game.springs = [];
  game.checkpoints = []; game.coinsE = []; game.ambient = [];
  game.boss = null; game.exitE = null;
  game.hunted = 0;
  game.levelTitleT = 140;
  game.shake = 0;
  game.paused = false;

  for (const e of lvl.entities) {
    if (e.type === 'coin') game.coinsE.push({ x: e.x, y: e.y, w: 8, h: 8, gem: false, taken: false });
    else if (e.type === 'gem') game.coinsE.push({ x: e.x, y: e.y, w: 8, h: 8, gem: true, taken: false });
    else if (e.type === 'spring') game.springs.push({ x: e.x, y: e.y, w: 12, h: 8, anim: 0 });
    else if (e.type === 'mplat') game.plats.push({ x: e.x, y: e.y, x0: e.x, y0: e.y, w: e.w, h: 8, axis: e.axis, range: e.range, speed: e.speed, t: Math.random() * 6, solid: true, dx: 0, crumble: false });
    else if (e.type === 'cplat') game.plats.push({ x: e.x, y: e.y, x0: e.x, y0: e.y, w: e.w, h: 8, solid: true, dx: 0, crumble: true, cstate: 0, ctimer: 0, vy: 0 });
    else if (e.type === 'checkpoint') game.checkpoints.push({ x: e.x, y: e.y, w: 12, h: 36, active: false });
    else if (e.type === 'exit') game.exitE = { x: e.x, y: e.y, w: 42, h: 48, open: true };
    else if (e.type === 'animal') game.animals.push(new Animal(e.id, e.x, e.y));
    else if (e.type === 'boss') game.boss = new Boss(e.bossIdx, e.x, e.y);
  }
  if (lvl.isBoss) {
    const gy = (lvl.hT - 5) * TILE;
    game.exitE = { x: lvl.exitX, y: gy - 48, w: 42, h: 48, open: false };
  }

  const prevs = game.players;
  game.players = [];
  for (let i = 0; i < game.nPlayers; i++) {
    const p = new Player(i, game.charSel[i]);
    p.x = lvl.spawn.x + i * 18;
    p.y = lvl.spawn.y;
    // la vida se conserva entre niveles (el Botiquín de la tienda cura)
    const prev = prevs && prevs[i];
    if (prev && prev.charIdx === game.charSel[i]) {
      p.hp = prev.dead ? Math.max(2, Math.ceil(p.maxHp() / 2)) : Math.max(1, Math.min(prev.hp, p.maxHp()));
    } else {
      p.hp = p.maxHp();
    }
    game.players.push(p);
  }
  game.checkpointPos = { x: lvl.spawn.x, y: lvl.spawn.y };
  game.snapshot = { coins: game.coins, inv: JSON.parse(JSON.stringify(game.inv)) };
  game.camX = 0; game.camY = Math.max(0, lvl.hT * TILE - VH);
  AudioSys.playMusic(lvl.isBoss ? 5 : lvl.world);
}

function restartLevel(msg) {
  game.coins = game.snapshot.coins;
  game.inv = JSON.parse(JSON.stringify(game.snapshot.inv));
  game.players = []; // reinicio limpio: vida completa
  loadLevel(game.curLevel);
  if (msg) { game.msg = msg; game.msgT = 130; }
}

// ---------- ACTUALIZACIÓN: JUEGO ----------
function updatePlay() {
  const lvl = game.level;

  if (anyPressed('Escape', 'KeyP')) {
    game.paused = !game.paused;
    game.pauseCursor = 0;
    SFX.select();
  }
  if (game.paused) { updatePause(); return; }

  const solo = game.nPlayers === 1;
  for (const p of game.players) p.update(playerInput(p.idx, solo));

  // muertes y reapariciones
  const alive = game.players.filter(p => !p.dead);
  if (alive.length === 0) {
    if (game.players.every(p => p.deadTimer < 170)) restartLevel('¡EQUIPO CAÍDO! NIVEL REINICIADO');
  } else {
    for (const p of game.players) {
      if (p.dead && p.deadTimer <= 0) {
        const buddy = alive[0];
        p.respawn(buddy.x, buddy.y - 10);
        game.addFloat(p.x, p.y - 10, '¡DE VUELTA!', PAL.lime);
      }
      // caída al vacío
      if (!p.dead && p.y > lvl.hT * TILE + 30) {
        p.hp -= 1;
        SFX.hurt();
        if (p.hp <= 0) { p.dead = true; p.deadTimer = 240; SFX.dead(); }
        else {
          p.x = game.checkpointPos.x; p.y = game.checkpointPos.y;
          p.vx = 0; p.vy = 0; p.invuln = 90;
        }
      }
    }
  }

  // balas del jugador
  for (const b of game.bullets) {
    b.x += b.vx;
    b.dist += Math.abs(b.vx);
    if (tileAt(b.x, b.y) === 1 || b.dist > 300) {
      b.hit = true;
      game.addParticle(b.x, b.y, -Math.sign(b.vx), -0.5, PAL.yellow, 8);
      continue;
    }
    for (const a of game.animals) {
      if (a.dead || a.collected) continue;
      if (b.x > a.x - 2 && b.x < a.x + a.w + 2 && b.y > a.y - 2 && b.y < a.y + a.h + 2) {
        a.hit(b.dmg, Math.sign(b.vx));
        b.hit = true;
        game.addParticle(b.x, b.y, 0, -1, PAL.red, 12);
        break;
      }
    }
    if (!b.hit && game.boss && !game.boss.dead) {
      const bo = game.boss;
      if (b.x > bo.x && b.x < bo.x + bo.w && b.y > bo.y && b.y < bo.y + bo.h) {
        if (bo.hit(b.dmg)) b.hit = true;
      }
    }
  }
  game.bullets = game.bullets.filter(b => !b.hit);

  // plataformas móviles y que se desmoronan
  for (const p of game.plats) {
    if (p.crumble) {
      const stood = game.players.some(pl => pl.groundPlat === p);
      if (p.cstate === 0 && stood) { p.cstate = 1; p.ctimer = 26; SFX.crumble(); }
      else if (p.cstate === 1) {
        p.ctimer--;
        if (p.ctimer <= 0) { p.cstate = 2; p.solid = false; p.vy = 0; }
      } else if (p.cstate === 2) {
        p.vy = Math.min(p.vy + 0.3, 6);
        p.y += p.vy;
        if (p.y > game.level.hT * TILE + 40) { p.cstate = 3; p.ctimer = 170; }
      } else if (p.cstate === 3) {
        p.ctimer--;
        if (p.ctimer <= 0) { p.cstate = 0; p.solid = true; p.y = p.y0; }
      }
      p.dx = 0;
    } else {
      p.t += 0.016 * p.speed * 3;
      const old = p.x;
      const off = (Math.sin(p.t) * 0.5 + 0.5) * p.range;
      if (p.axis === 'x') p.x = p.x0 + off; else p.y = p.y0 + off;
      p.dx = p.x - old;
    }
  }

  // animales
  for (const a of game.animals) a.update();
  // contacto con animales agresivos
  for (const a of game.animals) {
    if (a.dead || a.def.dmg === 0) continue;
    for (const p of game.players) {
      if (!p.dead && aabb(p, a)) p.hurt(a.def.dmg, p.x < a.x ? -1 : 1);
    }
  }
  // recoger presas (pisarlas)
  for (const a of game.animals) {
    if (!a.dead || a.collected) continue;
    for (const p of game.players) {
      if (p.dead) continue;
      const feet = p.y + p.h;
      if (p.x + p.w > a.x && p.x < a.x + a.w && feet > a.y - 2 && feet < a.y + a.h + 4 && (p.onGround || p.vy > 0.5)) {
        a.collected = true;
        game.hunted++;
        SFX.stomp();
        setTimeout(() => SFX.collect(), 90);
        let dy = 0;
        for (const [lootId, n] of a.def.loot) {
          game.inv[lootId] = (game.inv[lootId] || 0) + n;
          game.addFloat(a.x, a.y - 8 - dy, '+' + n + ' ' + LOOT[lootId].label, LOOT[lootId].icon === 'meat' ? PAL.pink : PAL.tan);
          dy += 10;
        }
        for (let i = 0; i < 8; i++) game.addParticle(a.x + a.w / 2, a.y + a.h / 2, (Math.random() - 0.5) * 2.5, -Math.random() * 2, PAL.cream, 20);
        if (p.vy > 0.5) p.vy = -4; // rebote al pisar
        break;
      }
    }
  }
  game.animals = game.animals.filter(a => !a.collected);

  // boss
  if (game.boss) {
    game.boss.update();
    const bo = game.boss;
    if (!bo.dead && !bo.underground && bo.state !== 'intro') {
      for (const p of game.players) {
        if (!p.dead && aabb(p, bo)) p.hurt(1, p.x < bo.x ? -1 : 1);
      }
    }
  }

  // proyectiles enemigos
  for (const pr of game.eprojs) {
    if (pr.grav) pr.vy = Math.min(pr.vy + 0.18, 6);
    pr.x += pr.vx; pr.y += pr.vy;
    const hitGround = tileAt(pr.x + pr.w / 2, pr.y + pr.h) === 1 && pr.vy > 0;
    const hitWall = !pr.grav && tileAt(pr.x + pr.w / 2, pr.y + pr.h / 2) === 1;
    if (hitGround || hitWall) {
      pr.gone = true;
      for (let i = 0; i < 4; i++) game.addParticle(pr.x + pr.w / 2, pr.y + pr.h, (Math.random() - 0.5) * 2, -Math.random() * 1.5, PAL.lgray, 15);
      continue;
    }
    if (pr.x < -20 || pr.x > lvl.wT * TILE + 20 || pr.y > lvl.hT * TILE + 40) { pr.gone = true; continue; }
    for (const p of game.players) {
      if (!p.dead && aabb(p, pr)) { p.hurt(pr.dmg, Math.sign(pr.vx) || -p.facing); pr.gone = true; break; }
    }
  }
  game.eprojs = game.eprojs.filter(pr => !pr.gone);

  // monedas que caen de animales
  for (const d of game.drops) {
    d.t++;
    d.vy = Math.min(d.vy + 0.25, 6);
    d.x += d.vx; d.y += d.vy;
    if (tileAt(d.x, d.y + 4) === 1 && d.vy > 0) { d.vy *= -0.4; d.vx *= 0.7; d.y -= 1; }
    if (d.t > 15) {
      for (const p of game.players) {
        if (p.dead) continue;
        const dx = p.x + p.w / 2 - d.x, dy = p.y + p.h / 2 - d.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 14) {
          d.gone = true; game.coins++; SFX.coin();
          break;
        } else if (dist < 55) {
          // imán: la moneda vuela hacia el jugador
          d.x += dx / dist * 2.2; d.y += dy / dist * 2.2; d.vy = 0;
        }
      }
    }
    if (d.t > 2100) d.gone = true;
  }
  game.drops = game.drops.filter(d => !d.gone);

  // monedas fijas del nivel
  for (const c of game.coinsE) {
    if (c.taken) continue;
    for (const p of game.players) {
      if (!p.dead && aabb(p, c)) {
        c.taken = true;
        game.coins += c.gem ? 5 : 1;
        game.addFloat(c.x, c.y - 6, c.gem ? '+5' : '+1', c.gem ? PAL.pink : PAL.gold);
        c.gem ? SFX.gem() : SFX.coin();
        break;
      }
    }
  }

  // resortes
  for (const s of game.springs) {
    if (s.anim > 0) s.anim--;
    for (const p of game.players) {
      if (p.dead || p.vy < 0) continue;
      const feet = p.y + p.h;
      if (p.x + p.w > s.x && p.x < s.x + s.w && feet > s.y && feet < s.y + s.h + 6) {
        p.vy = -10.8 * p.def.jump;
        p.jumpsLeft = game.upg.djump ? 1 : 0;
        s.anim = 12;
        SFX.spring();
      }
    }
  }

  // checkpoints
  for (const c of game.checkpoints) {
    if (c.active) continue;
    for (const p of game.players) {
      if (!p.dead && aabb(p, c)) {
        c.active = true;
        game.checkpointPos = { x: c.x, y: c.y };
        game.addFloat(c.x, c.y - 10, '¡CHECKPOINT!', PAL.lime);
        SFX.checkpoint();
        break;
      }
    }
  }

  // salida
  if (game.exitE && game.exitE.open) {
    for (const p of game.players) {
      if (!p.dead && aabb(p, game.exitE)) { completeLevel(); return; }
    }
  }

  // partículas y textos
  for (const pt of game.parts) {
    pt.life--;
    if (pt.grav) pt.vy += 0.12;
    pt.x += pt.vx; pt.y += pt.vy;
  }
  game.parts = game.parts.filter(p => p.life > 0);
  for (const f of game.floats) { f.t--; f.y -= 0.5; }
  game.floats = game.floats.filter(f => f.t > 0);

  // partículas ambientales por bioma
  if (game.time % 6 === 0 && game.ambient.length < 40) {
    game.ambient.push({
      x: game.camX + Math.random() * (VW + 60) - 30,
      y: game.camY - 10,
      vx: (Math.random() - 0.5) * 0.5 - (lvl.biome === 'desierto' ? 0.8 : 0),
      vy: 0.3 + Math.random() * 0.5,
      ph: Math.random() * 6,
    });
  }
  for (const am of game.ambient) {
    am.ph += 0.04;
    am.x += am.vx + Math.sin(am.ph) * 0.3;
    am.y += am.vy;
    if (am.y > game.camY + VH + 10) am.gone = true;
  }
  game.ambient = game.ambient.filter(a => !a.gone);

  // cámara
  const targets = game.players.filter(p => !p.dead);
  if (targets.length) {
    const tx = targets.reduce((a, p) => a + p.x, 0) / targets.length - VW / 2;
    const ty = targets.reduce((a, p) => a + p.y, 0) / targets.length - VH / 2 - 20;
    game.camX += (Math.max(0, Math.min(lvl.wT * TILE - VW, tx)) - game.camX) * 0.12;
    game.camY += (Math.max(0, Math.min(lvl.hT * TILE - VH, ty)) - game.camY) * 0.12;
  }
  // en co-op nadie se sale de la pantalla
  if (targets.length > 1) {
    for (const p of targets) {
      p.x = Math.max(game.camX + 2, Math.min(game.camX + VW - p.w - 2, p.x));
    }
  }
  if (game.shake > 0) game.shake--;
  if (game.levelTitleT > 0) game.levelTitleT--;
  if (game.msgT > 0) game.msgT--;
}

function updatePause() {
  const opts = 5;
  if (anyPressed('KeyW', 'ArrowUp')) { game.pauseCursor = (game.pauseCursor + opts - 1) % opts; SFX.select(); }
  if (anyPressed('KeyS', 'ArrowDown')) { game.pauseCursor = (game.pauseCursor + 1) % opts; SFX.select(); }
  if (anyPressed('KeyF', 'Enter', 'Minus', 'NumpadSubtract', 'Space')) {
    const c = game.pauseCursor;
    if (c === 0) game.paused = false;
    else if (c === 1) { restartLevel('NIVEL REINICIADO'); }
    else if (c === 2) { game.state = 'map'; AudioSys.playMusic(6); }
    else if (c === 3) { AudioSys.toggleSound(); }
    else if (c === 4) { AudioSys.toggleMusic(); if (AudioSys.musicOn) AudioSys.playMusic(game.level.isBoss ? 5 : game.level.world); }
    SFX.confirm();
  }
}

function completeLevel() {
  game.completed[game.curLevel] = true;
  game.unlocked = Math.max(game.unlocked, Math.min(19, game.curLevel + 1));
  game.state = 'shop';
  game.shopCursor = 0;
  game.soldTotal = 0;
  saveGame();
  SFX.win();
  AudioSys.playMusic(6);
}

// ---------- TIENDA ----------
function shopItems() {
  // [0]=vender todo, [1..n]=mejoras, [n+1]=continuar
  return 1 + UPGRADES.length + 1;
}
function sellValue() {
  let total = 0;
  const bonus = game.players.some(p => p.def.sellBonus) ? 1.5 : 1;
  for (const [id, n] of Object.entries(game.inv)) {
    if (LOOT[id]) total += Math.round(LOOT[id].price * n * bonus);
  }
  return total;
}
function updateShop() {
  const n = shopItems();
  if (anyPressed('KeyW', 'ArrowUp')) { game.shopCursor = (game.shopCursor + n - 1) % n; SFX.select(); }
  if (anyPressed('KeyS', 'ArrowDown')) { game.shopCursor = (game.shopCursor + 1) % n; SFX.select(); }
  if (anyPressed('KeyF', 'Enter', 'Minus', 'NumpadSubtract', 'Space')) {
    const c = game.shopCursor;
    if (c === 0) {
      const v = sellValue();
      if (v > 0) {
        game.coins += v;
        game.soldTotal += v;
        game.inv = {};
        SFX.sell();
        saveGame();
      } else SFX.denied();
    } else if (c <= UPGRADES.length) {
      const u = UPGRADES[c - 1];
      const lvl = u.id === 'heal' ? 0 : game.upg[u.id];
      const price = upgradePrice(u, lvl);
      if (u.id !== 'heal' && game.upg[u.id] >= u.max) { SFX.denied(); }
      else if (game.coins >= price) {
        game.coins -= price;
        if (u.id === 'heal') { for (const p of game.players) { p.dead = false; p.hp = p.maxHp(); } }
        else game.upg[u.id]++;
        if (u.id === 'hp') for (const p of game.players) p.hp = Math.min(p.hp + 1, p.maxHp());
        SFX.buy();
        saveGame();
      } else SFX.denied();
    } else {
      // continuar
      SFX.confirm();
      if (game.curLevel === 19 && game.completed[19]) { game.state = 'victory'; }
      else { game.state = 'map'; game.mapCursor = Math.min(game.unlocked, 19); }
      AudioSys.playMusic(6);
    }
  }
}

// ---------- MAPA ----------
function updateMap() {
  if (anyPressed('KeyA', 'ArrowLeft')) { game.mapCursor = Math.max(0, game.mapCursor - 1); SFX.select(); }
  if (anyPressed('KeyD', 'ArrowRight')) { game.mapCursor = Math.min(19, game.mapCursor + 1); SFX.select(); }
  if (anyPressed('KeyW', 'ArrowUp')) { game.mapCursor = Math.max(0, game.mapCursor - 4); SFX.select(); }
  if (anyPressed('KeyS', 'ArrowDown')) { game.mapCursor = Math.min(19, game.mapCursor + 4); SFX.select(); }
  if (anyPressed('KeyF', 'Enter', 'Minus', 'NumpadSubtract', 'Space')) {
    if (game.mapCursor <= game.unlocked) {
      loadLevel(game.mapCursor);
      game.state = 'play';
      SFX.confirm();
    } else SFX.denied();
  }
  if (anyPressed('Escape')) { game.state = 'charsel'; game.selDone = [false, false]; SFX.select(); }
}

// ---------- SELECCIÓN ----------
function updateTitle() {
  if (anyPressed('KeyF', 'Enter', 'Space', 'Minus', 'NumpadSubtract')) {
    game.state = 'players';
    SFX.confirm();
  }
  if (anyPressed('KeyR')) { wipeSave(); game.msg = 'PROGRESO BORRADO'; game.msgT = 100; }
  if (game.msgT > 0) game.msgT--;
}
function updatePlayers() {
  if (anyPressed('KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight')) { game.nPlayers = game.nPlayers === 1 ? 2 : 1; SFX.select(); }
  if (anyPressed('KeyF', 'Enter', 'Space', 'Minus', 'NumpadSubtract')) {
    game.state = 'charsel';
    game.selDone = [false, false];
    SFX.confirm();
  }
  if (anyPressed('Escape')) game.state = 'title';
}
function updateCharsel() {
  // P1: A/D + F   P2: flechas + guion
  if (!game.selDone[0]) {
    if (pressed.KeyA) { game.charSel[0] = (game.charSel[0] + CHARS.length - 1) % CHARS.length; SFX.select(); }
    if (pressed.KeyD) { game.charSel[0] = (game.charSel[0] + 1) % CHARS.length; SFX.select(); }
    if (pressed.KeyF) { game.selDone[0] = true; SFX.confirm(); }
    if (game.nPlayers === 1) {
      if (pressed.ArrowLeft) { game.charSel[0] = (game.charSel[0] + CHARS.length - 1) % CHARS.length; SFX.select(); }
      if (pressed.ArrowRight) { game.charSel[0] = (game.charSel[0] + 1) % CHARS.length; SFX.select(); }
      if (pressed.Enter || pressed.Minus || pressed.NumpadSubtract) { game.selDone[0] = true; SFX.confirm(); }
    }
  }
  if (game.nPlayers === 2 && !game.selDone[1]) {
    if (pressed.ArrowLeft) { game.charSel[1] = (game.charSel[1] + CHARS.length - 1) % CHARS.length; SFX.select(); }
    if (pressed.ArrowRight) { game.charSel[1] = (game.charSel[1] + 1) % CHARS.length; SFX.select(); }
    if (pressed.Minus || pressed.NumpadSubtract || pressed.Enter) { game.selDone[1] = true; SFX.confirm(); }
  }
  const need = game.nPlayers;
  const done = game.selDone.slice(0, need).every(Boolean);
  if (done) {
    game.state = 'map';
    game.mapCursor = Math.min(game.unlocked, 19);
    saveGame();
  }
  if (anyPressed('Escape')) game.state = 'players';
}
function updateVictory() {
  if (anyPressed('KeyF', 'Enter', 'Space', 'Minus', 'NumpadSubtract')) {
    game.state = 'map';
    SFX.confirm();
  }
}

// ---------- RENDER: FONDO ----------
function drawBG(biome, camX) {
  const bg = BGS[biome];
  const bandH = Math.ceil(VH / bg.sky.length);
  for (let i = 0; i < bg.sky.length; i++) {
    ctx.fillStyle = bg.sky[i];
    ctx.fillRect(0, i * bandH, VW, bandH);
  }
  // sol / luna
  ctx.fillStyle = bg.sun.color;
  const s = bg.sun;
  ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  // aurora boreal
  if (bg.aurora) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    const t = game.time / 40;
    for (let band = 0; band < 3; band++) {
      ctx.fillStyle = [PAL.lime, PAL.cyan, PAL.pink][band];
      for (let x = 0; x < VW; x += 4) {
        const y = 24 + band * 14 + Math.sin((x + game.time * 0.8) / 44 + band * 2 + t) * 10;
        ctx.fillRect(x, y, 4, 8 + Math.sin(x / 30 + t) * 3);
      }
    }
    ctx.restore();
  }
  // capas parallax
  const farX = Math.floor(camX * 0.2) % VW;
  ctx.drawImage(bg.far, -farX, VH - 170);
  ctx.drawImage(bg.far, -farX + VW, VH - 170);
  const nearX = Math.floor(camX * 0.45) % VW;
  ctx.drawImage(bg.near, -nearX, VH - 130);
  ctx.drawImage(bg.near, -nearX + VW, VH - 130);
}

// ---------- RENDER: NIVEL ----------
function drawSpikes(x, y, biome) {
  const col = biome === 'artico' ? PAL.ice : biome === 'desierto' ? PAL.dsand : PAL.lgray;
  const dark = biome === 'artico' ? PAL.dice : PAL.gray;
  for (let i = 0; i < 4; i++) {
    const bx = x + i * 4;
    ctx.fillStyle = col;
    ctx.fillRect(bx + 1, y + 8, 2, 8);
    ctx.fillRect(bx + 1, y + 4, 2, 4);
    ctx.fillStyle = dark;
    ctx.fillRect(bx + 1, y + 2, 1, 3);
  }
}

function drawCabin(e, open) {
  const x = Math.round(e.x), y = Math.round(e.y);
  // cabaña de la tienda
  ctx.fillStyle = PAL.dbrown; ctx.fillRect(x, y + 14, 42, 34);
  ctx.fillStyle = PAL.brown; ctx.fillRect(x + 2, y + 16, 38, 30);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = PAL.dbrown; ctx.fillRect(x + 2, y + 20 + i * 7, 38, 1); }
  // techo
  ctx.fillStyle = PAL.red;
  ctx.fillRect(x - 3, y + 8, 48, 7);
  ctx.fillRect(x + 2, y + 3, 38, 6);
  ctx.fillRect(x + 8, y - 2, 26, 6);
  // puerta y ventana
  ctx.fillStyle = PAL.dbrown; ctx.fillRect(x + 16, y + 28, 12, 20);
  ctx.fillStyle = open ? PAL.yellow : PAL.dgray; ctx.fillRect(x + 18, y + 30, 8, 16);
  ctx.fillStyle = PAL.cream; ctx.fillRect(x + 5, y + 22, 8, 8);
  ctx.fillStyle = open ? PAL.yellow : PAL.dgray; ctx.fillRect(x + 6, y + 23, 6, 6);
  // letrero
  pixText(ctx, 'TIENDA', x + 21, y + 16, 1, PAL.cream, 'center');
}

function renderPlay() {
  const lvl = game.level;
  drawBG(lvl.biome, game.camX);

  ctx.save();
  const shx = game.shake > 0 ? Math.round((Math.random() - 0.5) * game.shake) : 0;
  const shy = game.shake > 0 ? Math.round((Math.random() - 0.5) * game.shake) : 0;
  ctx.translate(-Math.round(game.camX) + shx, -Math.round(game.camY) + shy);

  const x0 = Math.floor(game.camX / TILE) - 1, x1 = x0 + Math.ceil(VW / TILE) + 2;
  const y0 = Math.floor(game.camY / TILE) - 1, y1 = y0 + Math.ceil(VH / TILE) + 2;
  const T = TILES[lvl.biome];

  // decoraciones (detrás de los tiles superiores)
  for (const d of lvl.decos) {
    if (d.x + d.img.width < game.camX - 20 || d.x > game.camX + VW + 20) continue;
    ctx.drawImage(d.img, Math.round(d.x), Math.round(d.y));
  }

  for (let ty = Math.max(0, y0); ty < Math.min(lvl.hT, y1); ty++) {
    for (let tx = Math.max(0, x0); tx < Math.min(lvl.wT, x1); tx++) {
      const v = lvl.grid[ty * lvl.wT + tx];
      if (v === 1) {
        const above = ty > 0 ? lvl.grid[(ty - 1) * lvl.wT + tx] : 0;
        ctx.drawImage(above === 1 ? T.fill : T.top, tx * TILE, ty * TILE);
      } else if (v === 2) {
        ctx.drawImage(T.plat, tx * TILE, ty * TILE);
      } else if (v === 3) {
        drawSpikes(tx * TILE, ty * TILE, lvl.biome);
      }
    }
  }

  // salida
  if (game.exitE && (game.exitE.open || !lvl.isBoss)) drawCabin(game.exitE, game.exitE.open);

  // checkpoints
  for (const c of game.checkpoints) {
    drawSpr(ctx, c.active ? 'flag_on' : 'flag_off', 0, c.x, c.y);
  }
  // resortes
  for (const s of game.springs) drawSpr(ctx, 'spring', s.anim > 6 ? 1 : 0, s.x, s.y);
  // plataformas-entidad
  for (const p of game.plats) {
    if (p.crumble && p.cstate === 3) { ctx.globalAlpha = 0.25; }
    if (!(p.crumble && p.cstate === 2 && p.y > lvl.hT * TILE)) {
      const wob = p.crumble && p.cstate === 1 ? Math.round((Math.random() - 0.5) * 2) : 0;
      for (let i = 0; i < p.w; i += TILE) {
        ctx.drawImage(TILES[lvl.biome].plat, Math.round(p.x + i + wob), Math.round(p.y));
      }
    }
    ctx.globalAlpha = 1;
  }
  // monedas
  for (const c of game.coinsE) {
    if (c.taken) continue;
    const bob = Math.sin((game.time + c.x) / 20) * 2;
    if (c.gem) drawSpr(ctx, 'gem', 0, c.x, c.y + bob);
    else drawSpr(ctx, 'coin', [0, 1, 2, 1][Math.floor(game.time / 8) % 4], c.x, c.y + bob);
  }
  // drops
  for (const d of game.drops) drawSpr(ctx, 'coin', [0, 1, 2, 1][Math.floor((game.time + d.t) / 6) % 4], d.x - 4, d.y - 4);
  // animales
  for (const a of game.animals) {
    if (a.x + a.w < game.camX - 40 || a.x > game.camX + VW + 40) continue;
    a.draw(ctx);
  }
  // boss
  if (game.boss) game.boss.draw(ctx);
  // jugadores
  for (const p of game.players) p.draw(ctx);
  // balas
  for (const b of game.bullets) {
    ctx.fillStyle = PAL.yellow;
    ctx.fillRect(Math.round(b.x - Math.sign(b.vx) * 4), Math.round(b.y - 1), 4, 2);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(Math.round(b.x), Math.round(b.y - 1), 2, 2);
  }
  // proyectiles enemigos
  for (const pr of game.eprojs) drawSpr(ctx, pr.spr, 0, pr.x, pr.y);
  // partículas
  for (const pt of game.parts) {
    ctx.globalAlpha = Math.min(1, pt.life / (pt.maxLife * 0.5));
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(pt.x), Math.round(pt.y), 2, 2);
  }
  ctx.globalAlpha = 1;
  // ambiente
  const ambCol = { bosque: PAL.lime, jungla: PAL.yellow, desierto: PAL.sand, sabana: PAL.khaki, artico: PAL.white }[lvl.biome];
  ctx.fillStyle = ambCol;
  for (const am of game.ambient) {
    ctx.globalAlpha = 0.7;
    ctx.fillRect(Math.round(am.x), Math.round(am.y), lvl.biome === 'artico' ? 2 : 1, lvl.biome === 'artico' ? 2 : 2);
  }
  ctx.globalAlpha = 1;
  // textos flotantes
  for (const f of game.floats) {
    uiText(ctx, f.text, Math.round(f.x), Math.round(f.y), f.color, 7, 'center');
  }

  ctx.restore();

  renderHUD();

  // título del nivel
  if (game.levelTitleT > 0) {
    const a = Math.min(1, game.levelTitleT / 30);
    ctx.globalAlpha = a * 0.75;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(0, 100, VW, 46);
    ctx.globalAlpha = a;
    pixText(ctx, levelName(game.curLevel), VW / 2, 110, 2, PAL.white, 'center');
    pixText(ctx, 'NIVEL ' + (game.curLevel + 1) + ' DE 20', VW / 2, 130, 1, PAL.yellow, 'center');
    ctx.globalAlpha = 1;
  }
  if (game.msgT > 0) {
    ctx.globalAlpha = Math.min(1, game.msgT / 25);
    pixText(ctx, game.msg, VW / 2, 80, 1, PAL.orange, 'center');
    ctx.globalAlpha = 1;
  }

  // barra del boss
  if (game.boss && !game.boss.dead) {
    const bo = game.boss;
    const bw = 180;
    ctx.fillStyle = PAL.ink; ctx.fillRect(VW / 2 - bw / 2 - 2, VH - 24, bw + 4, 12);
    ctx.fillStyle = PAL.blood; ctx.fillRect(VW / 2 - bw / 2, VH - 22, bw, 8);
    ctx.fillStyle = PAL.red; ctx.fillRect(VW / 2 - bw / 2, VH - 22, Math.max(0, bw * bo.hp / bo.maxHpV), 8);
    pixText(ctx, bo.def.name, VW / 2, VH - 34, 1, PAL.white, 'center');
  }

  if (game.paused) renderPause();
}

function renderHUD() {
  // P1 izquierda
  for (let i = 0; i < game.players.length; i++) {
    const p = game.players[i];
    const right = i === 1;
    const bx = right ? VW - 6 : 6;
    pixText(ctx, 'P' + (i + 1), right ? bx - 90 : bx, 5, 1, i === 0 ? PAL.skyblue : PAL.orange, 'left');
    const max = p.maxHp();
    for (let h = 0; h < max; h++) {
      const hx = right ? bx - 8 - h * 8 : bx + 12 + h * 8;
      drawSpr(ctx, h < p.hp ? 'heart' : 'heart_empty', 0, hx, 3);
    }
    if (p.dead) {
      uiText(ctx, 'Reapareces en ' + Math.ceil(p.deadTimer / 60) + '...', right ? bx - 60 : bx, 13, PAL.lgray, 7, right ? 'center' : 'left');
    }
  }
  // centro: monedas + botín
  drawSpr(ctx, 'coin', 0, VW / 2 - 40, 3);
  pixText(ctx, '' + game.coins, VW / 2 - 28, 5, 1, PAL.gold, 'left');
  let meat = 0, pelt = 0;
  for (const [id, n] of Object.entries(game.inv)) {
    if (!LOOT[id]) continue;
    if (LOOT[id].icon === 'meat') meat += n; else pelt += n;
  }
  drawSpr(ctx, 'meat', 0, VW / 2, 3);
  pixText(ctx, '' + meat, VW / 2 + 11, 5, 1, PAL.pink, 'left');
  drawSpr(ctx, 'pelt', 0, VW / 2 + 28, 3);
  pixText(ctx, '' + pelt, VW / 2 + 39, 5, 1, PAL.tan, 'left');
}

function renderPause() {
  ctx.fillStyle = 'rgba(15,15,27,0.82)';
  ctx.fillRect(0, 0, VW, VH);
  pixText(ctx, 'PAUSA', VW / 2, 50, 3, PAL.white, 'center');
  const opts = [
    'REANUDAR',
    'REINICIAR NIVEL',
    'SALIR AL MAPA',
    'SONIDO: ' + (AudioSys.soundOn ? 'SI' : 'NO'),
    'MUSICA: ' + (AudioSys.musicOn ? 'SI' : 'NO'),
  ];
  for (let i = 0; i < opts.length; i++) {
    const sel = i === game.pauseCursor;
    pixText(ctx, (sel ? '> ' : '') + opts[i], VW / 2, 100 + i * 18, sel ? 2 : 1, sel ? PAL.yellow : PAL.lgray, 'center');
  }
}

// ---------- RENDER: PANTALLAS ----------
function renderTitle() {
  drawBG('bosque', game.time * 0.4);
  ctx.fillStyle = 'rgba(15,15,27,0.45)';
  ctx.fillRect(0, 0, VW, VH);
  // venado paseando
  drawSpr(ctx, 'venado', Math.floor(game.time / 10) % 2, ((game.time * 0.5) % (VW + 60)) - 40, 208);

  pixText(ctx, 'RIFLE QUEST', VW / 2 + 2, 52, 5, PAL.ink, 'center');
  pixText(ctx, 'RIFLE QUEST', VW / 2, 50, 5, PAL.gold, 'center');
  pixText(ctx, 'CAZADORES DE MUNDOS', VW / 2, 88, 1, PAL.cream, 'center');

  if (Math.floor(game.time / 30) % 2 === 0) {
    pixText(ctx, 'PULSA F O ENTER', VW / 2, 150, 2, PAL.white, 'center');
  }
  pixText(ctx, '20 NIVELES - 5 MUNDOS - 5 JEFES', VW / 2, 185, 1, PAL.lgray, 'center');
  pixText(ctx, 'P1: WASD + F     P2: FLECHAS + -', VW / 2, 200, 1, PAL.lgray, 'center');
  pixText(ctx, 'R: BORRAR PROGRESO', VW / 2, 240, 1, PAL.dgray, 'center');
  if (game.msgT > 0) pixText(ctx, game.msg, VW / 2, 225, 1, PAL.orange, 'center');
}

function renderPlayers() {
  drawBG('sabana', game.time * 0.3);
  ctx.fillStyle = 'rgba(15,15,27,0.55)';
  ctx.fillRect(0, 0, VW, VH);
  pixText(ctx, '¿CUANTOS CAZADORES?', VW / 2, 50, 2, PAL.white, 'center');
  const opts = ['1 JUGADOR', '2 JUGADORES'];
  for (let i = 0; i < 2; i++) {
    const sel = game.nPlayers === i + 1;
    const x = VW / 2 + (i === 0 ? -90 : 90);
    ctx.fillStyle = sel ? PAL.dgreen : PAL.dgray;
    ctx.fillRect(x - 70, 100, 140, 60);
    if (sel) { ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 2; ctx.strokeRect(x - 70 + 1, 101, 138, 58); }
    pixText(ctx, opts[i], x, 115, 1, sel ? PAL.yellow : PAL.lgray, 'center');
    drawSpr(ctx, 'char_cazador', 0, x - (i === 1 ? 26 : 12), 128);
    if (i === 1) drawSpr(ctx, 'char_exploradora', 0, x + 4, 128);
  }
  pixText(ctx, 'A - D PARA ELEGIR, F PARA SEGUIR', VW / 2, 200, 1, PAL.lgray, 'center');
}

function renderCharsel() {
  drawBG('artico', game.time * 0.3);
  ctx.fillStyle = 'rgba(15,15,27,0.6)';
  ctx.fillRect(0, 0, VW, VH);
  pixText(ctx, 'ELIGE TU CAZADOR', VW / 2, 14, 2, PAL.white, 'center');

  const panels = game.nPlayers;
  for (let pi = 0; pi < panels; pi++) {
    const cx = panels === 1 ? VW / 2 : (pi === 0 ? VW / 4 : 3 * VW / 4);
    const ci = game.charSel[pi];
    const ch = CHARS[ci];
    const done = game.selDone[pi];
    ctx.fillStyle = done ? PAL.dgreen : PAL.dgray;
    ctx.fillRect(cx - 90, 38, 180, 190);
    ctx.strokeStyle = pi === 0 ? PAL.skyblue : PAL.orange;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 89, 39, 178, 188);
    pixText(ctx, 'JUGADOR ' + (pi + 1), cx, 46, 1, pi === 0 ? PAL.skyblue : PAL.orange, 'center');
    // sprite grande
    const s = SPR['char_' + ch.id];
    ctx.drawImage(s.frames[game.time % 60 < 30 ? 0 : 1], Math.round(cx - 36), 60, 72, 54);
    pixText(ctx, ch.name, cx, 120, 1, PAL.yellow, 'center');
    uiText(ctx, ch.desc, cx, 132, PAL.cream, 7, 'center');
    // barras de stats
    const stats = [
      ['VIDA', ch.hp / 9], ['VEL', ch.speed / 1.25], ['DAÑO', ch.dmg / 5], ['CADENCIA', (40 - ch.fireCd) / 34],
    ];
    for (let si = 0; si < stats.length; si++) {
      const [label, v] = stats[si];
      pixText(ctx, label, cx - 78, 148 + si * 14, 1, PAL.lgray, 'left');
      ctx.fillStyle = PAL.ink; ctx.fillRect(cx - 30, 148 + si * 14, 100, 5);
      ctx.fillStyle = [PAL.red, PAL.skyblue, PAL.orange, PAL.lime][si];
      ctx.fillRect(cx - 30, 148 + si * 14, Math.round(100 * Math.min(1, v)), 5);
    }
    if (done) pixText(ctx, '¡LISTO!', cx, 212, 1, PAL.lime, 'center');
    else pixText(ctx, pi === 0 ? 'A-D  ELIGE   F  CONFIRMA' : 'FLECHAS ELIGEN  - CONFIRMA', cx, 212, 1, PAL.white, 'center');
  }
}

const BIOME_COLORS = { bosque: PAL.green, jungla: PAL.dgreen, desierto: PAL.sand, sabana: PAL.orange, artico: PAL.ice };

function renderMap() {
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, 0, VW, VH);
  // estrellitas
  const rnd = mulberry32(42);
  ctx.fillStyle = PAL.dgray;
  for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(rnd() * VW), Math.floor(rnd() * VH), 1, 1);

  pixText(ctx, 'MAPA DE EXPEDICION', VW / 2, 10, 2, PAL.white, 'center');
  drawSpr(ctx, 'coin', 0, VW - 90, 8);
  pixText(ctx, '' + game.coins, VW - 78, 10, 1, PAL.gold, 'left');

  for (let w = 0; w < 5; w++) {
    const biome = BIOMES[w];
    const y = 36 + w * 44;
    ctx.fillStyle = BIOME_COLORS[biome];
    ctx.globalAlpha = 0.18;
    ctx.fillRect(10, y - 6, VW - 20, 40);
    ctx.globalAlpha = 1;
    pixText(ctx, BIOME_LABEL[biome], 18, y, 1, BIOME_COLORS[biome], 'left');
    for (let s = 0; s < 4; s++) {
      const idx = w * 4 + s;
      const x = 120 + s * 88;
      const unlocked = idx <= game.unlocked;
      const done = game.completed[idx];
      const sel = idx === game.mapCursor;
      const isBoss = s === 3;
      ctx.fillStyle = !unlocked ? PAL.dgray : done ? PAL.dgreen : PAL.navy;
      const bw = isBoss ? 60 : 48;
      ctx.fillRect(x - bw / 2, y - 4, bw, 30);
      if (sel) {
        ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 2;
        ctx.strokeRect(x - bw / 2 - 2, y - 6, bw + 4, 34);
      }
      if (isBoss) {
        // calavera del jefe
        ctx.fillStyle = unlocked ? PAL.cream : PAL.gray;
        ctx.fillRect(x - 5, y + 2, 10, 8);
        ctx.fillRect(x - 3, y + 10, 6, 3);
        ctx.fillStyle = !unlocked ? PAL.dgray : done ? PAL.dgreen : PAL.navy;
        ctx.fillRect(x - 3, y + 5, 2, 2); ctx.fillRect(x + 1, y + 5, 2, 2);
        pixText(ctx, 'JEFE', x, y + 16, 1, unlocked ? PAL.red : PAL.gray, 'center');
      } else {
        pixText(ctx, '' + (idx + 1), x, y + 4, 2, unlocked ? PAL.white : PAL.gray, 'center');
      }
      if (done) { pixText(ctx, '+', x + bw / 2 - 8, y - 2, 1, PAL.gold, 'center'); }
      if (!unlocked) {
        ctx.fillStyle = PAL.gray;
        ctx.fillRect(x - 3, y + 20, 6, 5);
        ctx.fillRect(x - 2, y + 18, 1, 3); ctx.fillRect(x + 1, y + 18, 1, 3);
      }
    }
  }
  pixText(ctx, 'WASD-FLECHAS: MOVER   F-ENTER: JUGAR   ESC: PERSONAJES', VW / 2, 258, 1, PAL.lgray, 'center');
}

function renderShop() {
  drawBG(game.level ? game.level.biome : 'bosque', 30);
  ctx.fillStyle = 'rgba(15,15,27,0.78)';
  ctx.fillRect(0, 0, VW, VH);

  pixText(ctx, 'TIENDA DEL CAZADOR', VW / 2, 8, 2, PAL.gold, 'center');
  pixText(ctx, levelName(game.curLevel) + ' COMPLETADO', VW / 2, 24, 1, PAL.lime, 'center');
  uiText(ctx, 'Animales cazados: ' + game.hunted, VW / 2, 34, PAL.cream, 7, 'center');

  // panel izquierdo: botín
  ctx.fillStyle = 'rgba(51,60,87,0.6)';
  ctx.fillRect(8, 46, 220, 186);
  pixText(ctx, 'TU BOTIN', 118, 52, 1, PAL.white, 'center');
  const entries = Object.entries(game.inv).filter(([id]) => LOOT[id]);
  const bonus = game.players.some(p => p.def.sellBonus) ? 1.5 : 1;
  let ly = 64;
  if (entries.length === 0) {
    uiText(ctx, '(vacío... ¡sal a cazar!)', 118, 90, PAL.lgray, 7, 'center');
  }
  for (let i = 0; i < Math.min(entries.length, 13); i++) {
    const [id, n] = entries[i];
    drawSpr(ctx, LOOT[id].icon, 0, 14, ly - 1);
    uiText(ctx, LOOT[id].label + ' x' + n, 26, ly, PAL.cream, 7);
    uiText(ctx, Math.round(LOOT[id].price * n * bonus) + 'o', 222, ly, PAL.gold, 7, 'right');
    ly += 11;
  }
  if (entries.length > 13) uiText(ctx, '...y ' + (entries.length - 13) + ' más', 26, ly, PAL.lgray, 7);
  if (bonus > 1) uiText(ctx, '¡Bono de trampero +50%!', 118, 212, PAL.lime, 7, 'center');
  // botón vender
  const sellSel = game.shopCursor === 0;
  ctx.fillStyle = sellSel ? PAL.dgreen : PAL.dgray;
  ctx.fillRect(28, 218, 180, 13);
  pixText(ctx, (sellSel ? '> ' : '') + 'VENDER TODO: ' + sellValue() + ' MONEDAS', 118, 221, 1, sellSel ? PAL.yellow : PAL.lgray, 'center');

  // panel derecho: mejoras
  ctx.fillStyle = 'rgba(51,60,87,0.6)';
  ctx.fillRect(236, 46, 236, 186);
  pixText(ctx, 'MEJORAS DEL EQUIPO', 354, 52, 1, PAL.white, 'center');
  for (let i = 0; i < UPGRADES.length; i++) {
    const u = UPGRADES[i];
    const sel = game.shopCursor === i + 1;
    const lvl = u.id === 'heal' ? 0 : game.upg[u.id];
    const maxed = u.id !== 'heal' && lvl >= u.max;
    const price = upgradePrice(u, lvl);
    const y = 62 + i * 28;
    ctx.fillStyle = sel ? 'rgba(37,113,121,0.8)' : 'rgba(26,28,44,0.6)';
    ctx.fillRect(242, y, 224, 25);
    if (sel) { ctx.strokeStyle = PAL.yellow; ctx.lineWidth = 1; ctx.strokeRect(242.5, y + 0.5, 223, 24); }
    uiText(ctx, (sel ? '> ' : '') + u.name, 247, y + 3, maxed ? PAL.gray : PAL.cream, 7);
    uiText(ctx, u.desc, 247, y + 13, PAL.lgray, 7);
    if (maxed) uiText(ctx, 'MAX', 461, y + 3, PAL.lime, 7, 'right');
    else uiText(ctx, price + 'o', 461, y + 3, game.coins >= price ? PAL.gold : PAL.red, 7, 'right');
    // puntos de nivel
    if (u.max > 1 && u.max < 90) {
      for (let d = 0; d < u.max; d++) {
        ctx.fillStyle = d < lvl ? PAL.lime : PAL.dgray;
        ctx.fillRect(430 + d * 6, y + 16, 4, 4);
      }
    }
  }

  // pie
  drawSpr(ctx, 'coin', 0, VW / 2 - 60, 238);
  pixText(ctx, '' + game.coins + ' MONEDAS', VW / 2 - 48, 240, 1, PAL.gold, 'left');
  const contSel = game.shopCursor === shopItems() - 1;
  ctx.fillStyle = contSel ? PAL.dgreen : PAL.dgray;
  ctx.fillRect(VW / 2 + 30, 236, 130, 14);
  pixText(ctx, (contSel ? '> ' : '') + 'CONTINUAR', VW / 2 + 95, 240, 1, contSel ? PAL.yellow : PAL.lgray, 'center');
  pixText(ctx, 'W-S: MOVER   F-ENTER: ELEGIR', VW / 2, 258, 1, PAL.dgray, 'center');
  if (game.soldTotal > 0) uiText(ctx, '¡Vendido por ' + game.soldTotal + ' monedas!', 118, 240, PAL.lime, 7, 'center');
}

function renderVictory() {
  drawBG('artico', game.time * 0.2);
  ctx.fillStyle = 'rgba(15,15,27,0.6)';
  ctx.fillRect(0, 0, VW, VH);
  pixText(ctx, '¡VICTORIA!', VW / 2, 60, 4, PAL.gold, 'center');
  pixText(ctx, 'CONQUISTASTE LOS 5 MUNDOS', VW / 2, 100, 1, PAL.white, 'center');
  pixText(ctx, 'MONEDAS: ' + game.coins, VW / 2, 130, 1, PAL.gold, 'center');
  const trophies = Object.keys(game.inv).filter(k => k.startsWith('trofeo_')).length;
  pixText(ctx, 'TROFEOS DE JEFE: ' + trophies, VW / 2, 145, 1, PAL.orange, 'center');
  pixText(ctx, 'GRACIAS POR JUGAR', VW / 2, 180, 1, PAL.lime, 'center');
  if (Math.floor(game.time / 30) % 2 === 0) pixText(ctx, 'F PARA VOLVER AL MAPA', VW / 2, 220, 1, PAL.lgray, 'center');
  // desfile de animales
  const parade = ['venado', 'oso', 'jaguar', 'cebra', 'pinguino', 'leon'];
  for (let i = 0; i < parade.length; i++) {
    const px = ((game.time * 0.8 + i * 90) % (VW + 120)) - 60;
    drawSpr(ctx, parade[i], Math.floor(game.time / 9) % 2, px, 232);
  }
}

// ---------- BUCLE PRINCIPAL ----------
let lastT = 0, acc = 0;
function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(50, t - lastT);
  lastT = t;
  acc += dt;
  while (acc >= 1000 / 60) {
    acc -= 1000 / 60;
    tick();
    // limpiar "pressed" al final de cada tick lógico
    for (const k in pressed) pressed[k] = false;
  }
  render();
}

function tick() {
  game.time++;
  switch (game.state) {
    case 'title': updateTitle(); break;
    case 'players': updatePlayers(); break;
    case 'charsel': updateCharsel(); break;
    case 'map': updateMap(); break;
    case 'play': updatePlay(); break;
    case 'shop': updateShop(); break;
    case 'victory': updateVictory(); break;
  }
}

function render() {
  ctx.clearRect(0, 0, VW, VH);
  switch (game.state) {
    case 'title': renderTitle(); break;
    case 'players': renderPlayers(); break;
    case 'charsel': renderCharsel(); break;
    case 'map': renderMap(); break;
    case 'play': renderPlay(); break;
    case 'shop': renderShop(); break;
    case 'victory': renderVictory(); break;
  }
}

// ---------- ARRANQUE ----------
initSprites();
loadSave();
AudioSys.playMusic(6);
requestAnimationFrame(frame);
