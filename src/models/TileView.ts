import { tileToString } from "../utils/transformers"
import { generateRandomKey } from "../utils/utils"
import { Tile } from "./Tile"

export class TileView {
  tileClass: string
  isSelected: boolean = false
  isHighlighted: boolean = false
  isMatchHighlighted: boolean = false
  fade: boolean = false
  key: string
  tile: Tile

  constructor(tile: Tile) {
    this.tileClass = tileToString(tile)
    this.key = generateRandomKey()
    this.tile = tile
  }
}