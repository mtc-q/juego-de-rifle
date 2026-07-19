'use strict';
// ============ NIVELES, ANIMALES, ECONOMÍA, BOSSES ============

const TILE = 16;
const BIOMES = ['bosque', 'jungla', 'desierto', 'sabana', 'artico'];
const BIOME_LABEL = { bosque: 'Bosque', jungla: 'Jungla', desierto: 'Desierto', sabana: 'Sabana', artico: 'Ártico' };

// ---- Loot: id -> {label, price, icon} ----
const LOOT = {
  carne_conejo:   { label: 'Carne de conejo',    price: 3,  icon: 'meat' },
  carne_venado:   { label: 'Carne de venado',    price: 6,  icon: 'meat' },
  piel_venado:    { label: 'Piel de venado',     price: 9,  icon: 'pelt' },
  carne_jabali:   { label: 'Carne de jabalí',    price: 8,  icon: 'meat' },
  colmillo_jabali:{ label: 'Colmillo de jabalí', price: 10, icon: 'pelt' },
  carne_oso:      { label: 'Carne de oso',       price: 10, icon: 'meat' },
  piel_oso:       { label: 'Piel de oso',        price: 18, icon: 'pelt' },
  pluma_tucan:    { label: 'Pluma de tucán',     price: 7,  icon: 'pelt' },
  carne_mono:     { label: 'Carne de mono',      price: 5,  icon: 'meat' },
  piel_serpiente: { label: 'Piel de serpiente',  price: 12, icon: 'pelt' },
  carne_jaguar:   { label: 'Carne de jaguar',    price: 8,  icon: 'meat' },
  piel_jaguar:    { label: 'Piel de jaguar',     price: 20, icon: 'pelt' },
  piel_lagarto:   { label: 'Piel de lagarto',    price: 5,  icon: 'pelt' },
  pluma_buitre:   { label: 'Pluma de buitre',    price: 6,  icon: 'pelt' },
  aguijon:        { label: 'Aguijón',            price: 8,  icon: 'pelt' },
  carne_coyote:   { label: 'Carne de coyote',    price: 6,  icon: 'meat' },
  piel_coyote:    { label: 'Piel de coyote',     price: 10, icon: 'pelt' },
  carne_gacela:   { label: 'Carne de gacela',    price: 7,  icon: 'meat' },
  piel_gacela:    { label: 'Piel de gacela',     price: 10, icon: 'pelt' },
  carne_cebra:    { label: 'Carne de cebra',     price: 9,  icon: 'meat' },
  piel_cebra:     { label: 'Piel de cebra',      price: 14, icon: 'pelt' },
  piel_hiena:     { label: 'Piel de hiena',      price: 11, icon: 'pelt' },
  carne_leon:     { label: 'Carne de león',      price: 10, icon: 'meat' },
  piel_leon:      { label: 'Piel de león',       price: 24, icon: 'pelt' },
  carne_pinguino: { label: 'Carne de pingüino',  price: 6,  icon: 'meat' },
  carne_foca:     { label: 'Carne de foca',      price: 8,  icon: 'meat' },
  piel_foca:      { label: 'Piel de foca',       price: 12, icon: 'pelt' },
  carne_lobo:     { label: 'Carne de lobo',      price: 7,  icon: 'meat' },
  piel_lobo:      { label: 'Piel de lobo',       price: 16, icon: 'pelt' },
  carne_osopolar: { label: 'Carne de oso polar', price: 12, icon: 'meat' },
  piel_osopolar:  { label: 'Piel de oso polar',  price: 26, icon: 'pelt' },
  trofeo_oso:     { label: 'Trofeo: Oso Ancestral',     price: 100, icon: 'pelt' },
  trofeo_jaguar:  { label: 'Trofeo: Jaguar Emperador',  price: 130, icon: 'pelt' },
  trofeo_escorpion:{ label: 'Trofeo: Escorpión Colosal', price: 160, icon: 'pelt' },
  trofeo_leon:    { label: 'Trofeo: León Dorado',       price: 190, icon: 'pelt' },
  trofeo_mamut:   { label: 'Trofeo: Mamut Ancestral',   price: 250, icon: 'pelt' },
};

