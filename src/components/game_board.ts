import { makeBlock } from "@vue/compiler-core"
import { boolean, number } from "yargs"

const boardSize: number = 8
export type BoardMap = Array<Array<Tile>>

export class GameBoard {
  board!: BoardMap
 
  constructor(board: BoardMap) {
    this.setBoardToTilesMap(board)
    // console.log("start with board")
    // this.printBoard()
    // this.printMarks()
  }

  static from(map: Array<Array<string>>): GameBoard {
    if (map.length != boardSize) throw `map should be ${boardSize}x${boardSize} elements`
    let b = new GameBoard([])
    // b.printArray(map, (v) => v)
    b.setBoardToStringMap(map)
    // console.log("start with board")
    // b.printBoard()
    // b.printMarks()
    return b
  }

  printBoard() {
    this.printArray<Tile>(this.board, (v: Tile) => v.toConsoleString())
  }

  printMarks() {
    this.printArray<Tile>(this.board, (v: Tile) => v.mark.toConsoleString())
  }

  getTile(i: number, j: number) {
    if (i < 0 || i >= boardSize || j < 0 || j >= boardSize) throw `invalid coordinates: ${i}, ${j}`
    return this.board[i][j]
  }

  removeTile(i: number, j: number) {
    if (i < 0 || i >= boardSize || j < 0 || j >= boardSize) throw `invalid coordinates: ${i}, ${j}`
    this.board[i][j] = Tile.emptyTile
  }

  setTile(i: number, j: number, tile: Tile) {
    if (i < 0 || i >= boardSize || j < 0 || j >= boardSize) throw `invalid coordinates: ${i}, ${j}`
    this.board[i][j] = tile
  }

  changeTiles(c1: [number, number], c2: [number, number]) {
    let t = this.board[c1[0]][c1[1]]
    this.board[c1[0]][c1[1]] = this.board[c2[0]][c2[1]]
    this.board[c2[0]][c2[1]] = t
  }

  transformTiles(tr: (t: Tile) => Tile) {
    for (const i in this.board) {
      for (const j in this.board[i]) {
        this.board[i][j] = tr(this.board[i][j])
      }  
    }
  }

  copy(): BoardMap {
    let copy: BoardMap = []
    for (const i in this.board) {
      copy[i] = []
      for (const j in this.board[i]) {
        copy[i][j] = this.board[i][j]
      }  
    }
    return copy
  }

  private printArray<Type>(arr: Array<Array<Type>>, toString: (v: Type) => string) {
    for (let i = 0; i < arr.length; i++) {
      var line = i + ': '
      for (let j = 0; j < arr[i].length; j++) {
          line += toString(arr[i][j]) + ' '
      }
      console.log(line)
    }
  }

  private setBoardToTilesMap(a: BoardMap) {
    this.setBoardTo(a, (v: Tile) => new Tile(v.toString()))
  }

  private setBoardToStringMap(a: Array<Array<string>>) {
    this.setBoardTo(a, (v: string) => new Tile(v))
  }

  private setBoardTo<Type>(a: Array<Array<Type>>, tr: (v: Type) => Tile) {
    this.board = []
    for (const i in a) {
      this.board[i] = []
      for (const j in a[i]) {
        this.board[i][j] = tr(a[i][j])
      }  
    }
  }
  
}

export interface MoveResult {
  removedCombinations: Array<StepResult>
  hasAdditionalMove: boolean
  hasMatch: boolean
  mapAfterMove: BoardMap
  resultMap: BoardMap
}

export interface StepResult {
  combinations: Array<GameCombination>
  finalMap: BoardMap
}

export class BoardMove {
  board: GameBoard
  matchesCounter: number = 0
  frozenColors: Set<TileColor> = new Set<TileColor>()
  frozenHit: boolean = false

  constructor(board: GameBoard, frozenColors: Set<string> = new Set<string>()) {
    this.board = board
    for (let c of frozenColors) {
      let tile = new Tile(c)
      if (tile.color != null) {
        this.frozenColors.add(new Tile(c).color!)
      }
      if (tile.type == TileType.Skull) this.frozenHit = true
    }
  }

