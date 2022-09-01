import { ManaColor, Tile } from "./Tile"

export class Card {
  readonly name: string
  readonly mana: Array<ManaColor>
  readonly hasAdvantage: boolean
  transformations: Array<[Array<Tile>, Tile]>
  isFrosen: boolean = false
  hasFullMana: boolean = false

  constructor(name: string, mana: Array<ManaColor>, transformations: Array<[Array<Tile>, Tile]>, hasAdvantage: boolean = false) {
    this.name = name
    this.mana = mana
    this.transformations = transformations
    this.hasAdvantage = hasAdvantage
    if (hasAdvantage) this.hasFullMana = true
  }

  copy(): Card {
    return new Card(this.name, [...this.mana], this.transformations.map(([from, to]) => [[...from], to]), this.hasAdvantage);
  }
}

export const preDefinedCards: Array<Card> = [
  new Card('_Пусто', [], []),
  new Card('_Тест 1', [], [[[Tile.yellow], Tile.green]], true),
  new Card('_Тест 2', [], [[[Tile.yellow], Tile.green], [[Tile.yellow], Tile.skull]], false),
  new Card('Дротик', [ManaColor.Yellow, ManaColor.Blue], [], false),
  new Card('Певец Луны', [ManaColor.Yellow, ManaColor.Blue], [[[Tile.violet], Tile.green]], true),
  new Card('Пчела', [ManaColor.Green, ManaColor.Blue], [], false),
  new Card('Малькандесса', [ManaColor.Blue, ManaColor.Violet], [[[Tile.yellow], Tile.green]], true),
  new Card('Ишбала', [ManaColor.Violet, ManaColor.Yellow], [[[Tile.red], Tile.skull], [[Tile.green], Tile.yellow]], false),
  new Card('Могильный мудрец', [ManaColor.Red, ManaColor.Yellow], [[[Tile.green], Tile.violet]], true),
  new Card('Ламашту', [ManaColor.Red, ManaColor.Yellow], [[[Tile.yellow], Tile.violet]], true),
  new Card('Крушитель', [ManaColor.Brown], [], false),
  new Card('Алхимик', [ManaColor.Red, ManaColor.Brown], [[Tile.allColors, Tile.yellow]], false),
  new Card('Гнев', [ManaColor.Brown, ManaColor.Yellow], [[[Tile.blue], Tile.brown], [[Tile.yellow], Tile.skull]], false),
  new Card('Хедли', [ManaColor.Brown, ManaColor.Yellow], [[[Tile.violet], Tile.yellow], [[Tile.green], Tile.skull]], false),
  new Card('Арбалет Беды', [ManaColor.Red], [[[Tile.blue], Tile.rockSkull]], false),
  new Card('Морской волк', [ManaColor.Red, ManaColor.Yellow], [[[Tile.green], Tile.blue]], true),
  new Card('Зуул', [ManaColor.Red, ManaColor.Blue, ManaColor.Violet], [], false),
  new Card('Утонувший матрос', [ManaColor.Red, ManaColor.Violet], [[[Tile.yellow], Tile.blue]], true),
  new Card('Отражение добра', [ManaColor.Violet], [], false),
  new Card('Дочь льда', [ManaColor.Brown, ManaColor.Violet], [[[Tile.red], Tile.blue]], true),
  new Card('Обреченная Коса', [ManaColor.Violet], [[[Tile.yellow], Tile.rockSkull]], false),
  new Card('Хранитель душ', [ManaColor.Brown, ManaColor.Violet], [[Tile.allColors, Tile.skull]], false),
  new Card('Лунный кролик', [ManaColor.Violet, ManaColor.Green], [[[Tile.blue], Tile.yellow]], true),
  new Card('Эссенция зла', [ManaColor.Green], [], false),
  new Card('Дитя лета', [ManaColor.Yellow, ManaColor.Green], [[[Tile.brown], Tile.red]], true),
  new Card('Яо Гуай', [ManaColor.Red, ManaColor.Green], [[[Tile.violet], Tile.red]], false),
  new Card('Старпом Топорищников', [ManaColor.Violet, ManaColor.Green], [[[Tile.blue], Tile.red]], true),
  new Card('Гимлет', [ManaColor.Red, ManaColor.Yellow], [[[Tile.green], Tile.brown]], true),
  new Card('Милосердие', [ManaColor.Green, ManaColor.Blue], [[[Tile.violet], Tile.yellow]], true),
  new Card('Древний Прислужник', [ManaColor.Red, ManaColor.Blue], [[[Tile.brown], Tile.violet]], true),
  new Card('Тай-Пан', [ManaColor.Green, ManaColor.Blue], [[[Tile.brown], Tile.red]], true),
  new Card('Курандара', [ManaColor.Red, ManaColor.Green, ManaColor.Violet], [[[Tile.yellow], Tile.rockSkull]], false),
  new Card('Кулак Зорна', [ManaColor.Red, ManaColor.Violet], [[[Tile.yellow], Tile.skull]], true),
  new Card('Апофис', [ManaColor.Red, ManaColor.Yellow], [[[Tile.green], Tile.skull]], true),
  new Card('Обреченная Глефа', [ManaColor.Green], [[[Tile.brown], Tile.rockSkull]], false),
  new Card('Адский король', [ManaColor.Violet, ManaColor.Yellow], [[[Tile.green], Tile.skull], [[Tile.brown], Tile.red]], false),
  new Card('Аптекарь', [ManaColor.Green, ManaColor.Blue], [[Tile.allColors, Tile.brown]], false),
  new Card('Герольд Погибели', [ManaColor.Red, ManaColor.Brown], [[[Tile.blue], Tile.violet]], true),
  new Card('Королева Мараджей', [ManaColor.Red, ManaColor.Blue], [[[Tile.green], Tile.rockSkull]], false),
  new Card('Король Кровавый Молот', [ManaColor.Red, ManaColor.Brown], [[[Tile.blue], Tile.rockSkull]], false),
  new Card('Ледникон', [ManaColor.Brown, ManaColor.Violet], [[[Tile.yellow], Tile.blue], [[Tile.red], Tile.rockSkull]], false),
  new Card('Мойра', [ManaColor.Blue, ManaColor.Brown], [[[Tile.green], Tile.rockSkull]], false),
  new Card('Нимуэ', [ManaColor.Violet, ManaColor.Green], [[[Tile.red], Tile.violet], [[Tile.yellow], Tile.skull]], false),
  new Card('Отец Ольха', [ManaColor.Violet, ManaColor.Green], [[[Tile.red], Tile.violet], [[Tile.yellow], Tile.skull]], false),
  new Card('Сехма', [ManaColor.Red, ManaColor.Violet], [[[Tile.blue], Tile.skull], [[Tile.brown], Tile.yellow]], false),
  new Card('Танцующая с духами', [ManaColor.Blue, ManaColor.Violet], [[Tile.allColors, Tile.green]], false),
  new Card('Трк"Нала', [ManaColor.Red, ManaColor.Yellow], [[[Tile.green], Tile.skull]], true),
  new Card('Уваш-Ка', [ManaColor.Green, ManaColor.Blue], [[[Tile.violet], Tile.rockSkull]], false),
  new Card('Фонтан Звезд', [ManaColor.Red, ManaColor.Yellow, ManaColor.Blue], [[[Tile.brown], Tile.skull]], false),
  new Card('Цилинь', [ManaColor.Red, ManaColor.Yellow], [[[Tile.violet], Tile.red], [[Tile.brown], Tile.skull]], false),
]