// ---- Animales: comportamiento y botín ----
// behavior: flee (huye), chase (persigue), patrol (patrulla, daña al contacto),
//           fly (vuela pasivo), dive (vuela y ataca), throw (lanza proyectiles)
const ANIMALS = {
  conejo:    { spr: 'conejo',    name: 'Conejo',     hp: 1, speed: 1.2, behavior: 'flee',   dmg: 0, loot: [['carne_conejo', 1]], coins: 1 },
  venado:    { spr: 'venado',    name: 'Venado',     hp: 3, speed: 1.0, behavior: 'flee',   dmg: 0, loot: [['carne_venado', 2], ['piel_venado', 1]], coins: 2 },
  jabali:    { spr: 'jabali',    name: 'Jabalí',     hp: 4, speed: 1.1, behavior: 'chase',  dmg: 1, loot: [['carne_jabali', 1], ['colmillo_jabali', 1]], coins: 2 },
  oso:       { spr: 'oso',       name: 'Oso',        hp: 8, speed: 0.7, behavior: 'chase',  dmg: 1, loot: [['carne_oso', 2], ['piel_oso', 1]], coins: 4 },
  tucan:     { spr: 'tucan',     name: 'Tucán',      hp: 2, speed: 0.8, behavior: 'fly',    dmg: 0, loot: [['pluma_tucan', 1]], coins: 1 },
  mono:      { spr: 'mono',      name: 'Mono',       hp: 2, speed: 0.9, behavior: 'throw',  dmg: 1, loot: [['carne_mono', 1]], coins: 2 },
  serpiente: { spr: 'serpiente', name: 'Serpiente',  hp: 2, speed: 0.5, behavior: 'patrol', dmg: 1, loot: [['piel_serpiente', 1]], coins: 2 },
  jaguar:    { spr: 'jaguar',    name: 'Jaguar',     hp: 6, speed: 1.4, behavior: 'chase',  dmg: 1, loot: [['carne_jaguar', 1], ['piel_jaguar', 1]], coins: 4 },
  lagarto:   { spr: 'lagarto',   name: 'Lagarto',    hp: 1, speed: 0.9, behavior: 'flee',   dmg: 0, loot: [['piel_lagarto', 1]], coins: 1 },
  buitre:    { spr: 'buitre',    name: 'Buitre',     hp: 2, speed: 1.0, behavior: 'dive',   dmg: 1, loot: [['pluma_buitre', 1]], coins: 2 },
  escorpion: { spr: 'escorpion', name: 'Escorpión',  hp: 2, speed: 0.5, behavior: 'patrol', dmg: 1, loot: [['aguijon', 1]], coins: 2 },
  coyote:    { spr: 'coyote',    name: 'Coyote',     hp: 4, speed: 1.3, behavior: 'chase',  dmg: 1, loot: [['carne_coyote', 1], ['piel_coyote', 1]], coins: 3 },
  gacela2:   { spr: 'gacela2',   name: 'Gacela',     hp: 3, speed: 1.5, behavior: 'flee',   dmg: 0, loot: [['carne_gacela', 2], ['piel_gacela', 1]], coins: 2 },
  cebra:     { spr: 'cebra',     name: 'Cebra',      hp: 5, speed: 1.2, behavior: 'flee',   dmg: 0, loot: [['carne_cebra', 2], ['piel_cebra', 1]], coins: 3 },
  hiena:     { spr: 'hiena',     name: 'Hiena',      hp: 4, speed: 1.3, behavior: 'chase',  dmg: 1, loot: [['piel_hiena', 1]], coins: 3 },
  leon:      { spr: 'leon',      name: 'León',       hp: 7, speed: 1.2, behavior: 'chase',  dmg: 1, loot: [['carne_leon', 2], ['piel_leon', 1]], coins: 5 },
  pinguino:  { spr: 'pinguino',  name: 'Pingüino',   hp: 1, speed: 0.7, behavior: 'flee',   dmg: 0, loot: [['carne_pinguino', 1]], coins: 1 },
  foca:      { spr: 'foca',      name: 'Foca',       hp: 2, speed: 0.6, behavior: 'flee',   dmg: 0, loot: [['carne_foca', 1], ['piel_foca', 1]], coins: 2 },
  lobo:      { spr: 'lobo',      name: 'Lobo',       hp: 5, speed: 1.4, behavior: 'chase',  dmg: 1, loot: [['carne_lobo', 1], ['piel_lobo', 1]], coins: 3 },
  osopolar:  { spr: 'osopolar',  name: 'Oso polar',  hp: 9, speed: 0.8, behavior: 'chase',  dmg: 1, loot: [['carne_osopolar', 2], ['piel_osopolar', 1]], coins: 5 },
};

