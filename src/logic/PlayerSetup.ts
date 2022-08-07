import { Tile } from "./Tile"

export interface PlayerSetup {
  painters: Array<Painter>
  frozenColors: Set<string>
}
export interface Painter {
  from: Array<Tile>
  to: Tile
}