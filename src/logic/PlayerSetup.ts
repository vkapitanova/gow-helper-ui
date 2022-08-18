import { Tile } from "./Tile"

export interface PlayerSetup {
  painters: Array<Painter>
  frozenColors: Set<string>
}
export type Painter = Array<TilesTransformation>
export interface TilesTransformation {
  from: Array<Tile>
  to: Tile
}