// Pools por bioma con pesos [id, peso]
const BIOME_ANIMALS = {
  bosque:   [['conejo', 3], ['venado', 3], ['jabali', 2], ['oso', 1]],
  jungla:   [['tucan', 3], ['mono', 2], ['serpiente', 2], ['jaguar', 1]],
  desierto: [['lagarto', 3], ['buitre', 2], ['escorpion', 2], ['coyote', 1]],
  sabana:   [['gacela2', 3], ['cebra', 2], ['hiena', 2], ['leon', 1]],
  artico:   [['pinguino', 3], ['foca', 2], ['lobo', 2], ['osopolar', 1]],
};

// ---- Bosses (uno por mundo, nivel 4 de cada bioma) ----
const BOSSES = [
  { spr: 'boss_oso',       name: 'OSO ANCESTRAL',     scale: 3,   hp: 60,  speed: 1.0, w: 66, h: 48, attacks: ['charge', 'slam', 'summon'], minion: 'jabali',    proj: 'rock',     trophy: 'trofeo_oso',      coins: 30 },
  { spr: 'boss_jaguar',    name: 'JAGUAR EMPERADOR',  scale: 3,   hp: 75,  speed: 1.6, w: 66, h: 39, attacks: ['charge', 'pounce', 'summon'], minion: 'serpiente', proj: null,     trophy: 'trofeo_jaguar',   coins: 40 },
  { spr: 'boss_escorpion', name: 'ESCORPIÓN COLOSAL', scale: 3,   hp: 90,  speed: 0.9, w: 54, h: 36, attacks: ['volley', 'charge', 'burrow'], minion: null,       proj: 'stinger',  trophy: 'trofeo_escorpion', coins: 50 },
  { spr: 'boss_leon',      name: 'LEÓN DORADO',       scale: 3,   hp: 105, speed: 1.4, w: 66, h: 42, attacks: ['charge', 'roar', 'summon'],  minion: 'hiena',     proj: 'roarwave', trophy: 'trofeo_leon',     coins: 60 },
  { spr: 'mamut',          name: 'MAMUT ANCESTRAL',   scale: 2.5, hp: 130, speed: 1.1, w: 65, h: 50, attacks: ['charge', 'slam', 'volley'],  minion: 'lobo',      proj: 'icicle',   trophy: 'trofeo_mamut',    coins: 80 },
];

// ---- Personajes jugables ----
const CHARS = [
  { id: 'cazador',       name: 'CAZADOR',       desc: 'Equilibrado en todo',        hp: 6, speed: 1.0,  jump: 1.0,  dmg: 2, fireCd: 18, bulletSpd: 7 },
  { id: 'exploradora',   name: 'EXPLORADORA',   desc: 'Rápida y salta más alto',    hp: 4, speed: 1.25, jump: 1.1,  dmg: 2, fireCd: 16, bulletSpd: 7 },
  { id: 'tanque',        name: 'TANQUE',        desc: 'Mucha vida, pega duro',      hp: 9, speed: 0.8,  jump: 0.94, dmg: 3, fireCd: 26, bulletSpd: 6 },
  { id: 'francotirador', name: 'FRANCOTIRADOR', desc: 'Daño brutal, cadencia lenta', hp: 4, speed: 0.95, jump: 1.0, dmg: 5, fireCd: 34, bulletSpd: 11 },
  { id: 'trampero',      name: 'TRAMPERO',      desc: '+50% al vender pieles y carne', hp: 5, speed: 1.0, jump: 1.0, dmg: 2, fireCd: 20, bulletSpd: 7, sellBonus: 1.5 },
];