  moveTiles(c1: [number, number], c2: [number, number]): MoveResult | string {
    if (!this.isMoveValid(c1, c2)) return "incorrect move: tile should be close to each other"
    // console.log("move", c1, c2)
    this.board.changeTiles(c1, c2)
    return this.calcMove()
  }

  colorTiles(from: string, to: string): MoveResult | string {
    this.board.transformTiles((t: Tile) => (t.toString() == from ? new Tile(to) : t))
    return this.calcMove()
  }

  private isMoveValid(c1: [number, number], c2: [number, number]): boolean {
    if ((Math.abs(c1[0] - c2[0]) > 1) || (Math.abs(c1[1] - c2[1]) > 1)) return false;
    if ((c1[0] - c2[0] === 0) && (c1[1] - c2[1] === 0)) return false;
    if ((Math.abs(c1[0] - c2[0]) === 1) && (Math.abs(c1[1] - c2[1]) !== 0)) return false;
    if ((Math.abs(c1[1] - c2[1]) === 1) && (Math.abs(c1[0] - c2[0]) !== 0)) return false;
    if (this.board.getTile(c1[0], c1[1]).type == TileType.Block || this.board.getTile(c2[0], c2[1]).type == TileType.Block) return false;
    if (this.board.getTile(c1[0], c1[1]).isEmpty() || this.board.getTile(c2[0], c2[1]).isEmpty()) return false;
    return true;
  }

  private calcMove(): MoveResult {
    let res: MoveResult = {
      removedCombinations: [],
      hasAdditionalMove: false,
      hasMatch: false,
      mapAfterMove: this.board.copy(),
      resultMap: []
    }
    var step = 1
    let combinations = []
    do {
      this.matchesCounter = 0
      combinations = this.markMatches(step)
      step++
      if (combinations.length > 0) {
        let stepResult = {combinations: combinations, finalMap: this.board.copy()}
        res.removedCombinations.push(stepResult)
        res.hasMatch = true
        res.hasAdditionalMove = this.calcAddMove(combinations) || res.hasAdditionalMove
      }
    } while (combinations.length > 0)
    res.resultMap = this.board.copy()
    return res
  }

  private calcAddMove(combinations: Array<GameCombination>): boolean {
    for (let i in combinations) {
      if (combinations[i].type != CombinationType.Blow && combinations[i].tiles.length >= 4) {
        if (combinations[i].type == CombinationType.Hit && !this.frozenHit) return true
        if (combinations[i].tileColor != null && !this.frozenColors.has(combinations[i].tileColor!)) return true
      }
    }
    return false
  }

  private getTile(coords: BoardCoordinates): Tile {
    let [i, j] = coords.getValues()
    return this.board.getTile(i, j)
  } 

  private markMatches(stepNo: number): Array<GameCombination> {
    // console.log("step: " + stepNo)
    // this.board.printBoard()
    this.markMatchesInDirection(Direction.Horizontal)
    this.markMatchesInDirection(Direction.Vertical)
    // this.board.printMarks()
    if (this.matchesCounter > 0) {
      let combinations = this.calculateCombinations()
      this.removeMatches()
      return combinations
    }
    return []
  }

  private markMatchesInDirection(direction: Direction) {
    let coordsMapper = getCoordsMapper(direction)
  
    var self = this
    let markAndUpdateResult = function(markWith: number, coords: BoardCoordinates) {
      if (matchedTiles >= 3) {
        self.markMatchedTiles(markWith, coords)
        if (markWith == self.matchesCounter + 1) {
          self.matchesCounter++
          markWith = self.matchesCounter + 1
        }
      }
      matchedTiles = 1
    }
  
    var matchedTiles = 1
    for (let i = 0; i < boardSize; i++) {
      var markWith = this.matchesCounter + 1
      for (let j = 1; j < boardSize; j++) {
        let coords = new BoardCoordinates(i, j, coordsMapper)
        let curElem = this.getTile(coords)
        let prevElem = this.getTile(coords.left())
        if (curElem.matchesWith(prevElem)) {
          if (curElem.mark.isMatched()) markWith = curElem.mark.value
          if (prevElem.mark.isMatched()) markWith = prevElem.mark.value
          matchedTiles++;
        } else {
          markAndUpdateResult(markWith, coords.left())
          matchedTiles = 1
        }
      }
      markAndUpdateResult(markWith, new BoardCoordinates(i, boardSize - 1, coordsMapper))
    }
  }

