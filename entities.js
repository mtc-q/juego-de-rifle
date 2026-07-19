'use strict';
// ============ ENTIDADES Y FÍSICA ============

const GRAV = 0.35;
const MAX_FALL = 7.5;

let LEVEL = null;   // nivel actual (lo fija game.js)
let GAME = null;    // estado global del juego (lo fija game.js)

function setPhysicsWorld(level, game) { LEVEL = level; GAME = game; }

function tileAt(px, py) {
  if (!LEVEL) return 0;
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  if (tx < 0 || tx >= LEVEL.wT) return 1;      // paredes en los bordes
  if (ty < 0 || ty >= LEVEL.hT) return 0;      // cielo y abismo abiertos
  return LEVEL.grid[ty * LEVEL.wT + tx];
}

// Movimiento con colisión contra el grid + plataformas-entidad (GAME.plats)
function moveAndCollide(e) {
  e.hitWall = false;
  // --- horizontal ---
  e.x += e.vx;
  if (e.vx > 0) {
    const edge = e.x + e.w;
    for (const sy of [e.y + 1, e.y + e.h / 2, e.y + e.h - 1]) {
      if (tileAt(edge, sy) === 1) {
        e.x = Math.floor(edge / TILE) * TILE - e.w - 0.01;
        e.vx = 0; e.hitWall = true; break;
      }
    }
  } else if (e.vx < 0) {
    for (const sy of [e.y + 1, e.y + e.h / 2, e.y + e.h - 1]) {
      if (tileAt(e.x, sy) === 1) {
        e.x = (Math.floor(e.x / TILE) + 1) * TILE + 0.01;
        e.vx = 0; e.hitWall = true; break;
      }
    }
  }
  // --- vertical ---
  e.vy = Math.min(e.vy + GRAV, MAX_FALL);
  const oldFeet = e.y + e.h;
  e.y += e.vy;
  e.onGround = false;
  e.groundPlat = null;
  e.onIce = false;
  if (e.vy >= 0) {
    const feet = e.y + e.h;
    for (const sx of [e.x + 1, e.x + e.w - 1]) {
      const t = tileAt(sx, feet);
      const ty = Math.floor(feet / TILE);
      if (t === 1 || (t === 2 && !e.dropTimer && oldFeet <= ty * TILE + 4)) {
        e.y = ty * TILE - e.h;
        e.vy = 0; e.onGround = true;
        if (LEVEL.biome === 'artico' && t === 1) e.onIce = true;
        break;
      }
    }
    // plataformas móviles / que se desmoronan
    if (!e.onGround && GAME && GAME.plats) {
      for (const p of GAME.plats) {
        if (!p.solid) continue;
        const feet2 = e.y + e.h;
        if (e.x + e.w > p.x && e.x < p.x + p.w && oldFeet <= p.y + 5 && feet2 >= p.y && !e.dropTimer) {
          e.y = p.y - e.h;
          e.vy = 0; e.onGround = true; e.groundPlat = p;
          break;
        }
      }
    }
  } else {
    // cabeza contra el techo
    for (const sx of [e.x + 1, e.x + e.w - 1]) {
      if (tileAt(sx, e.y) === 1) {
        e.y = (Math.floor(e.y / TILE) + 1) * TILE + 0.01;
        e.vy = 0; break;
      }
    }
  }
  // picos
  e.touchSpike = false;
  for (const [sx, sy] of [[e.x + 2, e.y + e.h - 2], [e.x + e.w - 2, e.y + e.h - 2], [e.x + e.w / 2, e.y + e.h / 2]]) {
    if (tileAt(sx, sy) === 3) { e.touchSpike = true; break; }
  }
  if (e.dropTimer > 0) e.dropTimer--;
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ============ JUGADOR ============
class Player {
  constructor(idx, charIdx) {
    this.idx = idx;                  // 0 = P1 (WASD+F), 1 = P2 (flechas+guion)
    this.charIdx = charIdx;
    this.def = CHARS[charIdx];
    this.w = 10; this.h = 17;
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.hp = this.maxHp();
    this.fireCd = 0;
    this.invuln = 0;
    this.dead = false;
    this.deadTimer = 0;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.jumpsLeft = 0;
    this.dropTimer = 0;
    this.animT = 0;
    this.muzzleT = 0;
  }
  maxHp() { return this.def.hp + (GAME ? GAME.upg.hp : 0); }
  speed() { return 1.9 * this.def.speed * (1 + (GAME ? GAME.upg.speed : 0) * 0.08); }
  jumpPow() { return 6.6 * this.def.jump; }
  damage() { return this.def.dmg + (GAME ? GAME.upg.dmg : 0); }
  fireDelay() { return Math.max(6, Math.round(this.def.fireCd * Math.pow(0.85, GAME ? GAME.upg.firerate : 0))); }

  update(inp) {
    if (this.dead) { this.deadTimer--; return; }
    const acc = this.onIce ? 0.08 : 0.4;
    const fric = this.onIce ? 0.985 : (this.onGround ? 0.75 : 0.92);
    const top = this.speed();
    if (inp.left)  { this.vx -= acc; this.facing = -1; }
    if (inp.right) { this.vx += acc; this.facing = 1; }
    if (!inp.left && !inp.right) this.vx *= fric;
    this.vx = Math.max(-top, Math.min(top, this.vx));

    // salto con coyote time y buffer
    if (this.onGround) { this.coyote = 7; this.jumpsLeft = (GAME && GAME.upg.djump) ? 1 : 0; }
    else if (this.coyote > 0) this.coyote--;
    if (inp.jumpPressed) this.jumpBuf = 7;
    else if (this.jumpBuf > 0) this.jumpBuf--;

    if (this.jumpBuf > 0) {
      if (this.coyote > 0) {
        this.vy = -this.jumpPow(); this.coyote = 0; this.jumpBuf = 0;
        SFX.jump();
      } else if (this.jumpsLeft > 0) {
        this.vy = -this.jumpPow() * 0.92; this.jumpsLeft--; this.jumpBuf = 0;
        SFX.doubleJump();
        for (let i = 0; i < 6; i++) GAME.addParticle(this.x + this.w / 2, this.y + this.h, (Math.random() - 0.5) * 2, Math.random(), PAL.white, 20);
      }
    }
    // saltar más bajo si sueltas
    if (!inp.jump && this.vy < -2.5) this.vy = -2.5;
    // bajar de plataformas una-vía
    if (inp.down && inp.jumpPressed) this.dropTimer = 10;

    moveAndCollide(this);
    if (this.groundPlat) this.x += this.groundPlat.dx || 0;

    // disparo
    if (this.fireCd > 0) this.fireCd--;
    if (inp.fire && this.fireCd <= 0 && !this.dead) {
      this.fireCd = this.fireDelay();
      const drawX = this.x - 7, drawY = this.y - 1;
      const mx = this.facing === 1 ? drawX + MUZZLE.x : drawX + (24 - 1 - MUZZLE.x);
      const my = drawY + MUZZLE.y;
      GAME.bullets.push({ x: mx, y: my, vx: this.facing * this.def.bulletSpd, dmg: this.damage(), dist: 0, owner: this.idx });
      this.muzzleT = 4;
      this.vx -= this.facing * 0.3;
      this.def.dmg >= 4 ? SFX.shootBig() : SFX.shoot();
      for (let i = 0; i < 3; i++) GAME.addParticle(mx + this.facing * 2, my, this.facing * (1 + Math.random() * 2), (Math.random() - 0.5), PAL.yellow, 8);
    }
    if (this.muzzleT > 0) this.muzzleT--;
    if (this.invuln > 0) this.invuln--;
    if (this.touchSpike) this.hurt(1, -this.facing);

    this.animT++;
  }

  hurt(dmg, dir) {
    if (this.invuln > 0 || this.dead) return;
    this.hp -= dmg;
    this.invuln = 80;
    this.vx = (dir || -this.facing) * 2.8;
    this.vy = -3;
    SFX.hurt();
    GAME.shake = 6;
    for (let i = 0; i < 8; i++) GAME.addParticle(this.x + this.w / 2, this.y + this.h / 2, (Math.random() - 0.5) * 3, -Math.random() * 2, PAL.red, 25);
    if (this.hp <= 0) {
      this.dead = true;
      this.deadTimer = 240;
      SFX.dead();
    }
  }

  respawn(x, y) {
    this.dead = false;
    this.hp = Math.max(2, Math.ceil(this.maxHp() / 2));
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.invuln = 120;
  }

  draw(g) {
    if (this.dead) return;
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0) return;
    let frame = 0;
    if (!this.onGround) frame = 3;
    else if (Math.abs(this.vx) > 0.4) frame = 1 + (Math.floor(this.animT / 7) % 2);
    const drawX = this.x - 7, drawY = this.y - 1;
    drawSpr(g, 'char_' + this.def.id, frame, drawX, drawY, this.facing === -1);
    if (this.muzzleT > 0) {
      const mx = this.facing === 1 ? drawX + MUZZLE.x : drawX + (24 - 1 - MUZZLE.x);
      g.fillStyle = PAL.yellow;
      g.fillRect(mx - 1 + this.facing * 2, drawY + MUZZLE.y - 2, 4, 4);
      g.fillStyle = PAL.white;
      g.fillRect(mx + this.facing * 2, drawY + MUZZLE.y - 1, 2, 2);
    }
  }
}