// ---- Mejoras de la tienda (aplican al equipo) ----
const UPGRADES = [
  { id: 'dmg',      name: 'Munición pesada',      desc: '+1 daño por bala',            base: 50,  scale: 1.7, max: 5 },
  { id: 'firerate', name: 'Cerrojo rápido',       desc: 'Disparas 15% más rápido',     base: 45,  scale: 1.7, max: 4 },
  { id: 'hp',       name: 'Corazón extra',        desc: '+1 vida máxima',              base: 40,  scale: 1.6, max: 5 },
  { id: 'speed',    name: 'Botas ligeras',        desc: '+8% velocidad',               base: 35,  scale: 1.7, max: 3 },
  { id: 'djump',    name: 'Botas de doble salto', desc: '¡Salto extra en el aire!',    base: 120, scale: 1,   max: 1 },
  { id: 'heal',     name: 'Botiquín',             desc: 'Cura toda la vida ya mismo',  base: 25,  scale: 1,   max: 99 },
];

function upgradePrice(u, lvl) { return Math.round(u.base * Math.pow(u.scale, lvl)); }

// ============ GENERADOR DE NIVELES ============
// Devuelve: {wT,hT,grid,biome,world,stage,idx,spawn,entities,decos,exitX,isBoss}
// grid: 0 aire, 1 sólido, 2 plataforma una-vía, 3 picos

function levelName(idx) {
  const world = Math.floor(idx / 4), stage = idx % 4;
  return BIOME_LABEL[BIOMES[world]] + ' ' + (stage + 1) + (stage === 3 ? ' — JEFE' : '');
}

