export function printArray<Type>(arr: Array<Array<Type>>, toString: (v: Type) => string) {
  for (let i = 0; i < arr.length; i++) {
    var line = i + ': '
    for (let j = 0; j < arr[i].length; j++) {
        line += toString(arr[i][j]) + ' '
    }
    console.log(line)
  }
}

export function generateRandomKey() {
  return (Math.random() + 1).toString(36).substring(2)
}