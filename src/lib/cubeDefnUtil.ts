export const faceIndices: { [key: string]: number } = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 }

export const colorAt = (cubeDefn: string, face: string, idx: number) => {
  return cubeDefn[faceIndices[face] * 9 + idx]
}

export const extractFace = (cubeDefn: string, face: string): string => {
  const startIndex = faceIndices[face] * 9
  return cubeDefn.slice(startIndex, startIndex + 9)
}

export const solvedCubeDefn = Array.from("URFDLB").flatMap(c => Array(9).fill(c)).join('')

export const colorizeCubeDefn = (cubeDefn: string, orientation: {[key: string]: string}): string => {
  return Array.from(cubeDefn).map(c => orientation[c]).join('')
}

