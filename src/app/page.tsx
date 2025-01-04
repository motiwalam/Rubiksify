'use client'

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, HelpCircle } from 'lucide-react'
import { hexToRgb } from '../lib/colorUtils'
import { Colors, CubeInfo, getCubesFor, exportAllCubes } from '../lib/getCubesFor'
import RubiksCardListItem from '../components/RubiksCardListItem'
import { ForceExactSizeToggle } from '../components/ForceExactSizeToggle'
import { MissingImageIcon } from '../components/MissingImageIcon'
import './styles/pulse.css'
import { useSearchParams } from 'next/navigation'
import { ExportPopup } from '../components/ExportPopup'
import { SharePopup } from '../components/SharePopup'

type DitherType = 'None' | 'Riemersma' | 'FloydSteinberg'

function SearchParamsWrapper({ children }: { children: (searchParams: URLSearchParams) => React.ReactNode }) {
  const searchParams = useSearchParams()
  return <>{children(searchParams)}</>
}

function PageContent({ searchParams }: { searchParams: URLSearchParams }) {
  const [colors, setColors] = useState(() => {
    const defaultColors = {
      U: '#FFFF00', D: '#FFFFFF', L: '#FFA500', R: '#FF0000', F: '#0000FF', B: '#00FF00'
    }
    return Object.fromEntries(
      Object.entries(defaultColors).map(([key, defaultValue]) => [
        key,
        searchParams.get(key) || defaultValue
      ])
    )
  })

  const [width, setWidth] = useState(() => parseInt(searchParams.get('width') || '10'))
  const [height, setHeight] = useState(() => parseInt(searchParams.get('height') || '10'))
  const [dither, setDither] = useState<DitherType>(() => 
    (searchParams.get('dither') as DitherType) || 'FloydSteinberg'
  )
  const [forceExactSize, setForceExactSize] = useState(() => 
    searchParams.get('forceExactSize') === 'true'
  )
  const [originalImage, setOriginalImage] = useState<string | null>(() => 
    searchParams.get('originalImage')
  )

  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [cubes, setCubes] = useState<CubeInfo[]>([])
  const [skipX, setSkipX] = useState('')
  const [skipY, setSkipY] = useState('')
  const [isLoading, setIsLoading] = useState(false) // Added loading state
  const [showHelp, setShowHelp] = useState(false)
  const [lastProcessedConfig, setLastProcessedConfig] = useState<null | {
    colors: typeof colors;
    width: number;
    height: number;
    dither: DitherType;
    forceExactSize: boolean;
    originalImage: string | null;
  }>(null);
  const listRef = useRef<List>(null)
  const [cubesW, cubesH] = useMemo<[number,number]>(() => {
    if (cubes.length === 0)
      return [-1, -1]
    const {x,y} = cubes[cubes.length-1]
    return [x+1, y+1]
  }, [cubes])

  const [isExporting, setIsExporting] = useState(false)
  const [exportedData, setExportedData] = useState<string | null>(null)
  const [isExportPopupOpen, setIsExportPopupOpen] = useState(false)
  const [numExported, setNumExported] = useState(0);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false)
  const [sharedUrl, setSharedUrl] = useState<string | null>(null)

  useEffect(() => {
    setCubes([]);
    setProcessedImage(null)
  }, [originalImage]);

  useEffect(() => {
    setCubes([]);
  }, [processedImage]);

  useEffect(() => {
    const autoProcess = async () => {
      if (originalImage) {
        const blob = await processImage()
        await getCubeAlgorithms(blob)
      }
    }
    autoProcess()
  }, [])

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
  
  const scrollToBottom = useCallback(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  }, [])

  const processImage = useCallback(async () => {
    if (!originalImage) return

    const response = await fetch(originalImage)
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    const colorString = `${dither};${3*width}x${3*height}${forceExactSize ? '!' : ''};${Object.values(colors).map(hexToRgb).join(';')}`
    const url = `https://www.cs.toronto.edu/~motiwala/rubiksify.cgi?${encodeURIComponent(colorString)}`
    
    let processedBlob;
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: uint8Array,
      })

      if (!res.ok) throw new Error('Failed to process image')

      processedBlob = await res.blob()
      setProcessedImage(URL.createObjectURL(processedBlob))
    } catch (error) {
      console.error('Error processing image:', error)
      return;
    }

    setLastProcessedConfig({
      colors,
      width,
      height,
      dither,
      forceExactSize,
      originalImage,
    });
    return processedBlob
  }, [originalImage, width, height, colors, dither, forceExactSize])

  useEffect(() => {
    setSharedUrl(null)
  }, [originalImage, width, height, colors, dither, forceExactSize])

  const getCubeAlgorithms = useCallback(async (processedBlob?: Blob) => {
    if (!processedImage && !processedBlob) return
    setIsLoading(true)
    try {
      let uint8Array: Uint8Array
      if (processedBlob) {
        const arrayBuffer = await processedBlob.arrayBuffer()
        uint8Array = new Uint8Array(arrayBuffer)
      } else {
        const response = await fetch(processedImage!)
        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        uint8Array = new Uint8Array(arrayBuffer)
      }

      const result = await getCubesFor(uint8Array, colors as Colors)
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

  const hasConfigChanged = () => {
    if (!lastProcessedConfig) return true;
    return (
      JSON.stringify(colors) !== JSON.stringify(lastProcessedConfig.colors) ||
      width !== lastProcessedConfig.width ||
      height !== lastProcessedConfig.height ||
      dither !== lastProcessedConfig.dither ||
      forceExactSize !== lastProcessedConfig.forceExactSize ||
      originalImage !== lastProcessedConfig.originalImage
    );
  };

  const faces = Object.keys(colors) as Array<keyof typeof colors>

  useEffect(() => {
    if (processedImage) {
      scrollToBottom();
    }
  }, [processedImage, scrollToBottom]);

  useEffect(() => {
    if (cubes.length > 0) {
      scrollToBottom();
    }
  }, [cubes, scrollToBottom]);

  const handleExport = async () => {
    setIsExporting(true)
    setNumExported(0)

    try {
      const exportedCubes = await exportAllCubes(cubes, colors, () => {
        setNumExported(x => x + 1)
      })
      setExportedData(JSON.stringify(exportedCubes, null, 2))
      setIsExportPopupOpen(true)
    } catch (error) {
      console.error('Error exporting cubes:', error)
      // You might want to show an error message to the user here
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = (imageUrl: string) => {
    const params = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      dither,
      originalImage: imageUrl,
      forceExactSize: forceExactSize.toString(),
      ...colors
    })
    const newUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    setSharedUrl(newUrl)
    // setIsSharePopupOpen(false)
  }

  return (
    <div className="flex flex-col items-center justify-center pt-2 px-4 pb-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
        <h1 className="text-2xl font-bold">Rubiksify: painting with Rubik&apos;s Cubes!</h1>
        <hr className="w-full border-t border-gray-400 mt-1" />
        {showHelp && (
          <div className="bg-gray-100 p-4 rounded-md mb-2 text-sm">
            Hold your cube in front of you (in the solved state). The color under U should be the color on the top of your cube, D should be the color on the bottom, L the color on the left, R on the right, F on the front, and B on the back. You should always be able to make this happen, either by rotating the cube or editing the colors (or both).
          </div>
        )}
        <div className="relative w-full">
          <div className="absolute top-0 right-0">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Toggle help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="rounded-lg p-1 w-full">
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
          <hr className="w-full border-t border-gray-400 mt-2" />
        </div>

        <div className="rounded-lg p-1 w-full space-y-4">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="flex flex-col gap-2">
              <Label htmlFor="width">Width (in cubes)</Label>
              <Input
                type="number"
                id="width"
                value={width}
                onChange={(e) => {
                  const value = Math.max(1, parseInt(e.target.value) || 1);
                  setWidth(value);
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setWidth(value);
                  }
                }}
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
                onChange={(e) => {
                  const value = Math.max(1, parseInt(e.target.value) || 1);
                  setHeight(value);
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setHeight(value);
                  }
                }}
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
        </div>
        <hr className="w-full border-t border-gray-400 mt-1" />

        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,2fr] gap-4 items-center w-full">
          <div className="flex flex-col items-center gap-2 w-full">
            <Label>Original</Label>
            <div className="w-full h-64 rounded-md overflow-hidden">
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <MissingImageIcon />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Input
                id="fileUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-center items-center">
            <Button
              onClick={processImage}
              disabled={!originalImage}
              className={`flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 ${
                originalImage && hasConfigChanged() ? 'pulse' : ''
              }`}
              aria-label="Rubiksify"
            >
              <ArrowRight className="w-8 h-8" />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-2 w-full">
            <Label>Rubiksified</Label>
            <div className="w-full h-64 rounded-md overflow-hidden">
              {processedImage ? (
                <img
                  src={processedImage}
                  alt="Rubiksified"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <MissingImageIcon />
                </div>
              )}
            </div>
            {/* Add this div to match the height of the file input */}
            <div className="h-[38px]" /> {/* 38px is the default height of the input */}
          </div>
        </div>
        {processedImage && (
          <hr className="w-full border-t border-gray-400 mt-1" />
        )}

        {processedImage && cubes.length === 0 && (
          <Button onClick={() => getCubeAlgorithms()} className="" disabled={isLoading}>
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
              <Button onClick={skipToCoordinates}>Jump to coordinates</Button>
            </div>
            <div className="w-full text-left">
              Total of <span className="font-bold">{cubes.length}</span> cube{cubes.length !== 1 ? 's' : ''} needed. Final image is <span className="">{cubesW}</span>x<span className="">{cubesH}</span> in cubes and <span className="">{3*cubesW}</span>x<span className="">{3*cubesH}</span> in pixels.
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
            <div className="w-full flex justify-between items-center">
              <Button onClick={handleExport} disabled={isExporting || cubes.length === 0} className="w-40">
                {isExporting ? `${numExported}/${cubes.length}` : 'Export'}
              </Button>
              <Button onClick={() => setIsSharePopupOpen(true)} className="w-40">
                Share
              </Button>
            </div>
            {exportedData && (<ExportPopup
              isOpen={isExportPopupOpen}
              onClose={() => setIsExportPopupOpen(false)}
              jsonData={exportedData}
            />
            )}
            <SharePopup
              isOpen={isSharePopupOpen}
              onClose={() => setIsSharePopupOpen(false)}
              onShare={handleShare}
              originalImage={originalImage}
              shareUrl={sharedUrl}
            />
            {sharedUrl && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <p className="font-semibold">Shareable URL:</p>
                <p className="break-all">{sharedUrl}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsWrapper>
        {(searchParams) => <PageContent searchParams={searchParams} />}
      </SearchParamsWrapper>
    </Suspense>
  )
}

