'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, HelpCircle } from 'lucide-react'
import { hexToRgb } from '../lib/colorUtils'
import { CubeInfo, getCubesFor } from '../lib/getCubesFor'
import RubiksCardListItem from '../components/RubiksCardListItem'
import { ForceExactSizeToggle } from '../components/ForceExactSizeToggle'

type DitherType = 'None' | 'Riemersma' | 'FloydSteinberg'

export default function Page() {
  const defaultColors = {
    U: '#FFFF00', // Yellow
    D: '#FFFFFF', // White
    L: '#FFA500', // Orange
    R: '#FF0000', // Red
    F: '#0000FF', // Blue
    B: '#00FF00', // Green
  }

  const [colors, setColors] = useState(defaultColors)
  const [width, setWidth] = useState(10)
  const [height, setHeight] = useState(10)
  const [dither, setDither] = useState<DitherType>('FloydSteinberg')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [cubes, setCubes] = useState<CubeInfo[]>([])
  const [skipX, setSkipX] = useState('')
  const [skipY, setSkipY] = useState('')
  const [isLoading, setIsLoading] = useState(false) // Added loading state
  const [showHelp, setShowHelp] = useState(false)
  const [forceExactSize, setForceExactSize] = useState(false)
  const listRef = useRef<List>(null)

  useEffect(() => {
    setCubes([]);
    setProcessedImage(null)
  }, [originalImage]);

  useEffect(() => {
    setCubes([]);
  }, [processedImage]);

  const handleColorChange = (face: keyof typeof colors, color: string) => {
    setColors(prevColors => ({ ...prevColors, [face]: color }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setOriginalImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const processImage = useCallback(async () => {
    if (!originalImage) return

    const response = await fetch(originalImage)
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    const colorString = `${dither};${3*width}x${3*height}${forceExactSize ? '!' : ''};${Object.values(colors).map(hexToRgb).join(';')}`
    const url = `https://www.cs.toronto.edu/~motiwala/rubiksify.cgi?${encodeURIComponent(colorString)}`

    try {
      const res = await fetch(url, {
        method: 'POST',
        body: uint8Array,
      })

      if (!res.ok) throw new Error('Failed to process image')

      const processedBlob = await res.blob()
      setProcessedImage(URL.createObjectURL(processedBlob))
    } catch (error) {
      console.error('Error processing image:', error)
    }
  }, [originalImage, width, height, colors, dither, forceExactSize])

  const getCubeAlgorithms = useCallback(async () => {
    if (!processedImage) return
    setIsLoading(true)
    try {
      const response = await fetch(processedImage)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const result = await getCubesFor(uint8Array, colors)
      if (result.cubes) {
        setCubes(result.cubes)
      } else if (result.error) {
        console.error('Error getting cubes:', result.error)
      }
    } catch (error) {
      console.error('Error getting cubes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [processedImage, colors])

  const skipToCoordinates = () => {
    const x = parseInt(skipX)
    const y = parseInt(skipY)
    if (isNaN(x) || isNaN(y)) {
      alert('Please enter valid x and y coordinates')
      return
    }
    const index = cubes.findIndex(cube => cube.x === x && cube.y === y)
    if (index === -1) {
      alert('No cube found with the given coordinates')
      return
    }
    listRef.current?.scrollToItem(index, 'auto')
  }

  const faces = Object.keys(colors) as Array<keyof typeof colors>

  return (
    <div className="flex flex-col items-center justify-center pt-2 px-4 pb-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
        <h1 className="text-2xl font-bold">Rubiksify: painting with Rubik&apos;s Cubes!</h1>
        <hr className="w-full border-t border-gray-400 my-1" />
        {showHelp && (
          <div className="bg-gray-100 p-4 rounded-md mb-2 text-sm">
            Hold your cube in front of you (in the solved state). The color under U should be the color on the top of your cube, D should be the color on the bottom, L the color on the left, R on the right, F on the front, and B on the back. You should always be able to make this happen, either by rotating the cube or editing the colors (or both).
          </div>
        )}
        <div className="relative w-full">
          <div className="absolute top-0 right-0 p-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Toggle help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="rounded-lg p-4 w-full">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 w-full">
              {faces.map((face) => (
                <div key={face} className="flex flex-col items-center gap-2">
                  <Label htmlFor={`color-${face}`}>{face}</Label>
                  <Input
                    type="color"
                    id={`color-${face}`}
                    value={colors[face]}
                    onChange={(e) => handleColorChange(face, e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
          <hr className="w-full border-t border-gray-400 my-1" />
        </div>

        <div className="rounded-lg p-4 w-full space-y-4">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="flex flex-col gap-2">
              <Label htmlFor="width">Width (in cubes)</Label>
              <Input
                type="number"
                id="width"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={1}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="height">Height (in cubes)</Label>
              <Input
                type="number"
                id="height"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={1}
                className="w-full"
              />
            </div>
          </div>
          <ForceExactSizeToggle checked={forceExactSize} onCheckedChange={setForceExactSize} />
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="dither">Dither</Label>
            <Select value={dither} onValueChange={(value: DitherType) => setDither(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select dither type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Riemersma">Riemersma</SelectItem>
                <SelectItem value="FloydSteinberg">Floyd-Steinberg</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="fileUpload">Image to Rubiksify</Label>
            <Input
              id="fileUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full"
            />
          </div>
        </div>
        <hr className="w-full border-t border-gray-400 my-1" />

        <div className="rounded-lg p-4 w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full">
            <div className="flex flex-col items-center gap-2 w-full md:w-2/5">
              <Label>Original</Label>
              {originalImage && (
                <div className="w-full h-64 rounded-md overflow-hidden">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={processImage}
              disabled={!originalImage}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Rubiksify"
            >
              <ArrowRight className="w-8 h-8" />
            </Button>

            <div className="flex flex-col items-center gap-2 w-full md:w-2/5">
              <Label>Rubiksified</Label>
              {processedImage && (
                <div className="w-full h-64 rounded-md overflow-hidden">
                  <img
                    src={processedImage}
                    alt="Rubiksified"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <hr className="w-full border-t border-gray-400 my-1" />

        {processedImage && cubes.length === 0 && (
          <Button onClick={getCubeAlgorithms} className="mt-4" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Get cube algorithms'}
          </Button>
        )}

        {cubes.length > 0 && (
          <>
            <div className="flex items-end gap-4 w-full">
              <div className="flex-1">
                <Label htmlFor="skipX">X coordinate</Label>
                <Input
                  id="skipX"
                  type="number"
                  value={skipX}
                  onChange={(e) => setSkipX(e.target.value)}
                  min={0}
                  max={width - 1}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="skipY">Y coordinate</Label>
                <Input
                  id="skipY"
                  type="number"
                  value={skipY}
                  onChange={(e) => setSkipY(e.target.value)}
                  min={0}
                  max={height - 1}
                  className="w-full"
                />
              </div>
              <Button onClick={skipToCoordinates}>Skip to coordinates</Button>
            </div>
            <div className="rounded-lg border-gray-600 border-2 w-full">
              <div className="w-full h-[600px]">
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      ref={listRef}
                      height={height}
                      itemCount={cubes.length}
                      itemSize={325}
                      width={width}
                      itemData={{ cubes, colors }}
                    >
                      {RubiksCardListItem}
                    </List>
                  )}
                </AutoSizer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

