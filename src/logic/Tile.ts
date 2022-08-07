
export enum TileType {
  Color,
  Skull,
  Empty,
  Block,
  Garg,
  Unknown
}

export enum ManaColor {
  Red, Green, Blue, Brown, Yellow, Violet
}

export enum SkullType {
  Normal, Rock
}

export class Tile {
  readonly type: TileType
  readonly color?: ManaColor
  readonly scullType?: SkullType

  constructor(type: TileType, color?: ManaColor, skullType?: SkullType) {
    this.type = type
    this.color = color
    this.scullType = skullType
  }

  static empty: Tile = new Tile(TileType.Empty)
  static yellow: Tile = new Tile(TileType.Color, ManaColor.Yellow)
  static violet: Tile = new Tile(TileType.Color, ManaColor.Violet)
  static red: Tile = new Tile(TileType.Color, ManaColor.Red)
  static green: Tile = new Tile(TileType.Color, ManaColor.Green)
  static blue: Tile = new Tile(TileType.Color, ManaColor.Blue)
  static brown: Tile = new Tile(TileType.Color, ManaColor.Brown)
  static skull: Tile = new Tile(TileType.Skull, undefined, SkullType.Normal)
  static rockSkull: Tile = new Tile(TileType.Skull, undefined, SkullType.Rock)

  canMove(): boolean {
    return this.type != TileType.Block
  }

  toConsoleString(): string {
    if (this.type == TileType.Unknown) return "🔔"
    if (this.type == TileType.Skull) return this.scullType == SkullType.Normal ?  "⬜️" : "🔳"
    if (this.type == TileType.Empty) return "❌"
    if (this.type == TileType.Block) return "⭕️"
    if (this.type == TileType.Garg) return "😈"
    switch (this.color) {
      case ManaColor.Red: return "🟥"
      case ManaColor.Blue: return "🟦"
      case ManaColor.Green: return "🟩"
      case ManaColor.Brown: return "🟫"
      case ManaColor.Yellow: return "🟨"
      case ManaColor.Violet: return "🟪"
      default: return "🔔"
    }
  }

  matchesWith(t: Tile): boolean {
    if (this.type == TileType.Color && t.type == TileType.Color) return this.color == t.color
    if (this.type == TileType.Skull && t.type == TileType.Skull) return true
    return false
  }

  isEmpty(): boolean {
    return this.type == TileType.Empty
  }

  blows(): boolean {
    return this.type == TileType.Skull && this.scullType == SkullType.Rock
  }

  equal(t: Tile): boolean {
    return this.type == t.type && this.color == t.color
  }
}
