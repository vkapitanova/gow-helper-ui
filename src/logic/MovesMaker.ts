import { BoardCoordinates, GameBoard } from "./GameBoard";
import { GameMatch, MatchesFinder, MatchType } from "./MatchesFinder";
import { ManaColor, Tile, TileType } from "./Tile";
import { tileFromString } from "../utils/transformers";
import { Painter } from "./PlayerSetup";

export interface MoveResult {
  steps: Array<StepResult>
  hasAdditionalMove: boolean
  hasMatch: boolean
  mapAfterMove: GameBoard
  resultMap: GameBoard
}

export interface StepResult {
  matches: Array<GameMatch>
  blown: Array<[Tile, BoardCoordinates]>
  resultMap: GameBoard
}

export class MovesMaker {
  board: GameBoard
  frozenColors: Set<ManaColor> = new Set<ManaColor>()
  frozenHit: boolean = false

  constructor(board: GameBoard, frozenColors: Set<string> = new Set<string>()) {
    this.board = board.copy()
    for (let c of frozenColors) {
      let tile = tileFromString(c)
      if (tile.color != null) {
        this.frozenColors.add(tileFromString(c).color!)
      }
      if (tile.type == TileType.Skull) this.frozenHit = true
    }
  }

  moveTiles(c1: BoardCoordinates, c2: BoardCoordinates): MoveResult | string {
    if (!this.isMoveValid(c1, c2)) return "incorrect move: tile should be close to each other"
    let t = this.board.getTile(c1)
    this.board.setTile(c1, this.board.getTile(c2))
    this.board.setTile(c2, t)
    return this.calcMove()
  }

  paintOver(changes: Array<[Tile, Tile]>): MoveResult | string {
    for (let [from, to] of changes) {
      this.board.transformTiles((t: Tile) => (t.equal(from) ? to : t))
    }
    return this.calcMove()
  }

  private isMoveValid([i1, j1]: BoardCoordinates, [i2, j2]: BoardCoordinates): boolean {
    if ((Math.abs(i1 - i2) > 1) || (Math.abs(j1 - j2) > 1)) return false;
    if ((i1 - i2 === 0) && (j1 - j2 === 0)) return false;
    if ((Math.abs(i1 - i2) === 1) && (Math.abs(j1 - j2) !== 0)) return false;
    if ((Math.abs(j1 - j2) === 1) && (Math.abs(i1 - i2) !== 0)) return false;
    if (!this.board.getTile([i1, j1]).canMove() || !this.board.getTile([i2, j2]).canMove()) return false;
    return true;
  }

  private calcMove(): MoveResult {
    let res: MoveResult = {
      steps: [],
      hasAdditionalMove: false,
      hasMatch: false,
      mapAfterMove: this.board.copy(),
      resultMap: new GameBoard()
    }
    let matches: Array<GameMatch> = []
    let blownCoordinates: Array<BoardCoordinates> = []
    do {
      [matches, blownCoordinates] = new MatchesFinder(this.board).findMatches()
      if (matches.length > 0) {
        let blownTiles: Array<[Tile, BoardCoordinates]> = blownCoordinates.map((c) => [this.board.getTile(c), c])
        let matchedTilesCoords = matches.map((m) => m.tiles).flat()
        let blownTilesCoords = blownTiles.map(([t, c]) => c)
        this.board.removeTiles(matchedTilesCoords.concat(blownTilesCoords))

        res.steps.push({ matches: matches, blown: blownTiles, resultMap: this.board.copy() })
        res.hasMatch = true
        res.hasAdditionalMove = this.calcAddMove(matches) || res.hasAdditionalMove
      }
    } while (matches.length > 0)
    res.resultMap = this.board.copy()
    return res
  }

  private calcAddMove(combinations: Array<GameMatch>): boolean {
    for (let i in combinations) {
      if (combinations[i].tiles.length >= 4) {
        if (combinations[i].type == MatchType.Hit && !this.frozenHit) return true
        if (combinations[i].manaColor != null && !this.frozenColors.has(combinations[i].manaColor!)) return true
      }
    }
    return false
  }
}