// ============ ANIMAL ============
class Animal {
  constructor(id, x, y) {
    this.id = id;
    this.def = ANIMALS[id];
    const s = SPR[this.def.spr];
    this.w = Math.max(8, s.w - 6);
    this.h = s.h;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.hp = this.def.hp;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.dead = false;          // carcass = muerto pero recogible
    this.collected = false;
    this.flash = 0;
    this.animT = Math.floor(Math.random() * 60);
    this.stateT = 0;
    this.fleeing = 0;
    this.fly = this.def.behavior === 'fly' || this.def.behavior === 'dive';
    this.baseY = y;
    this.diving = 0;
    this.throwCd = 60 + Math.random() * 60;
  }

  nearestPlayer() {
    let best = null, bd = 1e9;
    for (const p of GAME.players) {
      if (p.dead) continue;
      const d = Math.abs(p.x - this.x) + Math.abs(p.y - this.y) * 0.5;
      if (d < bd) { bd = d; best = p; }
    }
    return { p: best, d: bd };
  }

  update() {
    this.animT++;
    if (this.flash > 0) this.flash--;
    if (this.dead) {
      // el cadáver cae hasta el suelo y se queda
      if (!this.onGround) { this.vx *= 0.9; moveAndCollide(this); }
      return;
    }
    const { p, d } = this.nearestPlayer();
    const b = this.def.behavior;

    if (this.fly) {
      // voladores: onda sinusoidal; el buitre se lanza en picada
      if (b === 'dive' && p) {
        if (this.diving > 0) {
          this.diving--;
          this.x += this.vx; this.y += this.vy;
          if (this.diving === 0 || this.y > this.baseY + 90) { this.vy = -1.2; }
        } else if (d < 110 && Math.abs(p.y - this.y) < 120 && Math.random() < 0.01) {
          this.diving = 50;
          const dx = (p.x - this.x), dy = (p.y - this.y);
          const len = Math.hypot(dx, dy) || 1;
          this.vx = dx / len * 2.2; this.vy = dy / len * 2.2;
          this.facing = dx > 0 ? 1 : -1;
        } else {
          if (this.y > this.baseY) this.y -= 0.8; else this.y = this.baseY + Math.sin(this.animT / 25) * 6;
          this.x += this.facing * this.def.speed * 0.6;
          if (this.x < 16 || this.x > LEVEL.wT * TILE - 32 || Math.random() < 0.004) this.facing *= -1;
        }
      } else {
        this.y = this.baseY + Math.sin(this.animT / 25) * 6;
        this.x += this.facing * this.def.speed * 0.6;
        if (this.x < 16 || this.x > LEVEL.wT * TILE - 32 || Math.random() < 0.004) this.facing *= -1;
      }
      return;
    }

    // terrestres
    let want = 0;
    if (this.fleeing > 0) {
      this.fleeing--;
      want = this.facing * this.def.speed * 1.9;
    } else if (b === 'flee') {
      if (p && d < 85) { this.facing = p.x > this.x ? -1 : 1; this.fleeing = 70; }
      else if (this.stateT-- <= 0) { this.stateT = 40 + Math.random() * 80; this.facing = Math.random() < 0.5 ? -1 : 1; if (Math.random() < 0.4) this.facing = 0; }
      want = this.facing * this.def.speed * 0.5;
    } else if (b === 'chase') {
      if (p && d < 130) {
        this.facing = p.x > this.x ? 1 : -1;
        want = this.facing * this.def.speed * 1.4;
        // saltar obstáculos
        if (this.hitWall && this.onGround) this.vy = -5;
      } else {
        if (this.stateT-- <= 0) { this.stateT = 50 + Math.random() * 60; this.facing *= Math.random() < 0.6 ? -1 : 1; }
        want = this.facing * this.def.speed * 0.4;
      }
    } else if (b === 'patrol') {
      want = this.facing * this.def.speed * 0.6;
    } else if (b === 'throw') {
      if (p && d < 150) {
        this.facing = p.x > this.x ? 1 : -1;
        if (--this.throwCd <= 0) {
          this.throwCd = 110 + Math.random() * 50;
          const dx = p.x - this.x;
          GAME.eprojs.push({ x: this.x + this.w / 2, y: this.y, vx: dx / 60, vy: -4.5, w: 6, h: 6, spr: 'coco', grav: true, dmg: 1 });
          SFX.throw_();
        }
      }
      want = 0;
    }

    // no caminar hacia el vacío (excepto huyendo)
    if (want !== 0 && this.onGround && this.fleeing <= 0) {
      const aheadX = want > 0 ? this.x + this.w + 4 : this.x - 4;
      if (tileAt(aheadX, this.y + this.h + 8) === 0 && tileAt(aheadX, this.y + this.h + 24) === 0) {
        this.facing *= -1; want = -want;
      }
    }
    this.vx = want;
    if (this.facing !== 0 && want !== 0) this.facing = want > 0 ? 1 : -1;
    moveAndCollide(this);
    if (this.hitWall) this.facing *= -1;
  }

