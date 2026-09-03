// 界面层：登录/注册弹窗、保存战绩、我的战绩、排行榜
(function () {
  const API = window.XQAPI;
  const root = document.getElementById('modalRoot');

  const loginBtn = document.getElementById('loginBtn');
  const saveGameBtn = document.getElementById('saveGameBtn');
  const myGamesBtn = document.getElementById('myGamesBtn');
  const leaderboardBtn = document.getElementById('leaderboardBtn');
  const resignBtn = document.getElementById('resignBtn');

  let pendingGame = null;     // 对局结束后暂存，等待保存 {result, moves, difficulty, human_color}

  const RESULT_TEXT = { win: '胜', lose: '负', draw: '和' };
  const DIFF_TEXT = { easy: '简单', medium: '中等', hard: '困难', expert: '最强' };
  const COLOR_TEXT = { r: '红方(先手)', b: '黑方(后手)' };

  // ---------- 小工具 ----------
  function el(tag, props, ...children) {
    const e = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === 'class') e.className = props[k];
      else if (k === 'html') e.innerHTML = props[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), props[k]);
      else e.setAttribute(k, props[k]);
    }
    for (const c of children) if (c != null) e.append(c);
    return e;
  }
  function fmtDate(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function toast(msg, type) {
    const t = el('div', { class: 'xq-toast ' + (type || '') }, msg);
    root.append(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
  }

  // ---------- 登录态 ----------
  function refreshAuthUI() {
    if (API.isLoggedIn()) {
      const u = API.getUser();
      loginBtn.textContent = (u ? u.username : '已登录') + ' · 退出';
      loginBtn.onclick = doLogout;
    } else {
      loginBtn.textContent = '登录 / 注册';
      loginBtn.onclick = openAuthModal;
    }
  }
  function doLogout() {
    API.setToken(null); API.setUser(null);
    refreshAuthUI();
    toast('已退出登录');
  }

  // ---------- 模态框 ----------
  function modal(title, bodyBuilder) {
    const overlay = el('div', { class: 'xq-modal-overlay' });
    const box = el('div', { class: 'xq-modal' },
      el('div', { class: 'xq-modal-head' },
        el('span', {}, title),
        el('button', { class: 'xq-close', onclick: () => overlay.remove() }, '×')),
      el('div', { class: 'xq-modal-body' }));
    overlay.append(box);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    root.append(overlay);
    if (bodyBuilder) bodyBuilder(box.querySelector('.xq-modal-body'), overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
    return overlay;
  }

  function openAuthModal() {
    const overlay = modal('登录 / 注册');
    const b = overlay.querySelector('.xq-modal-body');
    let mode = 'login';
    const userI = el('input', { class: 'xq-input', placeholder: '用户名' });
    const passI = el('input', { class: 'xq-input', type: 'password', placeholder: '密码（≥4位）' });
    const msg = el('div', { class: 'xq-msg' });
    const submit = el('button', { class: 'xq-btn' }, '登录');
    const switchBtn = el('button', { class: 'xq-link' }, '没有账号？去注册');

    function setMode(md) {
      mode = md;
      submit.textContent = md === 'login' ? '登录' : '注册';
      switchBtn.textContent = md === 'login' ? '没有账号？去注册' : '已有账号？去登录';
      msg.textContent = '';
    }
    submit.onclick = async () => {
      try {
        const fn = mode === 'login' ? API.login : API.register;
        const r = await fn(userI.value.trim(), passI.value);
        API.setToken(r.token); API.setUser({ username: r.username });
        refreshAuthUI();
        overlay.remove();
        toast('登录成功，欢迎 ' + r.username);
        if (pendingGame) trySavePending();
      } catch (e) { msg.textContent = e.message; }
    };
    switchBtn.onclick = () => setMode(mode === 'login' ? 'register' : 'login');
    b.append(
      userI, passI, msg,
      el('div', { class: 'xq-row' }, submit),
      el('div', { class: 'xq-center' }, switchBtn)
    );
  }

  // ---------- 保存战绩 ----------
  function setPending(g) {
    pendingGame = g;
    if (API.isLoggedIn()) trySavePending();
    else { saveGameBtn.disabled = true; toast('登录后自动保存战绩'); }
  }
  async function trySavePending() {
    if (!pendingGame) return;
    const g = pendingGame; pendingGame = null;
    saveGameBtn.disabled = true;
    try {
      await API.saveGame({ result: g.result, difficulty: g.difficulty, human_color: g.human_color, moves: g.moves });
      toast('已保存到战绩 ✅');
    } catch (e) {
      pendingGame = g; saveGameBtn.disabled = false;
      toast('保存失败：' + e.message, 'err');
    }
  }
  saveGameBtn.onclick = () => {
    if (!API.isLoggedIn()) { openAuthModal(); return; }
    if (pendingGame) trySavePending();
    else toast('本局尚未结束，无法保存');
  };

  // 注册「对局结束」回调（由游戏内 postMoveChecks / 认输 触发）
  API.onGameOver((result, data) => setPending({ result, ...data }));

  // ---------- 我的战绩 ----------
  async function openMyGames() {
    if (!API.isLoggedIn()) { openAuthModal(); return; }
    const overlay = modal('我的战绩');
    const b = overlay.querySelector('.xq-modal-body');
    b.append(el('div', { class: 'xq-loading' }, '加载中…'));
    try {
      const games = await API.listGames();
      b.innerHTML = '';
      if (!games.length) { b.append(el('div', { class: 'xq-empty' }, '还没有战绩，去下一盘吧！')); return; }
      for (const g of games) {
        const item = el('div', { class: 'xq-game' });
        const head = el('div', { class: 'xq-game-head' },
          el('span', { class: 'xq-result xq-' + g.result }, RESULT_TEXT[g.result] || g.result),
          el('span', {}, DIFF_TEXT[g.difficulty] || g.difficulty),
          el('span', {}, COLOR_TEXT[g.human_color] || ''),
          el('span', { class: 'xq-date' }, fmtDate(g.created_at)));
        const movesBox = el('div', { class: 'xq-moves hidden' });
        const detail = await API.getGame(g.id);
        movesBox.append(el('div', { class: 'xq-movelist' },
          (detail.moves || []).map((x) => x.note).join('  ')));
        const toggle = el('button', { class: 'xq-btn small' }, '棋谱');
        toggle.onclick = () => movesBox.classList.toggle('hidden');
        const replay = el('button', { class: 'xq-btn small' }, '回放');
        replay.onclick = () => {
          window.XQReplay((detail.moves || []).map((x) => ({ from: x.from, to: x.to, color: x.color })),
            '战绩回放', RESULT_TEXT[g.result] || '');
          overlay.remove();
          toast('已载入棋盘，用「上一步 / 下一步」查看');
        };
        const del = el('button', { class: 'xq-btn small danger' }, '删除');
        del.onclick = async () => {
          if (!confirm('确定删除这局战绩？')) return;
          await API.deleteGame(g.id); item.remove(); toast('已删除');
        };
        head.append(el('div', { class: 'xq-game-actions' }, toggle, replay, del));
        item.append(head, movesBox);
        b.append(item);
      }
    } catch (e) { b.innerHTML = ''; b.append(el('div', { class: 'xq-err' }, '加载失败：' + e.message)); }
  }

  // ---------- 排行榜 ----------
  async function openLeaderboard() {
    const overlay = modal('排行榜（按胜率）');
    const b = overlay.querySelector('.xq-modal-body');
    b.append(el('div', { class: 'xq-loading' }, '加载中…'));
    try {
      const rows = await API.leaderboard();
      b.innerHTML = '';
      if (!rows.length) { b.append(el('div', { class: 'xq-empty' }, '暂无数据')); return; }
      rows.forEach((r, i) => {
        b.append(el('div', { class: 'xq-lb' },
          el('span', { class: 'xq-rank' }, '#' + (i + 1)),
          el('span', { class: 'xq-name' }, r.username),
          el('span', {}, '胜率 ' + (r.winrate * 100).toFixed(1) + '%'),
          el('span', { class: 'xq-sub' }, `(${r.wins}胜 ${r.losses}负 ${r.draws}和 / ${r.total}局)`)));
      });
    } catch (e) { b.innerHTML = ''; b.append(el('div', { class: 'xq-err' }, '加载失败：' + e.message)); }
  }

  // ---------- 绑定 ----------
  myGamesBtn.onclick = openMyGames;
  leaderboardBtn.onclick = openLeaderboard;
  resignBtn.onclick = () => { if (confirm('确定认输本局？')) window.XQResign && window.XQResign(); };

  refreshAuthUI();
})();
