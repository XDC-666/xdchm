/*
 * 中国象棋引擎（纯逻辑，无 DOM 依赖）
 * 棋盘坐标：x 为列 0..8，y 为行 0..9。
 * 红方（RED）在下方（y=9 起始），黑方（BLACK）在上方（y=0 起始）。
 * 红方先行。
 */
(function (global) {
  'use strict';

  const RED = 'r';
  const BLACK = 'b';
  const MATE = 100000;

  // 子力价值（粗略）
  const VAL = { K: 6000, R: 600, C: 300, H: 285, E: 120, A: 120, P: 30 };

  // 棋子汉字
  const CHAR = {
    K: { r: '帅', b: '将' },
    A: { r: '仕', b: '士' },
    E: { r: '相', b: '象' },
    H: { r: '马', b: '马' },
    R: { r: '车', b: '车' },
    C: { r: '炮', b: '炮' },
    P: { r: '兵', b: '卒' }
  };

  function charOf(t, c) { return CHAR[t][c]; }

  function inBounds(x, y) { return x >= 0 && x < 9 && y >= 0 && y < 10; }
  function inPalace(x, y, c) {
    return x >= 3 && x <= 5 && (c === RED ? (y >= 7 && y <= 9) : (y >= 0 && y <= 2));
  }
  function opp(c) { return c === RED ? BLACK : RED; }

  function initialBoard() {
    const b = Array.from({ length: 9 }, () => Array(10).fill(null));
    const back = ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R'];
    for (let x = 0; x < 9; x++) {
      b[x][0] = { t: back[x], c: BLACK };
      b[x][9] = { t: back[x], c: RED };
    }
    b[1][2] = { t: 'C', c: BLACK }; b[7][2] = { t: 'C', c: BLACK };
    b[1][7] = { t: 'C', c: RED };   b[7][7] = { t: 'C', c: RED };
    for (let x = 0; x < 9; x += 2) {
      b[x][3] = { t: 'P', c: BLACK };
      b[x][6] = { t: 'P', c: RED };
    }
    return b;
  }

  function findGeneral(b, c) {
    for (let x = 0; x < 9; x++)
      for (let y = 0; y < 10; y++) {
        const p = b[x][y];
        if (p && p.t === 'K' && p.c === c) return [x, y];
      }
    return null;
  }

  // 判断 (x,y) 是否被 by 方攻击
  function isAttacked(b, x, y, by) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      let nx = x + dx, ny = y + dy, screen = 0;
      while (inBounds(nx, ny)) {
        const p = b[nx][ny];
        if (p) {
          if (screen === 0) {
            if (p.c === by) {
              if (p.t === 'R') return true;
              if (p.t === 'K' && Math.abs(dx + dy) === 1) return true;
            }
            screen = 1;
          } else {
            if (p.c === by && p.t === 'C') return true;
            break;
          }
        }
        nx += dx; ny += dy;
      }
    }

    // 马：马在 (x+dx, y+dy)，需检查蹩马腿
    for (const [dx, dy] of [[-1, -2], [1, -2], [-1, 2], [1, 2], [-2, -1], [2, -1], [-2, 1], [2, 1]]) {
      const hx = x + dx, hy = y + dy;
      if (!inBounds(hx, hy)) continue;
      const p = b[hx][hy];
      if (p && p.c === by && p.t === 'H') {
        const legX = Math.abs(dx) === 2 ? hx - Math.sign(dx) : hx;
        const legY = Math.abs(dy) === 2 ? hy - Math.sign(dy) : hy;
        if (!b[legX][legY]) return true;
      }
    }

    // 兵/卒
    if (by === RED) {
      if (inBounds(x, y + 1)) { const p = b[x][y + 1]; if (p && p.c === RED && p.t === 'P') return true; }
      if (y <= 4) {
        if (inBounds(x - 1, y)) { const p = b[x - 1][y]; if (p && p.c === RED && p.t === 'P') return true; }
        if (inBounds(x + 1, y)) { const p = b[x + 1][y]; if (p && p.c === RED && p.t === 'P') return true; }
      }
    } else {
      if (inBounds(x, y - 1)) { const p = b[x][y - 1]; if (p && p.c === BLACK && p.t === 'P') return true; }
      if (y >= 5) {
        if (inBounds(x - 1, y)) { const p = b[x - 1][y]; if (p && p.c === BLACK && p.t === 'P') return true; }
        if (inBounds(x + 1, y)) { const p = b[x + 1][y]; if (p && p.c === BLACK && p.t === 'P') return true; }
      }
    }
    return false;
  }

  function isGeneralInCheck(b, color) {
    const g = findGeneral(b, color);
    if (!g) return false;
    if (isAttacked(b, g[0], g[1], opp(color))) return true;
    const og = findGeneral(b, opp(color));
    if (og && og[0] === g[0]) {
      let between = false;
      for (let yy = Math.min(g[1], og[1]) + 1; yy < Math.max(g[1], og[1]); yy++) {
        if (b[g[0]][yy]) { between = true; break; }
      }
      if (!between) return true;
    }
    return false;
  }

  // 单个棋子的伪合法目标格（不含“走完是否被将”的过滤，也不含本方棋子排除的兜底——外层统一处理）
  function genPieceMoves(b, x, y) {
    const p = b[x][y];
    const c = p.c;
    const res = [];
    switch (p.t) {
      case 'K': {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (inPalace(nx, ny, c)) res.push([nx, ny]);
        }
        // 飞将：同一列上若直接面对敌方将，可“吃将”
        const dir = c === RED ? -1 : 1;
        let ny = y + dir;
        while (inBounds(x, ny)) {
          const q = b[x][ny];
          if (q) { if (q.t === 'K' && q.c !== c) res.push([x, ny]); break; }
          ny += dir;
        }
        break;
      }
      case 'A': {
        for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (inPalace(nx, ny, c)) res.push([nx, ny]);
        }
        break;
      }
      case 'E': {
        for (const [dx, dy] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
          const nx = x + dx, ny = y + dy;
          if (!inBounds(nx, ny)) continue;
          if (c === RED && ny < 5) continue;
          if (c === BLACK && ny > 4) continue;
          const ex = x + dx / 2, ey = y + dy / 2;
          if (b[ex][ey]) continue; // 象眼被塞
          res.push([nx, ny]);
        }
        break;
      }
      case 'H': {
        const targets = [[-1, -2], [1, -2], [-1, 2], [1, 2], [-2, -1], [2, -1], [-2, 1], [2, 1]];
        for (const [dx, dy] of targets) {
          const nx = x + dx, ny = y + dy;
          if (!inBounds(nx, ny)) continue;
          const legX = Math.abs(dx) === 2 ? x + dx / 2 : x;
          const legY = Math.abs(dy) === 2 ? y + dy / 2 : y;
          if (b[legX][legY]) continue; // 蹩马腿
          res.push([nx, ny]);
        }
        break;
      }
      case 'R': {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          let nx = x + dx, ny = y + dy;
          while (inBounds(nx, ny)) {
            const q = b[nx][ny];
            if (!q) { res.push([nx, ny]); }
            else { res.push([nx, ny]); break; }
            nx += dx; ny += dy;
          }
        }
        break;
      }
      case 'C': {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          let nx = x + dx, ny = y + dy;
          while (inBounds(nx, ny) && !b[nx][ny]) { res.push([nx, ny]); nx += dx; ny += dy; }
          if (inBounds(nx, ny)) {
            let mx = nx + dx, my = ny + dy;
            while (inBounds(mx, my)) {
              const q = b[mx][my];
              if (q) { if (q.c !== c) res.push([mx, my]); break; }
              mx += dx; my += dy;
            }
          }
        }
        break;
      }
      case 'P': {
        const fwd = c === RED ? -1 : 1;
        let ny = y + fwd;
        if (inBounds(x, ny)) res.push([x, ny]);
        const crossed = c === RED ? y <= 4 : y >= 5;
        if (crossed) {
          for (const dx of [-1, 1]) {
            const nx = x + dx;
            if (inBounds(nx, y)) res.push([nx, y]);
          }
        }
        break;
      }
    }
    return res;
  }

  function genAllPseudo(b, color) {
    const moves = [];
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 10; y++) {
        const p = b[x][y];
        if (!p || p.c !== color) continue;
        const tgs = genPieceMoves(b, x, y);
        for (const [tx, ty] of tgs) {
          const q = b[tx][ty];
          if (q && q.c === color) continue; // 不能吃自己
          moves.push({ from: [x, y], to: [tx, ty], piece: p });
        }
      }
    }
    return moves;
  }

  function legalMoves(b, color) {
    const res = [];
    const pseudo = genAllPseudo(b, color);
    for (const m of pseudo) {
      const cap = makeMove(b, m);
      if (!isGeneralInCheck(b, color)) res.push(m);
      undoMove(b, m, cap);
    }
    return res;
  }

  function makeMove(b, m) {
    const [fx, fy] = m.from, [tx, ty] = m.to;
    const cap = b[tx][ty];
    b[tx][ty] = b[fx][fy];
    b[fx][fy] = null;
    return cap;
  }
  function undoMove(b, m, cap) {
    const [fx, fy] = m.from, [tx, ty] = m.to;
    b[fx][fy] = b[tx][ty];
    b[tx][ty] = cap;
  }

  // 位置价值（以红方视角返回）
  function posValue(t, x, y) {
    switch (t) {
      case 'P': {
        let v = (9 - y) * 6;          // 越靠前越好
        if (y <= 4) v += 25;          // 已过河
        v += (4 - Math.abs(x - 4)) * 1;
        return v;
      }
      case 'H': return (4 - Math.abs(x - 4)) * 3 + (4 - Math.abs(y - 4)) * 1;
      case 'C': return (4 - Math.abs(x - 4)) * 3;
      case 'R': return (4 - Math.abs(x - 4)) * 1 + (4 - Math.abs(y - 4)) * 1;
      case 'E': return (x >= 3 && x <= 5) ? 6 : 0;
      case 'A': return 2;
      case 'K': return (x === 4) ? 8 : 3;
      default: return 0;
    }
  }

  function evaluate(b) {
    let s = 0;
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 10; y++) {
        const p = b[x][y];
        if (!p) continue;
        const base = VAL[p.t];
        const pos = p.c === RED ? posValue(p.t, x, y) : posValue(p.t, x, 9 - y);
        s += (p.c === RED ? 1 : -1) * (base + pos);
      }
    }
    return s;
  }

  function capScore(b, m) { const t = b[m.to[0]][m.to[1]]; return t ? VAL[t.t] : 0; }
  function orderMoves(b, moves) {
    moves.sort((a, c) => capScore(b, c) - capScore(b, a));
  }

  let searchStart = 0;
  let searchTimeLimit = 3000;

  function negamax(b, depth, alpha, beta, color) {
    if (Date.now() - searchStart > searchTimeLimit) throw new Error('timeout');
    const moves = legalMoves(b, color);
    if (moves.length === 0) return -MATE - depth; // 被将死/无子可走
    if (depth === 0) return color === RED ? evaluate(b) : -evaluate(b);
    orderMoves(b, moves);
    let best = -Infinity;
    for (const m of moves) {
      const cap = makeMove(b, m);
      const sc = -negamax(b, depth - 1, -beta, -alpha, opp(color));
      undoMove(b, m, cap);
      if (sc > best) best = sc;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  function setTimeLimit(ms) { searchTimeLimit = ms; }

  // 迭代加深 + 时间限制；返回最佳着法或 null（无子可走）
  function searchWithTime(b, color, maxDepth) {
    searchStart = Date.now();
    const moves = legalMoves(b, color);
    if (moves.length === 0) return null;
    orderMoves(b, moves);
    let bestMove = moves[0];
    try {
      for (let d = 1; d <= maxDepth; d++) {
        let alpha = -Infinity, localBest = moves[0], localScore = -Infinity;
        for (const m of moves) {
          const cap = makeMove(b, m);
          const sc = -negamax(b, d - 1, -Infinity, -alpha, opp(color));
          undoMove(b, m, cap);
          if (sc > localScore) { localScore = sc; localBest = m; }
          if (localScore > alpha) alpha = localScore;
        }
        bestMove = localBest;
        if (Date.now() - searchStart > searchTimeLimit) break;
      }
    } catch (e) {
      if (e.message !== 'timeout') throw e;
    }
    return bestMove;
  }

  // ---------- FEN 局面载入/导出 ----------
  // 棋子符号：颜色前缀 r/b + 类型 R/H/E/A/K/C/P（如 rP, bK）
  // 紧凑格式：类似国际象棋 FEN，大写为红，小写为黑，数字代表连续空位
  const FEN_TYPE = { R: 'R', H: 'H', E: 'E', A: 'A', K: 'K', C: 'C', P: 'P' };
  const COMPACT_MAP = { R: 'R', H: 'H', E: 'B', A: 'A', K: 'K', C: 'C', P: 'P' };
  const COMPACT_REVERSE = { R: 'R', H: 'H', B: 'E', A: 'A', K: 'K', C: 'C', P: 'P' };

  function isCompactFEN(fen) {
    return !/\s/.test(fen.replace(/\//g, ''));
  }

  function boardFromFEN(fen) {
    const raw = fen.trim();
    if (isCompactFEN(raw)) return boardFromCompactFEN(raw);

    const rows = raw.split(/\s*\/\s*/);
    if (rows.length !== 10) throw new Error('FEN 需包含 10 行');
    const b = Array.from({ length: 9 }, () => Array(10).fill(null));
    for (let y = 0; y < 10; y++) {
      const tokens = rows[y].trim().split(/\s+/);
      if (tokens.length !== 9) throw new Error(`第 ${y + 1} 行需 9 个格子`);
      for (let x = 0; x < 9; x++) {
        const t = tokens[x];
        if (t === '.' || t === '0' || t === '') continue;
        const color = t[0].toLowerCase() === 'r' ? RED : BLACK;
        const type = t[1].toUpperCase();
        if (!FEN_TYPE[type]) throw new Error(`未知棋子类型: ${t}`);
        b[x][y] = { t: type, c: color };
      }
    }
    return b;
  }

  function fenFromBoard(b) {
    const rows = [];
    for (let y = 0; y < 10; y++) {
      const tokens = [];
      for (let x = 0; x < 9; x++) {
        const p = b[x][y];
        tokens.push(p ? (p.c === RED ? 'r' : 'b') + p.t : '.');
      }
      rows.push(tokens.join(' '));
    }
    return rows.join(' / ');
  }

  function boardFromCompactFEN(fen) {
    const rows = fen.trim().split(/\s*\/\s*/);
    if (rows.length !== 10) throw new Error('紧凑 FEN 需包含 10 行');
    const b = Array.from({ length: 9 }, () => Array(10).fill(null));
    for (let y = 0; y < 10; y++) {
      let x = 0;
      for (const ch of rows[y]) {
        if (/\d/.test(ch)) {
          x += parseInt(ch, 10);
        } else {
          const type = COMPACT_REVERSE[ch.toUpperCase()];
          const color = ch === ch.toUpperCase() ? RED : BLACK;
          if (!type) throw new Error(`未知棋子: ${ch}`);
          if (x >= 9) throw new Error(`第 ${y + 1} 行超过 9 格`);
          b[x][y] = { t: type, c: color };
          x++;
        }
      }
      if (x !== 9) throw new Error(`第 ${y + 1} 行格数不对（实际 ${x}）`);
    }
    return b;
  }

  function compactFENFromBoard(b) {
    const rows = [];
    for (let y = 0; y < 10; y++) {
      let s = '', empty = 0;
      for (let x = 0; x < 9; x++) {
        const p = b[x][y];
        if (!p) {
          empty++;
        } else {
          if (empty) { s += empty; empty = 0; }
          const ch = COMPACT_MAP[p.t];
          s += p.c === RED ? ch : ch.toLowerCase();
        }
      }
      if (empty) s += empty;
      rows.push(s || '9');
    }
    return rows.join('/');
  }

  // 生成中文着法记谱
  function numToCN(n) {
    const s = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    return s[n] != null ? s[n] : String(n);
  }

  function notation(mv, color) {
    const [fx, fy] = mv.from, [tx, ty] = mv.to;
    const p = mv.piece;
    const name = charOf(p.t, p.c);
    const fileNo = color === RED ? 9 - fx : fx + 1;
    const dx = tx - fx, dy = ty - fy;
    let action, dest;
    if (dx !== 0 && dy === 0) {
      action = '平';
      dest = color === RED ? 9 - tx : tx + 1;
    } else {
      const forward = color === RED ? dy < 0 : dy > 0;
      action = forward ? '进' : '退';
      const isDiag = (p.t === 'H' || p.t === 'E' || p.t === 'A');
      dest = isDiag ? (color === RED ? 9 - tx : tx + 1) : Math.abs(dy);
    }
    return name + numToCN(fileNo) + action + numToCN(dest);
  }

  function cloneBoard(b) {
    return b.map(col => col.map(p => (p ? { t: p.t, c: p.c } : null)));
  }

  // ---------- 棋谱解析 ----------
  const PIECE_MAP = {
    '帅': 'K', '将': 'K', '仕': 'A', '士': 'A', '相': 'E', '象': 'E',
    '马': 'H', '車': 'R', '车': 'R', '砲': 'C', '炮': 'C', '兵': 'P', '卒': 'P'
  };
  const CN_NUM = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
  function cnToNum(ch) {
    if (/[1-9]/.test(ch)) return parseInt(ch, 10);
    return CN_NUM[ch] || 0;
  }
  const STEP_LINE = ['R', 'C', 'P', 'K']; // 车/炮/兵/将帅：进/退用步数表示目标

  // 找出与记谱串 str 匹配的所有合法着法
  function matchNotation(b, c, str) {
    str = str.replace(/\s/g, '');
    let mode, fileNo, fb, action, dest, t = PIECE_MAP[str[0]];
    if (str[0] === '前' || str[0] === '后') {
      // 前后 + 棋子 + 动作 + 目标
      mode = 'fb'; fb = str[0];
      t = PIECE_MAP[str[1]];
      if (!t) throw new Error('无法识别棋子: ' + str[1]);
      action = str[2];
      dest = cnToNum(str[3]);
    } else {
      if (!t) throw new Error('无法识别棋子: ' + str[0]);
      const posCh = str[1];
      action = str[2];
      dest = cnToNum(str[3]);
      if (posCh === '前' || posCh === '后') { mode = 'fb'; fb = posCh; }
      else { mode = 'file'; fileNo = cnToNum(posCh); }
    }
    if (mode === 'file' && !fileNo) throw new Error('无法识别起始位置: ' + str);
    if (!['平', '进', '退'].includes(action)) throw new Error('无法识别动作: ' + str);
    if (!dest) throw new Error('无法识别目标: ' + str);

    const all = legalMoves(b, c).filter(m => m.piece.t === t);
    let fromSet = null;
    if (mode === 'fb') {
      const positions = [];
      for (let x = 0; x < 9; x++)
        for (let y = 0; y < 10; y++) {
          const p = b[x][y];
          if (p && p.t === t && p.c === c) positions.push([x, y]);
        }
      positions.sort((a, b2) => (c === RED ? a[1] - b2[1] : b2[1] - a[1]));
      fromSet = new Set();
      if (positions.length) {
        const ps = fb === '前' ? positions[0] : positions[positions.length - 1];
        fromSet.add(ps[0] + ',' + ps[1]);
      }
    }

    const res = [];
    for (const m of all) {
      const [x, y] = m.from, [tx, ty] = m.to;
      if (mode === 'file') {
        const ff = c === RED ? 9 - x : x + 1;
        if (ff !== fileNo) continue;
      } else {
        if (!fromSet.has(x + ',' + y)) continue;
      }
      let ok = true;
      if (action === '平') {
        if (ty !== y) ok = false;
        else { const tf = c === RED ? 9 - tx : tx + 1; if (tf !== dest) ok = false; }
      } else if (action === '进') {
        if (c === RED ? !(ty < y) : !(ty > y)) ok = false;
        else if (STEP_LINE.includes(t)) { const steps = c === RED ? y - ty : ty - y; if (steps !== dest) ok = false; }
        else { const tf = c === RED ? 9 - tx : tx + 1; if (tf !== dest) ok = false; }
      } else { // 退
        if (c === RED ? !(ty > y) : !(ty < y)) ok = false;
        else if (STEP_LINE.includes(t)) { const steps = c === RED ? ty - y : y - ty; if (steps !== dest) ok = false; }
        else { const tf = c === RED ? 9 - tx : tx + 1; if (tf !== dest) ok = false; }
      }
      if (ok) res.push(m);
    }
    return res;
  }

  // 把整段记谱文本解析为逐手着法序列（从 startBoard/startColor 开始逐步消歧）
  function parseMoves(text, startBoard, startColor) {
    let s = text.replace(/[0-9]+\s*\./g, '').replace(/[\s。.、，,；;（）()]/g, '');
    const tokens = [];
    if (/^[a-iA-I][0-9][a-iA-I][0-9](\s*[a-iA-I][0-9][a-iA-I][0-9])*$/.test(s)) {
      // ICCS 坐标式
      const raw = s.match(/[a-iA-I][0-9][a-iA-I][0-9]/g) || [];
      for (const tk of raw) tokens.push(tk.toLowerCase());
    } else {
      // 中文记谱：每步固定 4 字（棋子+起始+动作+目标）
      for (let i = 0; i < s.length; i += 4) tokens.push(s.substr(i, 4));
    }

    const b = cloneBoard(startBoard || initialBoard());
    const c0 = startColor || RED;
    const moves = [];
    let c = c0;
    let idx = 0;
    for (const tk of tokens) {
      idx++;
      let cands;
      if (/^[a-i][0-9][a-i][0-9]$/.test(tk)) {
        const fx = tk.charCodeAt(0) - 97, fy = parseInt(tk[1], 10);
        const tx = tk.charCodeAt(2) - 97, ty = parseInt(tk[3], 10);
        cands = legalMoves(b, c).filter(m =>
          m.from[0] === fx && m.from[1] === fy && m.to[0] === tx && m.to[1] === ty);
      } else {
        cands = matchNotation(b, c, tk);
      }
      if (cands.length === 0) throw new Error(`第 ${idx} 步无法解析: ${tk}（记谱可能有误或并非该方走子）`);
      if (cands.length > 1) throw new Error(`第 ${idx} 步有歧义: ${tk}`);
      const m = cands[0];
      moves.push({ from: m.from, to: m.to, piece: m.piece, color: c, note: tk });
      makeMove(b, m);
      c = opp(c);
    }
    return moves;
  }

  const api = {
    RED, BLACK, MATE, VAL, CHAR,
    charOf, inBounds, inPalace, opp,
    initialBoard, findGeneral, isAttacked, isGeneralInCheck,
    genPieceMoves, genAllPseudo, legalMoves, makeMove, undoMove,
    evaluate, searchWithTime, setTimeLimit, notation,
    fenFromBoard, boardFromFEN, compactFENFromBoard,
    parseMoves, cloneBoard, matchNotation
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.XQ = api;
})(typeof window !== 'undefined' ? window : globalThis);