  hit(dmg, fromDir) {
    if (this.dead) return;
    this.hp -= dmg;
    this.flash = 6;
    if (this.def.behavior === 'flee' || this.def.behavior === 'throw') {
      this.facing = fromDir > 0 ? 1 : -1;
      this.fleeing = 90;
    }
    if (this.hp <= 0) this.die();
    else SFX.hitAnimal();
  }

  die() {
    this.dead = true;
    this.vx = 0;
    SFX.animalDie();
    for (let i = 0; i < 10; i++) GAME.addParticle(this.x + this.w / 2, this.y + this.h / 2, (Math.random() - 0.5) * 3, -Math.random() * 2.5, Math.random() < 0.5 ? PAL.red : PAL.blood, 30);
    // monedas al morir
    for (let i = 0; i < this.def.coins; i++) {
      GAME.drops.push({ type: 'coin', x: this.x + this.w / 2, y: this.y, vx: (Math.random() - 0.5) * 2.5, vy: -2 - Math.random() * 2, t: 0 });
    }
  }

  draw(g) {
    const s = SPR[this.def.spr];
    const frame = Math.abs(this.vx) > 0.05 || this.fly ? Math.floor(this.animT / 9) % 2 : 0;
    const dx = this.x - (s.w - this.w) / 2, dy = this.y + this.h - s.h;
    if (this.dead) {
      g.save();
      g.globalAlpha = 0.9;
      drawSprV(g, this.def.spr, 0, dx, dy, this.facing === -1);
      g.restore();
      // charquito
      g.fillStyle = PAL.blood;
      g.fillRect(Math.round(dx + 2), Math.round(this.y + this.h - 1), s.w - 4, 1);
      // indicador de recogida
      const t = Math.floor(Date.now() / 300) % 2;
      if (t === 0) {
        g.fillStyle = PAL.yellow;
        const ax = Math.round(dx + s.w / 2);
        const ay = Math.round(dy - 8);
        g.fillRect(ax - 1, ay, 2, 4);
        g.fillRect(ax - 3, ay + 2, 6, 2);
        g.fillRect(ax - 2, ay + 4, 4, 1);
      }
      return;
    }
    if (this.flash > 0) {
      g.save();
      g.globalAlpha = 0.6;
      g.fillStyle = PAL.white;
      g.fillRect(Math.round(dx), Math.round(dy), s.w, s.h);
      g.restore();
    }
    drawSpr(g, this.def.spr, frame, dx, dy, this.facing === -1);
  }
}

