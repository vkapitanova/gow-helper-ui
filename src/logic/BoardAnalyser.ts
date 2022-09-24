import { BoardCoordinates, boardSize, GameBoard } from "./GameBoard"
import { MoveResult, MovesMaker, StepResult } from "./MovesMaker"
import { ManaColor, Tile, TileType } from "../models/Tile"
import { MatchType } from "./MatchesFinder"
import { Card, getFrozenColors } from "../models/Cards"

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
  cardPlayed?: Card

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
  myCards: Array<Card>
  opponentCards: Array<Card>

  constructor(board: GameBoard, myCards: Array<Card>, opponentCards: Array<Card>) {
    this.board = board
    this.myCards = myCards
    this.opponentCards = opponentCards
  }

  analyseBoard(): Array<MoveAnalysis> {
    let res: Array<MoveAnalysis> = []
    let possibleMoves = this.collectPossibleMovesForSetup(this.board, this.myCards)
    for (let move of possibleMoves) {
      let anMove: MoveAnalysis = {move: move, nextMoveSummary: null}
      let nextMoveSetup = move.moveResult.hasAdditionalMove ? this.myCards : this.opponentCards
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
    let mainColors = this.myCards.filter(c => c.isMain).map(c => c.mana).flat()
    this.sortSuggestedMoves(res, new Set(mainColors))
    return res
  }

  private sortSuggestedMoves(moves: Array<MoveAnalysis>, mainColors: Set<ManaColor>) {
    moves.sort((m1, m2) => {
      // options with additional move go first
      if (m1.move.moveResult.hasAdditionalMove != m2.move.moveResult.hasAdditionalMove) {
        return m1.move.moveResult.hasAdditionalMove ? -1 : 1
      }

      let passMove = !m1.move.moveResult.hasAdditionalMove
      // if opponent has additional move - sort last
      if (passMove) {
        if (m1.nextMoveSummary?.additionalMove != m2.nextMoveSummary?.additionalMove)
          return m1.nextMoveSummary?.additionalMove ? 1 : -1
        if (m1.nextMoveSummary?.hit && !m2.nextMoveSummary?.hit) return 1
      // if there is my additional move after this one - sort first
      } else {
        if (m1.nextMoveSummary?.additionalMove != m2.nextMoveSummary?.additionalMove)
          return m1.nextMoveSummary?.additionalMove ? -1 : 1
        if (m1.nextMoveSummary?.hit && !m2.nextMoveSummary?.hit) return -1
      }
      // if there's a hit - sort first
      if (m1.move.hits > m2.move.hits || !passMove && m1.nextMoveSummary?.hit && !m2.nextMoveSummary?.hit) {
        return -1
      }
      // if there's opponent hit - sort last
      if (passMove && m1.nextMoveSummary?.hit && !m2.nextMoveSummary?.hit) {
        return 1
      }
      // rest sort by collected mana considering main mana cards
      let m1Mana = m1.move.collectedMana.map(([mana, amount]) => mainColors.has(mana) ? amount * 5 : amount ).reduce((a, b) => a + b, 0)
      let m2Mana = m2.move.collectedMana.map(([mana, amount]) => mainColors.has(mana) ? amount * 5 : amount ).reduce((a, b) => a + b, 0)
      return m2Mana - m1Mana
    })
  }
  
  private collectPossibleMovesForSetup(board: GameBoard, cards: Array<Card>): Array<PossibleMove> {
    // look for tiles change
    let moves: Array<PossibleMove> = []
    for (let i = 0; i < boardSize; i++) {
      for (let j = 1; j < boardSize; j++) {
          let m1 = this.tryTilesChange([i, j], [i, j-1], board, cards)
          if (m1 != null) moves.push(m1)
          let m2 = this.tryTilesChange([j, i], [j-1, i], board, cards)
          if (m2 != null) moves.push(m2)
      }
    }
    // look for painters
    for (let card of cards) {
      if (!card.hasFullMana) continue
      let combinations: Array<Array<[Tile, Tile]>> = [[]]
      for (let t of card.transformations) {
        let clone = combinations;
        let [fromList, to] = t
        combinations = []
        for (let from of fromList) {
          if (from == to) continue
          combinations = combinations.concat(clone.map(a => a.concat([[from, to]])))
        }  
      }
      for (let c of combinations) {
        let r = this.tryColoring(board, c, cards)
        if (r != null) {
          r.cardPlayed = card
          moves.push(r)      
        }
      }
    }
    return moves
  }

  private tryColoring(board: GameBoard, changes: Array<[Tile, Tile]>, cards: Array<Card>): PossibleMove | null {
    let result = new MovesMaker(board.copy(), getFrozenColors(cards), cards[0].isFrosen).paintOver(changes)
    let res = this.findMoves(result)
    if (res != null) {
      res.moveType = MoveType.ChangeTileType
      res.tilesChanged = changes
    }
    return res
  }
  
  private tryTilesChange(c1: BoardCoordinates, c2: BoardCoordinates, board: GameBoard, cards: Array<Card>): PossibleMove | null {
    let result = new MovesMaker(board.copy(), getFrozenColors(cards), cards[0].isFrosen).moveTiles(c1, c2)
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