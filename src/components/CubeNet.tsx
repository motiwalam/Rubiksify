import React from 'react'

import { extractFace } from '../lib/cubeDefnUtil'

interface CubeNetProps {
  cubeDefn: string
  colors: { [key: string]: string }
  renderFace: string
  showFullNet: boolean
}

const Face: React.FC<{ faceData: string; colors: { [key: string]: string }, small?: boolean }> = ({ faceData, colors, small }) => {
  const wh = small ? 9 : 27;
  const whf = small ? 3 : 9;
  return (
    <div className={`grid grid-cols-3 w-${wh} h-${wh}`}>
      {faceData.split('').map((cell, index) => (
        <div
          key={index}
          className={`w-${whf} h-${whf} border border-black`}
          style={{ backgroundColor: colors[cell] }}
        />
      ))}
    </div>
  )
}

export default function CubeNet({ cubeDefn, colors, renderFace, showFullNet }: CubeNetProps) {
  if (!showFullNet) {
    return (
      <div className="flex justify-center">
        <Face faceData={extractFace(cubeDefn, renderFace)} colors={colors}/>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-4 gap-1 w-[10rem]">
        <div className="col-start-2 col-span-1">
          <Face faceData={extractFace(cubeDefn, 'U')} colors={colors} small />
        </div>
        <div className="col-start-1 col-span-1">
          <Face faceData={extractFace(cubeDefn, 'L')} colors={colors} small />
        </div>
        <div className="col-start-2 col-span-1">
          <Face faceData={extractFace(cubeDefn, 'F')} colors={colors} small />
        </div>
        <div className="col-start-3 col-span-1">
          <Face faceData={extractFace(cubeDefn, 'R')} colors={colors} small />
        </div>
        <div className="col-start-4 col-span-1">
          <Face faceData={extractFace(cubeDefn, 'B')} colors={colors} small />
        </div>
        <div className="col-start-2 col-span-1">
          <Face faceData={extractFace(cubeDefn, 'D')} colors={colors} small />
        </div>
      </div>
    </div>
  )
}