  private markMatchedTiles(markWith: number, coords: BoardCoordinates) {
    // console.log("Marking tiles with ", markWith, coords)
    let elem = this.getTile(coords)
    elem.mark.markMatched(markWith)
    let prevCoords = coords.left()
    while (prevCoords.j >= 0 && this.getTile(prevCoords).matchesWith(elem)) {
      let prevElem = this.getTile(prevCoords)
        prevElem.mark.markMatched(markWith)
        if (prevElem.blows()) {
            this.markRockSkullEffect(prevCoords)
        }
        prevCoords = prevCoords.left()
    }
  }

  private markRockSkullEffect(coords: BoardCoordinates) {
    let checkAndMark = (coords: BoardCoordinates) => {
        let tile = null
        try {
          tile = this.getTile(coords)
        } catch (e: any) {
          return
        }
        if (tile.isEmpty() || tile.mark.isBlown() || tile.mark.isMatched()) return
        tile.mark.markBlown()
        if (tile.blows()) {
          this.markRockSkullEffect(coords)
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

  private calculateCombinations(): Array<GameCombination> {
    let self = this
    let searchTiles = function(combination: GameCombination, cond: (t: Tile) => boolean) {
      for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
          let tile = self.board.getTile(i, j)
          if (cond(tile)) {
            combination.addTile(tile, i, j)
          }
        }
      }
    }

    let res: Array<GameCombination> = []
    for (let mark = 1; mark < this.matchesCounter + 1; mark++) {
      let combination = new GameCombination()
      searchTiles(combination, (t) => t.mark.value == mark)
      res.push(combination)
    }
    let blows = new GameCombination()
    blows.type = CombinationType.Blow
    searchTiles(blows, (t) => t.mark.isBlown())
    if (blows.tiles.length > 0) {
      res.push(blows)
    }
    return res
  }

  private removeMatches() {
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (this.board.getTile(i, j).mark.isMarked())
          this.board.removeTile(i, j)
      }
    }
    // this.board.printBoard()
    for (let i = 1; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (this.board.getTile(i, j).isEmpty()) {
          var n = i
          while (n > 0) {
            this.board.setTile(n, j, this.board.getTile(n-1, j))
            this.board.removeTile(n-1, j)
            n--
          }
        }
      }
    }
  }
}

export class GameCombination {
  tiles: Array<TileWithCoordinates> = []
  type: CombinationType = CombinationType.Unknown
  tileColor?: TileColor
  hitInc: number = 0

  addTile(tile: Tile, i: number, j: number) {
    this.tiles.push({ tile: tile, coords: [i, j]})
    if (this.type == CombinationType.Unknown) {
      if (tile.type == TileType.Color) { 
        this.type = CombinationType.Mana 
        this.tileColor = tile.color
      }
      if (tile.type == TileType.Skull) { this.type = CombinationType.Hit }
      if (tile.type == TileType.RockSkull) { 
        this.type = CombinationType.Hit 
        this.hitInc += 5
      }
    }
  }

  hasAdditionalMove(): boolean {
    return this.tiles.length >= 4
  }
}

export interface TileWithCoordinates {
  tile: Tile
  coords: [number, number]
}

type CoordsMapper = (i: number, j: number) => [number, number]

function getCoordsMapper(direction: Direction): CoordsMapper {
  if (direction == Direction.Horizontal) {
    return (i, j) => [i, j]
  } else {
    return (i, j) => [j, i]
  }
} 

