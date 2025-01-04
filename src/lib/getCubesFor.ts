import { rgbComponents } from './colorUtils'
import { batchedPromiseAll } from 'batched-promise-all'
import { solveCube } from './solveCube'

export type Colors = {
  U: string
  D: string
  L: string
  R: string
  F: string
  B: string
}

type CubeData = {
  [key: string]: string
}

export type CubeInfo = {
  x: number
  y: number
  cubeDefn: string
  orientation: CubeData
}

export type GetCubesResult = {
  error?: string
  cubes?: Array<CubeInfo>
}

export type ExportCubesResult = {
  x: number
  y: number
  cubeDefn: string
  orientation: {
    [key in keyof Colors]: {
      colorName: string
      colorValue: string
    }
  }
  generator: string
}[]

export async function exportAllCubes(cubes: CubeInfo[], colorMap: {[key: string]: string}): Promise<ExportCubesResult> {
  return await batchedPromiseAll(cubes, async ({x, y, cubeDefn, orientation}) => {
    const generator = await solveCube(cubeDefn);
    return {
      x, y, cubeDefn, generator,
      orientation: Object.fromEntries(Object.entries(orientation).map(([k, v]) => {
        return [k, {colorName: v, colorValue: colorMap[v]}]
      }))
    }
  }, 250);
}

export async function getCubesFor(image: Uint8Array, colors: Colors): Promise<GetCubesResult> {
  const colorString = [colors.U, colors.R, colors.F, colors.D, colors.L, colors.B]
    .flatMap(rgbComponents)
    .join(',')

  const url = `https://www.cs.toronto.edu/~motiwala/get-cubes.cgi?${encodeURIComponent(colorString)}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: image,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const text = await response.text()

    if (text.toLowerCase().includes('usage') || text.toLowerCase().includes('error')) {
      return { error: text }
    }
    
    const cubes = text.split('\n').filter(Boolean).map(line => {
      const [sx, sy, cubeDefn, ...dataString] = line.split(',')
      const [x, y] = [sx,sy].map(Number)
      const data: CubeData = {}
      
      dataString.forEach(pair => {
        const [key, value] = pair.split('')
        data[key] = value
      })

      return { x, y, cubeDefn, orientation: data }
    })

    return { cubes }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

