'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { solveCube } from '../lib/solveCube'
import * as CubeDefnUtil from '../lib/cubeDefnUtil'
import CubeNet from './CubeNet'

interface RubiksCardProps {
  x: number
  y: number
  cubeDefn: string
  orientation: { [key: string]: string }
  colors: { [key: string]: string }
}

export default function RubiksCard({ x, y, cubeDefn, orientation, colors }: RubiksCardProps) {
  const [moves, setMoves] = useState<string | null>(null)
  const [showFullNet, setShowFullNet] = useState(false)
  const [isFrontTopTooltipOpen, setIsFrontTopTooltipOpen] = useState(false)
  const [isCoordinatesTooltipOpen, setIsCoordinatesTooltipOpen] = useState(false)
  const [isMovesTooltipOpen, setIsMovesTooltipOpen] = useState(false)
  
  const {movesLength, cubeDefnColored, solvedCubeDefn} = useMemo(() => {
    const movesLength = (moves !== null) && `(${moves.split(' ').filter(Boolean).length})`
    const cubeDefnColored = CubeDefnUtil.colorizeCubeDefn(cubeDefn, orientation)
    const solvedCubeDefn = CubeDefnUtil.colorizeCubeDefn(CubeDefnUtil.solvedCubeDefn, orientation)
    
    return {movesLength, cubeDefnColored, solvedCubeDefn}
    
  }, [moves, cubeDefn, orientation]) 
  
  const frontColor = CubeDefnUtil.colorAt(cubeDefnColored, 'F', 4)
  const topColor = CubeDefnUtil.colorAt(cubeDefnColored, 'U', 4)

  useEffect(() => {
    const fetchMoves = async () => {
      const result = await solveCube(cubeDefn)
      setMoves(typeof result === 'string' ? result : 'Error solving cube')
    }
    fetchMoves()
  }, [cubeDefn])

  return (
    <Card className="m-2">
      <CardHeader className="flex flex-row justify-between items-start">
        <TooltipProvider>
          <Tooltip open={isFrontTopTooltipOpen} onOpenChange={setIsFrontTopTooltipOpen}>
            <TooltipTrigger asChild onClick={() => setIsFrontTopTooltipOpen(!isFrontTopTooltipOpen)}>
              <div className="space-y-1 cursor-pointer" >
                <div className="flex items-center gap-2">
                  <span className="border-b border-dotted border-gray-500">Front</span>:
                  <div 
                    className="w-4 h-4 border border-black" 
                    style={{ backgroundColor: colors[frontColor] }}
                  ></div>
                  <span>{frontColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="border-b border-dotted border-gray-500">Top</span>:
                  <div 
                    className="w-4 h-4 border border-black" 
                    style={{ backgroundColor: colors[topColor] }}
                  ></div>
                  <span>{topColor}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="w-64 mb-2">
              <p>Rotate the cube so that the color labeled {frontColor} is facing you and the color labelled {topColor} is on the top. The cube should look like this:</p>
              <div className="mt-2">
                <CubeNet cubeDefn={solvedCubeDefn} colors={colors} renderFace={'F'} showFullNet={true} />
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip open={isCoordinatesTooltipOpen} onOpenChange={setIsCoordinatesTooltipOpen}>
            <TooltipTrigger asChild onClick={() => setIsCoordinatesTooltipOpen(!isCoordinatesTooltipOpen)}>
              <div className="text text-muted-foreground cursor-pointer">
                <span className="border-b border-dotted border-gray-500">({x}, {y})</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" align="end">
              This cube should be placed with {x} cube{x !== 1 ? 's' : ''} to the left of it and {y} cube{y !== 1 ? 's' : ''} above it.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <CubeNet cubeDefn={cubeDefnColored} colors={colors} renderFace={'F'} showFullNet={showFullNet} />
        </div>
        <div className="flex justify-center items-center space-x-2 mb-4">
          <Switch
            id={`show-full-net-${x}-${y}`}
            checked={showFullNet}
            onCheckedChange={setShowFullNet}
          />
          <Label htmlFor={`show-full-net-${x}-${y}`}>Show full cube net</Label>
        </div>
        <TooltipProvider>
          <Tooltip open={isMovesTooltipOpen} onOpenChange={setIsMovesTooltipOpen}>
            <TooltipTrigger asChild onClick={() => setIsMovesTooltipOpen(!isMovesTooltipOpen)}>
              <div className="text cursor-pointer">
                <span className="border-b border-dotted border-gray-500">Moves</span> {movesLength ?? ''}: {moves ?? 'Loading...'}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p>Perform this sequence of moves after orienting your solved cube as indicated above. The side facing you will be part of the Rubiksified image.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}

