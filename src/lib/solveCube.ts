const solutionCache = new Map<string, string>()

export async function solveCube(cubeDefn: string): Promise<string> {
  if (solutionCache.has(cubeDefn)) {
    return solutionCache.get(cubeDefn) as string
  }
  
  const url = `https://www.cs.toronto.edu/~motiwala/cube-generator.cgi?${encodeURIComponent(cubeDefn)}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const text = await response.text()

    if (text.toLowerCase().includes('fail')) {
      return `Error: ${text}`
    }

    const moveStr = text.split('\n')[0];
    
    solutionCache.set(cubeDefn, moveStr)

    return moveStr
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`
  }
}

