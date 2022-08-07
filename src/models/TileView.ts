import { tileToString } from "../utils/transformers"
import { Tile } from "../logic/Tile"
import { generateRandomKey } from "../utils/utils"

export class TileView {
  tileClass: string
  isSelected: boolean = false
  isHighlighted: boolean = false
  fade: boolean = false
  key: string
  tile: Tile

  constructor(tile: Tile) {
    this.tileClass = tileToString(tile)
    this.key = generateRandomKey()
    this.tile = tile
  }
}