function genLevel(idx) {
  const world = Math.floor(idx / 4), stage = idx % 4;
  const biome = BIOMES[world];
  const rnd = mulberry32(9000 + idx * 613);
  if (stage === 3) return genBossLevel(idx, world, biome, rnd);

  const diff = idx / 19; // 0..1
  const wT = 140 + stage * 18 + world * 10;
  const hT = 34;
  const grid = new Uint8Array(wT * hT);
  const gh = new Int16Array(wT).fill(-1); // fila del suelo por columna (-1 = hueco)
  const entities = [], decos = [];

  const G = (x, y) => (y >= 0 && y < hT && x >= 0 && x < wT) ? grid[y * wT + x] : 1;
  const S = (x, y, v) => { if (y >= 0 && y < hT && x >= 0 && x < wT) grid[y * wT + x] = v; };

  let curH = hT - 6;
  let x = 0;
  const flatCols = []; // columnas planas donde poner animales/decos

  const setGround = (col, h) => { gh[col] = h; };
  const flat = len => { for (let i = 0; i < len && x < wT; i++, x++) { setGround(x, curH); flatCols.push(x); } };

  flat(10); // zona de aparición segura

  const gapMax = 3 + Math.floor(diff * 2);       // 3..5
  const features = ['flat', 'step', 'gap', 'platforms', 'spikes', 'tower', 'mplat', 'cplat', 'spring'];

  while (x < wT - 16) {
    const roll = rnd();
    let f;
    if (roll < 0.22) f = 'flat';
    else if (roll < 0.38) f = 'step';
    else if (roll < 0.52) f = 'gap';
    else if (roll < 0.62) f = 'platforms';
    else if (roll < 0.70) f = 'spikes';
    else if (roll < 0.78) f = 'tower';
    else if (roll < 0.86) f = 'mplat';
    else if (roll < 0.93) f = 'cplat';
    else f = 'spring';

    if (f === 'flat') {
      flat(4 + Math.floor(rnd() * 6));

    } else if (f === 'step') {
      const dh = (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * 2));
      curH = Math.max(hT - 18, Math.min(hT - 4, curH + dh));
      flat(4 + Math.floor(rnd() * 4));

    } else if (f === 'gap') {
      const gw = 2 + Math.floor(rnd() * (gapMax - 1));
      // monedas en arco sobre el hueco
      for (let i = 0; i < gw; i++) {
        entities.push({ type: 'coin', x: (x + i) * TILE + 4, y: (curH - 3 - Math.floor(Math.sin((i + 0.5) / gw * Math.PI) * 2)) * TILE });
      }
      if (gw >= 4) { // plataforma de apoyo al centro
        const px = x + Math.floor(gw / 2);
        S(px, curH - 1 + Math.floor(rnd() * 2), 2);
      }
      x += gw;
      flat(3 + Math.floor(rnd() * 3));

    } else if (f === 'platforms') {
      // ruta elevada opcional con monedas, suelo sigue abajo
      const n = 2 + Math.floor(rnd() * 3);
      let ph = curH - 4;
      for (let i = 0; i < n && x < wT - 16; i++) {
        const pw = 2 + Math.floor(rnd() * 2);
        for (let j = 0; j < pw; j++) { S(x + j, ph, 2); entities.push({ type: 'coin', x: (x + j) * TILE + 4, y: (ph - 2) * TILE }); }
        for (let j = 0; j < pw + 1; j++) { if (x < wT) { setGround(x, curH); x++; } }
        ph = Math.max(hT - 22, ph - (rnd() < 0.5 ? 2 : 0) + (rnd() < 0.3 ? 2 : 0));
      }
      flat(2);

    } else if (f === 'spikes') {
      const sw = 2 + Math.floor(rnd() * 2 + diff * 2);
      // plataforma de escape encima si es ancho
      if (sw >= 3) { for (let j = 0; j < 3; j++) S(x + Math.floor(sw / 2) - 1 + j, curH - 4, 2); }
      for (let i = 0; i < sw && x < wT - 16; i++) {
        setGround(x, curH);
        S(x, curH - 1, 3);
        x++;
      }
      flat(3 + Math.floor(rnd() * 3));

    } else if (f === 'tower') {
      // torre de parkour: sube en zigzag con monedas, gema arriba
      const steps = 3 + Math.floor(rnd() * 3);
      const baseX = x;
      flat(3);
      let ph = curH - 4, px = baseX + 1, dir = 1;
      for (let i = 0; i < steps; i++) {
        for (let j = 0; j < 2; j++) S(px + j, ph, 2);
        entities.push({ type: 'coin', x: px * TILE + 8, y: (ph - 2) * TILE });
        px += dir * 3; dir = -dir;
        ph -= 3;
        if (ph < 4) break;
      }
      entities.push({ type: 'gem', x: (px - dir * 3) * TILE + 8, y: (ph + 1) * TILE });
      flat(3 + Math.floor(rnd() * 3));

    } else if (f === 'mplat') {
      // hueco ancho con plataforma móvil
      const gw = 6 + Math.floor(rnd() * 3);
      entities.push({ type: 'mplat', x: x * TILE, y: (curH - 1) * TILE, w: 3 * TILE, axis: 'x', range: (gw - 3) * TILE, speed: 0.6 + diff * 0.5 });
      for (let i = 0; i < 3; i++) entities.push({ type: 'coin', x: (x + gw / 2 - 1 + i) * TILE, y: (curH - 4) * TILE });
      x += gw;
      flat(3 + Math.floor(rnd() * 3));

    } else if (f === 'cplat') {
      // puente de plataformas que se desmoronan
      const gw = 4 + Math.floor(rnd() * 3);
      for (let i = 0; i < gw; i += 2) {
        entities.push({ type: 'cplat', x: (x + i) * TILE, y: (curH - 1) * TILE, w: 2 * TILE });
      }
      x += gw;
      flat(3 + Math.floor(rnd() * 3));

    } else if (f === 'spring') {
      // resorte junto a una pared alta
      setGround(x, curH); flatCols.push(x);
      entities.push({ type: 'spring', x: x * TILE + 2, y: (curH - 1) * TILE + 8 });
      x++;
      const wallH = 5 + Math.floor(rnd() * 2);
      curH = Math.max(hT - 18, curH - wallH);
      flat(5 + Math.floor(rnd() * 3));
      // monedas premio arriba
      for (let i = 0; i < 3; i++) entities.push({ type: 'coin', x: (x - 4 + i) * TILE, y: (curH - 2) * TILE });
    }
  }
  // tramo final plano con salida
  curH = Math.max(curH, hT - 8);
  while (x < wT) { setGround(x, curH); x++; }
  const exitX = (wT - 5) * TILE;
  entities.push({ type: 'exit', x: exitX, y: (curH - 3) * TILE });

  // rellenar sólidos según gh
  for (let cx = 0; cx < wT; cx++) {
    if (gh[cx] < 0) continue;
    for (let cy = gh[cx]; cy < hT; cy++) if (G(cx, cy) === 0) S(cx, cy, 1);
  }

  // checkpoints en 40% y 70%
  for (const frac of [0.4, 0.7]) {
    let cx = Math.floor(wT * frac);
    while (cx < wT - 10 && gh[cx] < 0) cx++;
    if (gh[cx] >= 0) entities.push({ type: 'checkpoint', x: cx * TILE + 2, y: (gh[cx] - 2) * TILE - 4 });
  }

  // animales en columnas planas (lejos del spawn)
  const pool = BIOME_ANIMALS[biome];
  const totalW = pool.reduce((a, p) => a + p[1], 0);
  const nAnimals = 8 + stage * 3 + world * 2;
  const usable = flatCols.filter(c => c > 16 && c < wT - 8);
  for (let i = 0; i < nAnimals && usable.length; i++) {
    const c = usable[Math.floor(rnd() * usable.length)];
    let r = rnd() * totalW, id = pool[0][0];
    for (const [aid, w] of pool) { r -= w; if (r <= 0) { id = aid; break; } }
    const a = ANIMALS[id];
    const fly = a.behavior === 'fly' || a.behavior === 'dive';
    entities.push({ type: 'animal', id, x: c * TILE, y: (gh[c] - (fly ? 8 : 1)) * TILE - SPR[a.spr].h + (fly ? 0 : TILE) });
  }

  // monedas sueltas en el suelo
  for (let i = 0; i < 14; i++) {
    const c = usable[Math.floor(rnd() * usable.length)] || 12;
    entities.push({ type: 'coin', x: c * TILE + 4, y: (gh[c] - 2) * TILE });
  }

  // decoraciones
  const decoList = DECOS[biome];
  for (const c of flatCols) {
    if (rnd() < 0.09 && c > 2 && c < wT - 6 && gh[c] >= 0) {
      const d = decoList[Math.floor(rnd() * decoList.length)];
      decos.push({ img: d, x: c * TILE, y: gh[c] * TILE - d.height });
    }
  }

  return {
    idx, world, stage, biome, wT, hT, grid, entities, decos,
    spawn: { x: 3 * TILE, y: (hT - 6) * TILE - 40 },
    exitX, isBoss: false,
  };
}

