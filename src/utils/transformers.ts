import { Tile, ManaColor, SkullType, TileType } from "../models/Tile"

export function tileToString(t: Tile): string {
  if (t.type == TileType.Unknown) return "unknown"
  if (t.type == TileType.Skull) return t.scullType == SkullType.Normal ?  "skull_normal" : "skull_rock"
  if (t.type == TileType.Block) return "block"
  if (t.type == TileType.Garg) return "gargoyle"
  if (t.type == TileType.Empty) return "empty"
  switch (t.color) {
    case ManaColor.Red: return t.type == TileType.GreatColor ? "great_red" : "basic_red"
    case ManaColor.Blue: return t.type == TileType.GreatColor ? "great_blue" : "basic_blue"
    case ManaColor.Green: return t.type == TileType.GreatColor ? "great_green" : "basic_green"
    case ManaColor.Brown: return t.type == TileType.GreatColor ? "great_brown" : "basic_brown"
    case ManaColor.Yellow: return t.type == TileType.GreatColor ? "great_yellow" : "basic_yellow"
    case ManaColor.Violet: return t.type == TileType.GreatColor ? "great_violet" : "basic_violet"
    default: return "unknown"
  }
}

export function tileFromString(value: string): Tile {
  let type = TileType.Unknown
  let color = undefined
  let skullType = undefined
  switch (value) {
    case 'basic_red': { type = TileType.Color; color = ManaColor.Red; break }
    case 'basic_green': { type = TileType.Color; color = ManaColor.Green; break }
    case 'basic_blue': { type = TileType.Color; color = ManaColor.Blue; break }
    case 'basic_brown': { type = TileType.Color; color = ManaColor.Brown; break }
    case 'basic_yellow': { type = TileType.Color; color = ManaColor.Yellow; break }
    case 'basic_violet': { type = TileType.Color; color = ManaColor.Violet; break }
    case 'great_red': { type = TileType.GreatColor; color = ManaColor.Red; break }
    case 'great_green': { type = TileType.GreatColor; color = ManaColor.Green; break }
    case 'great_blue': { type = TileType.GreatColor; color = ManaColor.Blue; break }
    case 'great_brown': { type = TileType.GreatColor; color = ManaColor.Brown; break }
    case 'great_yellow': { type = TileType.GreatColor; color = ManaColor.Yellow; break }
    case 'great_violet': { type = TileType.GreatColor; color = ManaColor.Violet; break }
    case 'skull_normal': { type = TileType.Skull; skullType = SkullType.Normal; break }
    case 'skull_rock': { type = TileType.Skull; skullType = SkullType.Rock; break }
    case 'block': { type = TileType.Block; break }
    case 'gargoyle': { type = TileType.Garg; break }
    case 'empty': { type = TileType.Empty; break }
    default: { type = TileType.Unknown }
  }
  return new Tile(type, color, skullType)
}

export function colorToString(c: ManaColor): string {
  return tileToString(new Tile(TileType.Color, c))
}