// ============ BOSS ============
class Boss {
  constructor(bossIdx, x, y) {
    this.def = BOSSES[bossIdx];
    this.bossIdx = bossIdx;
    this.w = this.def.w; this.h = this.def.h;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.hp = this.def.hp * (GAME && GAME.players.length > 1 ? 1.4 : 1);
    this.maxHpV = this.hp;
    this.facing = -1;
    this.state = 'intro';
    this.stateT = 90;
    this.flash = 0;
    this.animT = 0;
    this.attackN = 0;
    this.dead = false;
    this.underground = false;
  }

  target() {
    let best = null, bd = 1e9;
    for (const p of GAME.players) {
      if (p.dead) continue;
      const d = Math.abs(p.x - this.x);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  update() {
    this.animT++;
    if (this.flash > 0) this.flash--;
    if (this.dead) { this.deadT = (this.deadT || 0) + 1; return; }
    // nunca salir de la arena
    this.x = Math.max(3 * TILE, Math.min((LEVEL.wT - 3) * TILE - this.w, this.x));
    const t = this.target();
    this.stateT--;

    switch (this.state) {
      case 'intro':
        moveAndCollide(this);
        if (this.stateT <= 0) { this.next(); }
        break;
      case 'idle':
        this.vx *= 0.8;
        moveAndCollide(this);
        if (t) this.facing = t.x > this.x ? 1 : -1;
        if (this.stateT <= 0) this.pickAttack();
        break;
      case 'telegraph':
        this.vx = 0;
        moveAndCollide(this);
        if (this.stateT <= 0) this.startAttack();
        break;
      case 'charge':
        this.vx = this.facing * (2.2 + this.def.speed);
        moveAndCollide(this);
        if (this.hitWall || this.stateT <= 0) { GAME.shake = 8; SFX.bossHit(); this.next(); }
        break;
      case 'pounce':
        moveAndCollide(this);
        if (this.onGround && this.vy >= 0 && this.stateT < 40) { GAME.shake = 10; this.next(); }
        break;
      case 'slamRise':
        this.vy = -7.5;
        this.x += this.facing * 2;
        this.y += this.vy;
        if (this.stateT <= 0) { this.state = 'slamFall'; this.stateT = 200; this.vy = 1; }
        break;
      case 'slamFall': {
        this.vy = Math.min(this.vy + 0.5, 9);
        this.y += this.vy;
        const gy = (LEVEL.hT - 5) * TILE;
        if (this.y + this.h >= gy) {
          this.y = gy - this.h;
          GAME.shake = 14;
          SFX.bossRoar();
          // lluvia de escombros
          const n = 5 + this.bossIdx;
          for (let i = 0; i < n; i++) {
            GAME.eprojs.push({
              x: 40 + Math.random() * (LEVEL.wT * TILE - 80),
              y: GAME.camY - 10 - Math.random() * 60,
              vx: 0, vy: 1 + Math.random(), w: 7, h: 7,
              spr: this.def.proj || 'rock', grav: true, dmg: 1,
            });
          }
          this.next();
        }
        break;
      }
      case 'volley': {
        moveAndCollide(this);
        if (this.stateT % 22 === 0 && t) {
          const dx = t.x - this.x, dist = Math.abs(dx) || 1;
          GAME.eprojs.push({
            x: this.x + this.w / 2, y: this.y + this.h * 0.3,
            vx: (dx / dist) * 2.6, vy: -3 - Math.random() * 1.5,
            w: 7, h: 6, spr: this.def.proj || 'stinger', grav: true, dmg: 1,
          });
          SFX.throw_();
        }
        if (this.stateT <= 0) this.next();
        break;
      }
      case 'roar': {
        moveAndCollide(this);
        if (this.stateT % 30 === 0 && t) {
          GAME.eprojs.push({
            x: this.x + (this.facing === 1 ? this.w : -10), y: this.y + this.h * 0.35,
            vx: this.facing * 2.2, vy: 0, w: 10, h: 10, spr: 'roarwave', grav: false, dmg: 1,
          });
          SFX.bossRoar();
        }
        if (this.stateT <= 0) this.next();
        break;
      }
      case 'summon': {
        this.vx = 0;
        moveAndCollide(this);
        if (this.stateT === 30 && this.def.minion) {
          SFX.bossRoar();
          const nMin = GAME.animals.filter(a => !a.dead && a.summoned).length;
          if (nMin < 4) {
            for (const off of [-50, 50]) {
              const a = new Animal(this.def.minion, this.x + off, this.y);
              a.summoned = true;
              GAME.animals.push(a);
            }
          }
        }
        if (this.stateT <= 0) this.next();
        break;
      }
      case 'burrowDown':
        this.y += 1.5;
        this.underground = true;
        if (this.stateT <= 0) { this.state = 'burrowMove'; this.stateT = 60; }
        break;
      case 'burrowMove':
        if (t) this.x += (t.x - this.w / 2 - this.x) * 0.06;
        if (this.stateT <= 0) { this.state = 'burrowUp'; this.stateT = 30; GAME.shake = 6; }
        break;
      case 'burrowUp': {
        const gy = (LEVEL.hT - 5) * TILE;
        this.y = Math.max(gy - this.h, this.y - 4);
        if (this.stateT <= 0) {
          this.underground = false;
          // rocío de aguijones al salir
          for (let i = -2; i <= 2; i++) {
            GAME.eprojs.push({ x: this.x + this.w / 2, y: this.y, vx: i * 1.2, vy: -4, w: 7, h: 6, spr: 'stinger', grav: true, dmg: 1 });
          }
          this.next();
        }
        break;
      }
    }
  }

  next() { this.state = 'idle'; this.stateT = 50 + Math.random() * 40; }

  pickAttack() {
    const atk = this.def.attacks[this.attackN % this.def.attacks.length];
    this.attackN++;
    this.pending = atk;
    this.state = 'telegraph';
    this.stateT = 35;
    const t = this.target();
    if (t) this.facing = t.x > this.x ? 1 : -1;
  }

  startAttack() {
    const a = this.pending;
    if (a === 'charge')      { this.state = 'charge'; this.stateT = 90; SFX.bossRoar(); }
    else if (a === 'pounce') { this.state = 'pounce'; this.stateT = 120; this.vy = -8; this.vx = this.facing * 3; }
    else if (a === 'slam')   { this.state = 'slamRise'; this.stateT = 30; }
    else if (a === 'volley') { this.state = 'volley'; this.stateT = 88; }
    else if (a === 'roar')   { this.state = 'roar'; this.stateT = 90; }
    else if (a === 'summon') { this.state = 'summon'; this.stateT = 60; }
    else if (a === 'burrow') { this.state = 'burrowDown'; this.stateT = 40; }
    else this.next();
  }

  hit(dmg) {
    if (this.dead || this.underground || this.state === 'intro') return false;
    this.hp -= dmg;
    this.flash = 5;
    SFX.bossHit();
    if (this.hp <= 0) {
      this.dead = true;
      SFX.bossDie();
      GAME.shake = 20;
      GAME.onBossDead(this);
    }
    return true;
  }

  draw(g) {
    if (this.underground) {
      // polvo donde está enterrado
      g.fillStyle = PAL.dsand;
      for (let i = 0; i < 5; i++) {
        g.fillRect(Math.round(this.x + Math.random() * this.w), Math.round((LEVEL.hT - 5) * TILE - 3 - Math.random() * 4), 2, 2);
      }
      return;
    }
    if (this.dead && this.deadT > 90) return;
    const s = SPR[this.def.spr];
    const frame = Math.abs(this.vx) > 0.3 ? Math.floor(this.animT / 8) % 2 : 0;
    const sc = this.def.scale;
    const dx = this.x - (s.w * sc - this.w) / 2;
    const dy = this.y + this.h - s.h * sc;
    // temblor en telegraph
    const wob = this.state === 'telegraph' ? Math.round(Math.sin(this.animT * 1.6) * 2) : 0;
    if (this.flash > 0) g.globalAlpha = 0.55;
    if (this.dead) g.globalAlpha = Math.max(0, 1 - this.deadT / 90);
    const img = this.facing === -1 ? s.flip[frame] : s.frames[frame];
    g.drawImage(img, Math.round(dx + wob), Math.round(dy), Math.round(s.w * sc), Math.round(s.h * sc));
    g.globalAlpha = 1;
  }
}
