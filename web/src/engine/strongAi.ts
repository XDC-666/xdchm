// 象眼 xqwlight 强引擎接入层（GPL-2.0，by www.xqbase.com）。
// 引擎由 index.html 以普通 <script> 加载，挂到全局 window.Position / Search / SRC / DST / BOOK_DAT。
// 这里把「我的棋盘 ⇄ xqwlight FEN ⇄ 走子坐标」的转换与搜索封装好，供 useGame 调用。
import type { Board, Color, Move } from '../types'

const XQ_RED_LETTERS = 'KABNRCP'
const XQ_BLACK_LETTERS = 'kabnrcp'
const XQ_PT: Record<string, number> = { K: 0, A: 1, E: 2, H: 3, R: 4, C: 5, P: 6 }

interface XqGlobals {
  Position: new () => { fromFen(fen: string): void }
  Search: new (pos: unknown, n: number) => { searchMain(a: number, millis: number): number }
  SRC(mv: number): number
  DST(mv: number): number
  XQ?: { legalMoves(b: Board, c: Color): Move[] }
}

function g(): XqGlobals {
  return globalThis as unknown as XqGlobals
}

// 三个脚本是否成功加载（未加载则回退内置引擎）
export function isXqAvailable(): boolean {
  const w = g()
  return (
    typeof w.Position !== 'undefined' &&
    typeof w.Search !== 'undefined' &&
    typeof w.SRC !== 'undefined'
  )
}

// 我的 board[x][y]（x:列0-8, y:行0-9）→ xqwlight 自定义 FEN 串
function xqFenFromBoard(board: Board, turn: Color): string {
  const rows: string[] = []
  for (let y = 0; y <= 9; y++) {
    let row = ''
    let empty = 0
    for (let x = 0; x <= 8; x++) {
      const p = board[x][y]
      if (!p) {
        empty++
        continue
      }
      if (empty > 0) {
        row += String(empty)
        empty = 0
      }
      const pt = XQ_PT[p.t] ?? 0
      row += p.c === 'r' ? XQ_RED_LETTERS[pt] : XQ_BLACK_LETTERS[pt]
    }
    if (empty > 0) row += String(empty)
    rows.push(row)
  }
  return rows.join('/') + (turn === 'r' ? ' w' : ' b')
}

// xqwlight 256 格索引（16×16 棋盘）→ 我的 [x, y]
function xqSqToMy(sq: number): [number, number] {
  return [(sq & 15) - 3, (sq >> 4) - 3]
}

// 走一步强引擎计算。失败（脚本未加载 / 解析异常 / 返回非法着法）→ 返回 null，由调用方回退。
export function strongAiMove(board: Board, color: Color, millis: number): Move | null {
  const w = g()
  try {
    const pos = new w.Position()
    pos.fromFen(xqFenFromBoard(board, color))
    const search = new w.Search(pos, 18)
    const mv = search.searchMain(64, millis)
    if (!mv) return null
    const from = xqSqToMy(w.SRC(mv))
    const to = xqSqToMy(w.DST(mv))
    const piece = board[from[0]]?.[from[1]]
    if (!piece) return null
    // 合法性兜底：强引擎返回的坐标必须能在我的合法着法表里找到，避免越界/误走
    const XQ = w.XQ
    if (XQ) {
      const legal = XQ.legalMoves(board, color).some(
        (m) =>
          m.from[0] === from[0] &&
          m.from[1] === from[1] &&
          m.to[0] === to[0] &&
          m.to[1] === to[1],
      )
      if (!legal) return null
    }
    return { from, to, piece }
  } catch {
    return null
  }
}
