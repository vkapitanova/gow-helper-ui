import { Tile } from './Tile'
import { printArray } from '../utils/utils'

export const boardSize: number = 8
type BoardMap = Array<Array<Tile>>
export type BoardCoordinates = [number, number]

export class GameBoard {
  board: BoardMap
 
  constructor() {
    this.board = []
    for (let i = 0; i < boardSize; i++) {
      this.board[i] = []
      for (let j = 0; j < boardSize; j++) {
        this.board[i][j] = Tile.empty
      }
    }
  }

  withBoard(m: BoardMap): GameBoard {
    this.board = m
    return this
  }

  printBoard() {
    printArray<Tile>(this.board, (v: Tile) => v.toConsoleString())
  }

  getTile(c: BoardCoordinates) {
    let [i, j] = c
    if (i < 0 || i >= boardSize || j < 0 || j >= boardSize) throw `invalid coordinates: ${i}, ${j}`
    return this.board[i][j]
  }

  setTile(c: BoardCoordinates, tile: Tile) {
    let [i, j] = c
    if (i < 0 || i >= boardSize || j < 0 || j >= boardSize) throw `invalid coordinates: ${i}, ${j}`
    this.board[i][j] = tile
  }

  transformTiles(tr: (t: Tile) => Tile) {
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        this.board[i][j] = tr(this.board[i][j])
      }  
    }
  }

  searchTiles(cond: (t: Tile) => boolean): Array<BoardCoordinates> {
    let res: Array<BoardCoordinates> = []
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (cond(this.board[i][j])) res.push([i, j])
      }  
    }
    return res
  }

  private removeTile(c: BoardCoordinates) {
    let [i, j] = c
    if (i < 0 || i >= boardSize || j < 0 || j >= boardSize) throw `invalid coordinates: ${i}, ${j}`
    this.board[i][j] = Tile.empty
  }

  removeTiles(coords: Array<BoardCoordinates>) {
    // change to empty
    for (let c of coords) {
      this.removeTile(c)
    }
    // this.printBoard()
    // drop tiles
    for (let i = 1; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (this.board[i][j].isEmpty()) {
          var n = i
          while (n > 0) {
            this.board[n][j] = this.board[n-1][j]
            this.removeTile([n-1, j])
            n--
          }
        }
      }
    }
  }

  copy(): GameBoard {
    let copy: BoardMap = []
    for (let i in this.board) {
      copy[i] = []
      for (let j in this.board[i]) {
        copy[i][j] = this.board[i][j]
      }  
    }
    return new GameBoard().withBoard(copy)
  }

}