export function getCardByName(name: string): Card {
  for (let c of preDefinedCards) {
    if (c.name == name) return c
  }
  return preDefinedCards[0]
}

export function getFrozenColors(cards: Array<Card>): Set<ManaColor> {
  let frozenColors: Array<ManaColor> = cards.filter(c => c.isFrosen).map(c => c.mana).flat()
  return new Set(frozenColors)
}

export const teams: Map<string, Array<string>> = new Map([
  ['-', []],
  ['🟦 Синий Пчела', ['Дротик', 'Певец Луны', 'Пчела', 'Малькандесса']],
  ['🟨 Желтый Ишба', ['Дротик', 'Ишбала', 'Могильный мудрец', 'Ламашту']],
  ['🟫 Коричневый Алхимик', ['Крушитель', 'Алхимик', 'Гнев', 'Хедли']],
  ['🟥 Красный Зуул', ['Арбалет Беды', 'Морской волк', 'Зуул', 'Утонувший матрос']],
  ['🟪 Фиолетовый Зуул', ['Отражение добра', 'Дочь льда', 'Зуул', 'Утонувший матрос']],
  ['🟪 Фиолетовый Ишба', ['Обреченная Коса', 'Ишбала', 'Хранитель душ', 'Лунный кролик']],
  ['🟩 Зеленый Яо Гуай', ['Эссенция зла', 'Дитя лета', 'Яо Гуай', 'Старпом Топорищников']],
])
