// 引擎是 UMD 模块：浏览器下挂到 window.XQ，Node 下挂到 globalThis.XQ。
// 这里 side-effect import 后取全局引用，避免类型报错。
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '../engine/xiangqi-engine.js'

export interface XQEngine {
  RED: 'r'
  BLACK: 'b'
  initialBoard(): import('../types').Board
  legalMoves(b: import('../types').Board, color: 'r' | 'b'): import('../types').Move[]
  makeMove(b: import('../types').Board, m: import('../types').Move): import('../types').Cell
  undoMove(b: import('../types').Board, m: import('../types').Move, cap: import('../types').Cell): void
  searchWithTime(b: import('../types').Board, color: 'r' | 'b', maxDepth: number): import('../types').Move | null
  charOf(t: string, c: 'r' | 'b'): string
  opp(c: 'r' | 'b'): 'r' | 'b'
  isGeneralInCheck(b: import('../types').Board, color: 'r' | 'b'): boolean
  notation(mv: import('../types').Move, color: 'r' | 'b'): string
  cloneBoard(b: import('../types').Board): import('../types').Board
}

export const XQ = (globalThis as unknown as { XQ: XQEngine }).XQ
export default XQ

export { strongAiMove, isXqAvailable } from './strongAi'
