import { GameBoard, boardSize, BoardCoordinates } from "./GameBoard";
import { ManaColor, Tile, TileType } from "./Tile";
import { printArray } from '../utils/utils'

export class MatchesFinder {
  board: GameBoard
  matchesCounter: number = 0
  marks: Array<Array<Mark>>

  constructor(board: GameBoard) {
    this.board = board
    this.marks = []
    for (let i = 0; i < boardSize; i++) {
      this.marks[i] = []
      for (let j = 0; j < boardSize; j++) {
        this.marks[i][j] = new Mark()
      }
    }
  }

  private getTileAndMark(coords: CoordinatesWithMapper): [Tile, Mark] {
    let [i, j] = coords.getValues()
    return [this.board.getTile([i, j]), this.marks[i][j]]
  } 

  findMatches(): [Array<GameMatch>, Array<BoardCoordinates>] {
    // this.board.printBoard()
    this.markMatchesInDirection(Direction.Horizontal)
    this.markMatchesInDirection(Direction.Vertical)
    // this.printMarks()
    if (this.matchesCounter > 0) {
      let [matches, blown] = this.getMatches()
      return [matches, blown]
    }
    return [[], []]
  }

  private markMatchesInDirection(direction: Direction) {
    let coordsMapper = getCoordsMapper(direction)
  
    var self = this
    let markAndUpdateResult = function(markWith: number, coords: CoordinatesWithMapper): number {
      if (matchedTiles >= 3) {
        self.markMatchedTiles(markWith, coords)
        if (markWith == self.matchesCounter + 1) {
          self.matchesCounter++
          markWith = self.matchesCounter + 1
        }
      }
      matchedTiles = 1
      return markWith
    }
  
    var matchedTiles = 1
    for (let i = 0; i < boardSize; i++) {
      var markWith = this.matchesCounter + 1
      for (let j = 1; j < boardSize; j++) {
        let coords = new CoordinatesWithMapper(i, j, coordsMapper)
        let [curElem, curMark] = this.getTileAndMark(coords)
        let [prevElem, prevMark] = this.getTileAndMark(coords.left())
        if (curElem.matchesWith(prevElem)) {
          if (curMark.isMatched()) markWith = curMark.value
          if (prevMark.isMatched()) markWith = prevMark.value
          matchedTiles++;
        } else {
          markWith = markAndUpdateResult(markWith, coords.left())
          matchedTiles = 1
        }
      }
      markWith = markAndUpdateResult(markWith, new CoordinatesWithMapper(i, boardSize - 1, coordsMapper))
    }
  }

  private markMatchedTiles(markWith: number, coords: CoordinatesWithMapper) {
    let [tile, mark] = this.getTileAndMark(coords)
    let curCoords = coords
    let [curTile, curMark] = this.getTileAndMark(curCoords)
    do {
      [curTile, curMark] = this.getTileAndMark(curCoords)
      if (!curTile.matchesWith(tile)) break
      curMark.markMatched(markWith)
      if (curTile.blows()) {
        this.markBlowEffect(curCoords)
      }
      curCoords = curCoords.left()
    } while (curCoords.j >= 0)

    mark.markMatched(markWith)
  }

  private markBlowEffect(coords: CoordinatesWithMapper) {
    let checkAndMark = (coords: CoordinatesWithMapper) => {
        let [tile, mark]: [Tile?, Mark?] = [undefined, undefined]
        try {
          [tile, mark] = this.getTileAndMark(coords)
        } catch (e: any) {
          return
        }
        if (tile.isEmpty() || mark.isBlown() || mark.isMatched()) return
        mark.markBlown()
        if (tile.blows()) {
          this.markBlowEffect(coords)
        }
    }
    checkAndMark(coords.left())
    checkAndMark(coords.right())
    checkAndMark(coords.up())
    checkAndMark(coords.down())
    checkAndMark(coords.left().up())
    checkAndMark(coords.left().down())
    checkAndMark(coords.right().up())
    checkAndMark(coords.right().down())
  }


  private getMatches(): [Array<GameMatch>, Array<BoardCoordinates>] {
    let res: Array<GameMatch> = []
    for (let mark = 1; mark < this.matchesCounter + 1; mark++) {
      let match = new GameMatch()
      let coords = this.searchMarks((m) => m.value == mark)
      coords.forEach((c) => match.addTile(this.board.getTile(c), c))
      res.push(match)
    }
    let blown = this.searchMarks((m) => m.isBlown())
    return [res, blown]
  }

  searchMarks(cond: (m: Mark) => boolean): Array<BoardCoordinates> {
    let res: Array<BoardCoordinates> = []
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (cond(this.marks[i][j])) res.push([i, j])
      }  
    }
    return res
  }

  printMarks() {
    printArray<Mark>(this.marks, (v: Mark) => v.value.toString())
  }
}

enum Direction { Vertical, Horizontal }

export enum MatchType { Mana, Hit, Unknown }

export class GameMatch {
  type: MatchType = MatchType.Unknown
  manaColor?: ManaColor
  tiles: Array<BoardCoordinates> = []

  addTile(tile: Tile, c: BoardCoordinates) {
    this.tiles.push(c)
    if (this.type == MatchType.Unknown) {
      if (tile.type == TileType.Color) { 
        this.type = MatchType.Mana 
        this.manaColor = tile.color
      }
      if (tile.type == TileType.Skull) { this.type = MatchType.Hit }
    }
  }

  hasAdditionalMove(): boolean {
    return this.tiles.length >= 4
  }
}

type CoordsMapper = (i: number, j: number) => [number, number]

class CoordinatesWithMapper {
  i: number
  j: number
  mapper: CoordsMapper

  constructor(i: number, j: number, mapper: CoordsMapper = getCoordsMapper(Direction.Horizontal)) {
    this.i = i
    this.j = j
    this.mapper = mapper
  }

  getValues(): [number, number] {
    return this.mapper(this.i, this.j)
  }

  copy(i: number, j: number) {
    return new CoordinatesWithMapper(i, j, this.mapper)
  }

  left(): CoordinatesWithMapper {
    return this.copy(this.i, this.j-1)    
  }

  right(): CoordinatesWithMapper {
    return this.copy(this.i, this.j+1)    
  }

  up(): CoordinatesWithMapper {
    return this.copy(this.i-1, this.j)    
  }

  down(): CoordinatesWithMapper {
    return this.copy(this.i+1, this.j)    
  }
}

function getCoordsMapper(direction: Direction): CoordsMapper {
  if (direction == Direction.Horizontal) {
    return (i, j) => [i, j]
  } else {
    return (i, j) => [j, i]
  }
} 

class Mark {
  value: number = 0

  markMatched(matchSequence: number) {
    this.value = matchSequence
  }

  markBlown() {
    this.value = -1
  }

  isMatched(): boolean {
    return this.value > 0
  }

  isBlown(): boolean {
    return this.value == -1
  }

  isMarked(): boolean {
    return this.isMatched() || this.isBlown()
  }

  cleanMark() {
    this.value = 0
  }

  toConsoleString(): string {
    if (this.isMatched()) return this.value.toString()
    if (this.isBlown()) return 'b'
    return '0'
  }
}