function genBossLevel(idx, world, biome, rnd) {
  const wT = 60, hT = 22;
  const grid = new Uint8Array(wT * hT);
  const entities = [], decos = [];
  const gh = hT - 5;
  const S = (x, y, v) => { if (y >= 0 && y < hT && x >= 0 && x < wT) grid[y * wT + x] = v; };

  for (let x = 0; x < wT; x++) for (let y = gh; y < hT; y++) S(x, y, 1);
  // muros laterales altos
  for (let x = 0; x < 2; x++) for (let y = gh - 14; y < gh; y++) S(x, y, 1);
  for (let x = wT - 2; x < wT; x++) for (let y = gh - 14; y < gh; y++) S(x, y, 1);
  // plataformas para esquivar
  for (const [px, py, pw] of [[12, gh - 4, 4], [28, gh - 6, 5], [44, gh - 4, 4]]) {
    for (let i = 0; i < pw; i++) S(px + i, py, 2);
  }
  // decoraciones en los bordes
  const decoList = DECOS[biome];
  for (const dx of [4, 8, 50, 54]) {
    const d = decoList[Math.floor(rnd() * decoList.length)];
    decos.push({ img: d, x: dx * TILE, y: gh * TILE - d.height });
  }

  entities.push({ type: 'boss', bossIdx: world, x: (wT - 12) * TILE, y: gh * TILE - 150 });

  return {
    idx, world, stage: 3, biome, wT, hT, grid, entities, decos,
    spawn: { x: 5 * TILE, y: gh * TILE - 60 },
    exitX: Math.floor(wT / 2) * TILE, isBoss: true,
  };
}
