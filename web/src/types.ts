export type Color = 'r' | 'b'

export interface Piece {
  t: string // R H E A K C P
  c: Color // r=红, b=黑
}

export type Cell = Piece | null
export type Board = Cell[][] // board[x][y], x:0..8 列, y:0..9 行

export interface Move {
  from: [number, number]
  to: [number, number]
  piece: Piece
}

export type GameResult = 'red' | 'black' | 'draw' | null
