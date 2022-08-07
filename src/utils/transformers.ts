import { TileView } from "../models/TileView"
import { GameBoard } from "../logic/GameBoard"
import { Tile, ManaColor, SkullType, TileType } from "../logic/Tile"

export function tileToString(t: Tile): string {
  if (t.type == TileType.Unknown) return "UN"
  if (t.type == TileType.Skull) return t.scullType == SkullType.Normal ?  "SK" : "RS"
  if (t.type == TileType.Block) return "BK"
  if (t.type == TileType.Garg) return "GG"
  if (t.type == TileType.Empty) return "EM"
  switch (t.color) {
    case ManaColor.Red: return "RE"
    case ManaColor.Blue: return "BL"
    case ManaColor.Green: return "GR"
    case ManaColor.Brown: return "BR"
    case ManaColor.Yellow: return "YE"
    case ManaColor.Violet: return "VI"
    default: return "UN"
  }
}

export function tileFromString(value: string): Tile {
  let type = TileType.Unknown
  let color = undefined
  let skullType = undefined
  switch (value) {
    case 'RE': { type = TileType.Color; color = ManaColor.Red; break }
    case 'GR': { type = TileType.Color; color = ManaColor.Green; break }
    case 'BL': { type = TileType.Color; color = ManaColor.Blue; break }
    case 'BR': { type = TileType.Color; color = ManaColor.Brown; break }
    case 'YE': { type = TileType.Color; color = ManaColor.Yellow; break }
    case 'VI': { type = TileType.Color; color = ManaColor.Violet; break }
    case 'SK': { type = TileType.Skull; skullType = SkullType.Normal; break }
    case 'RS': { type = TileType.Skull; skullType = SkullType.Rock; break }
    case 'BK': { type = TileType.Block; break }
    case 'GG': { type = TileType.Garg; break }
    case 'EM': { type = TileType.Empty; break }
    default: { type = TileType.Unknown }
  }
  return new Tile(type, color, skullType)
}

export function colorToString(c: ManaColor): string {
  return tileToString(new Tile(TileType.Color, c))
}

export function boardToGameBoard(b: Array<Array<TileView>>): GameBoard {
  let tilesBoard = b.map((line) => line.map((elem) => tileFromString(elem.tileClass)))
  return new GameBoard().withBoard(tilesBoard)
}

export function gameBoardToBoard(b: GameBoard): Array<Array<TileView>> {
  return b.board.map((line) => line.map((elem) => new TileView(elem)))
}
