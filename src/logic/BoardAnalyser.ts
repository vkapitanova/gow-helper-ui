import { BoardCoordinates, boardSize, GameBoard } from "./GameBoard"
import { MoveResult, MovesMaker, StepResult } from "./MovesMaker"
import { ManaColor, Tile, TileType } from "./Tile"
import { PlayerSetup } from './PlayerSetup'
import { MatchType } from "./MatchesFinder"

export enum MoveType {
  MoveTiles,
  ChangeTileType
}

export interface MoveAnalysis {
  move: PossibleMove,
  nextMoveSummary: MoveSummary | null
}

export interface PossibleMove {
  moveType: MoveType
  coords?: [BoardCoordinates, BoardCoordinates]
  tilesChanged?: Array<[Tile, Tile]>

  moveResult: MoveResult
  collectedMana: Array<[ManaColor, number]>
  totalManaCollected: number
  hits: number
}

export interface MoveSummary {
  additionalMove: boolean
  hit: boolean
}

export class BoardAnalyser {
  board: GameBoard
  mySetup: PlayerSetup
  opponentSetup: PlayerSetup

  constructor(board: GameBoard, mySetup: PlayerSetup, opponetSetup: PlayerSetup) {
    this.board = board
    this.mySetup = mySetup
    this.opponentSetup = opponetSetup
  }

  analyseBoard(): Array<MoveAnalysis> {
    let res: Array<MoveAnalysis> = []
    // console.log("analysing moves", this.mySetup)
    let possibleMoves = this.collectPossibleMovesForSetup(this.board, this.mySetup)
    for (let move of possibleMoves) {
      let anMove: MoveAnalysis = {move: move, nextMoveSummary: null}
      let nextMoveSetup = move.moveResult.hasAdditionalMove ? this.mySetup : this.opponentSetup
      let nextMoves = this.collectPossibleMovesForSetup(move.moveResult.resultMap, nextMoveSetup)
      if (nextMoves.length > 0) {
        anMove.nextMoveSummary = {
          additionalMove: false,
          hit: false
        }
        for (let move2 of nextMoves) {
          if (move2.moveResult.hasAdditionalMove) anMove.nextMoveSummary.additionalMove = true
          if (move2.hits > 0) anMove.nextMoveSummary.hit = true
        }
      }
      res.push(anMove)
    }
    this.sortSuggestedMoves(res)
    return res
  }

  private sortSuggestedMoves(moves: Array<MoveAnalysis>) {
    moves.sort((m1, m2) => {
      // options with additional move go first
      if (m1.move.moveResult.hasAdditionalMove != m2.move.moveResult.hasAdditionalMove) 
        return m1.move.moveResult.hasAdditionalMove ? -1 : 1
      // in no moves after this one - sort last
      if (!m1.nextMoveSummary) return 1
      if (!m2.nextMoveSummary) return -1

      let passMove = !m1.move.moveResult.hasAdditionalMove
      // if opponent has additional move - sort last
      if (passMove) {
        if (m1.nextMoveSummary!.additionalMove != m2.nextMoveSummary!.additionalMove)
          return m1.nextMoveSummary!.additionalMove ? 1 : -1
        if (m1.nextMoveSummary.hit) return 1
      // if there is my additional move after this one - sort first
      } else {
        if (m1.nextMoveSummary!.additionalMove != m2.nextMoveSummary!.additionalMove)
          return m1.nextMoveSummary!.additionalMove ? -1 : 1
        if (m1.nextMoveSummary.hit) return -1
      }
      // if there's a hit - sort first
      if (m1.move.hits > 0 || !passMove && m1.nextMoveSummary.hit) return -1
      // if there's opponent hit - sort last
      if (passMove && m1.nextMoveSummary.hit) return 1
      // rest sort by collected mana
      return m2.move.totalManaCollected - m1.move.totalManaCollected
    })
  }
  
  private collectPossibleMovesForSetup(board: GameBoard, setup: PlayerSetup): Array<PossibleMove> {
    // look for tiles change
    let moves: Array<PossibleMove> = []
    for (let i = 0; i < boardSize; i++) {
      for (let j = 1; j < boardSize; j++) {
          let m1 = this.tryTilesChange([i, j], [i, j-1], board, setup)
          if (m1 != null) moves.push(m1)
          let m2 = this.tryTilesChange([j, i], [j-1, i], board, setup)
          if (m2 != null) moves.push(m2)
      }
    }
    // look for painters
    for (let painter of setup.painters) {
      let combinations: Array<Array<[Tile, Tile]>> = [[]]
      for (let c of painter) {
        let clone = combinations;
        combinations = []
        for (let from of c.from) {
          if (from == c.to) continue
          combinations = combinations.concat(clone.map(a => a.concat([[from, c.to]])))
        }  
      }
      for (let c of combinations) {
        let r = this.tryColoring(board, c, setup)
        if (r != null) moves.push(r)      
      }
    }
    return moves
  }

  private tryColoring(board: GameBoard, changes: Array<[Tile, Tile]>, setup: PlayerSetup): PossibleMove | null {
    let result = new MovesMaker(board.copy(), setup.frozenColors).paintOver(changes)
    let res = this.findMoves(result)
    if (res != null) {
      res.moveType = MoveType.ChangeTileType
      res.tilesChanged = changes
    }
    return res
  }
  
  private tryTilesChange(c1: BoardCoordinates, c2: BoardCoordinates, board: GameBoard, setup: PlayerSetup): PossibleMove | null {
    let result = new MovesMaker(board.copy(), setup.frozenColors).moveTiles(c1, c2)
    let res = this.findMoves(result)
    if (res != null) {
      res.moveType = MoveType.MoveTiles
      res.coords = [c1, c2]
    }
    return res
  }
  
  private findMoves(result: MoveResult | string): PossibleMove | null {
    if (typeof result === 'string') {
      return null
    }
    if (result.hasMatch) {
      let [manaArray, totalMana, hits] = this.calculateManaFromSteps(result.steps)
      
      return {
        moveType: MoveType.MoveTiles,
        moveResult: result,
        collectedMana: manaArray,
        totalManaCollected: totalMana,
        hits: hits
      }
    }
    return null
  }

  private calculateManaFromSteps(steps: Array<StepResult>): [Array<[ManaColor, number]>, number, number] {
    let collectedMana = new Map<ManaColor, number>()
    var totalMana = 0
    var hits = 0
    for (let i in steps) {
      let step = steps[i]
      for (let match of step.matches) {
        if (match.type == MatchType.Mana) {
          if (!collectedMana.has(match.manaColor!)) collectedMana.set(match.manaColor!, 0)
          collectedMana.set(match.manaColor!, collectedMana.get(match.manaColor!)! + match.tiles.length)
          totalMana += match.tiles.length
        } else if (match.type == MatchType.Hit) {
          hits++
        }
      }
      if (step.blown.length > 0) {
        totalMana += step.blown.length / 2
        for (let [tile, c] of step.blown) {
          if (tile.type == TileType.Color) {
            if (!collectedMana.has(tile.color!)) collectedMana.set(tile.color!, 0)
            collectedMana.set(tile.color!, collectedMana.get(tile.color!)! + 0.5)
          }
        }  
      }              
    }

    let manaArray: Array<[ManaColor, number]> = []
    for (let [key, value] of collectedMana) {
      manaArray.push([key, value])
    }
    manaArray = manaArray.filter((c) => c[1] > 0)
    manaArray.sort((a, b) => b[1] - a[1])
    return [manaArray, totalMana, hits]
  }
}