class BoardCoordinates {
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
    return new BoardCoordinates(i, j, this.mapper)
  }

  left(): BoardCoordinates {
    return this.copy(this.i, this.j-1)    
  }

  right(): BoardCoordinates {
    return this.copy(this.i, this.j+1)    
  }

  up(): BoardCoordinates {
    return this.copy(this.i-1, this.j)    
  }

  down(): BoardCoordinates {
    return this.copy(this.i+1, this.j)    
  }
}

enum Direction { Vertical, Horizontal }

export enum TileType {
  Color,
  Skull,
  RockSkull,
  Empty,
  Block,
  Garg,
  Other
}

export enum CombinationType {
  Mana,
  Hit,
  Blow,
  Unknown
}

enum TileColor {
  Red, Green, Blue, Brown, Yellow, Violet
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

class Tile {
  readonly type: TileType
  readonly color?: TileColor
  mark: Mark

  static emptyTile: Tile = new Tile('EM')

  constructor(value: string) {
    switch(value) {
      case 'RE': {this.type = TileType.Color; this.color = TileColor.Red; break}
      case 'GR': {this.type = TileType.Color; this.color = TileColor.Green; break}
      case 'BL': {this.type = TileType.Color; this.color = TileColor.Blue; break}
      case 'BR': {this.type = TileType.Color; this.color = TileColor.Brown; break}
      case 'YE': {this.type = TileType.Color; this.color = TileColor.Yellow; break}
      case 'VI': {this.type = TileType.Color; this.color = TileColor.Violet; break}
      case 'SK': {this.type = TileType.Skull; break}
      case 'RS': {this.type = TileType.RockSkull; break}
      case 'BK': {this.type = TileType.Block; break}
      case 'GG': {this.type = TileType.Garg; break}
      case 'EM': {this.type = TileType.Empty; break}
      default: {this.type = TileType.Other}
    }
    this.mark = new Mark()
  }

  canMove(): boolean {
    return this.type != TileType.Other
  }

  sholdBeRemoved(): boolean {
    return this.mark.isMatched() || this.mark.isBlown()
  }

  toConsoleString(): string {
    if (this.type == TileType.Other) return "🔔"
    if (this.type == TileType.Skull) return "⬜️"
    if (this.type == TileType.RockSkull) return "🔳"
    if (this.type == TileType.Empty) return "❌"
    if (this.type == TileType.Block) return "⭕️"
    if (this.type == TileType.Garg) return "😈"
    switch(this.color) {
      case TileColor.Red: return "🟥"
      case TileColor.Blue: return "🟦"
      case TileColor.Green: return "🟩"
      case TileColor.Brown: return "🟫"
      case TileColor.Yellow: return "🟨"
      case TileColor.Violet: return "🟪"
      default: return "🔔"
    }
  }

  toString(): string {
    if (this.type == TileType.Other) return "OT"
    if (this.type == TileType.Skull) return "SK"
    if (this.type == TileType.RockSkull) return "RS"
    if (this.type == TileType.Block) return "BK"
    if (this.type == TileType.Garg) return "GG"
    if (this.type == TileType.Empty) return "EM"
    switch(this.color) {
      case TileColor.Red: return "RE"
      case TileColor.Blue: return "BL"
      case TileColor.Green: return "GR"
      case TileColor.Brown: return "BR"
      case TileColor.Yellow: return "YE"
      case TileColor.Violet: return "VI"
      default: return "UN"
    }
  }

  matchesWith(t: Tile): boolean {
    if (this.type == TileType.Color && t.type == TileType.Color) return this.color == t.color
    if ((this.type == TileType.Skull || this.type == TileType.RockSkull) && 
        (t.type == TileType.Skull || t.type == TileType.RockSkull)) return true
    return false
  }

  isEmpty(): boolean {
    return this.type == TileType.Empty
  }

  blows(): boolean {
    return this.type == TileType.RockSkull
  }
}
