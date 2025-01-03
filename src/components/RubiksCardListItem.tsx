import { CSSProperties } from 'react'
import RubiksCard from './RubiksCard'
import { CubeInfo } from '@/lib/getCubesFor'

interface RubiksCardListItemProps {
  index: number
  style: CSSProperties
  data: {
    cubes: CubeInfo[]
    colors: { [key: string]: string }
  }
}

export default function RubiksCardListItem({ index, style, data }: RubiksCardListItemProps) {
  const { cubes, colors } = data
  const cube = cubes[index]

  return (
    <div style={style}>
      <RubiksCard
        key={index}
        x={cube.x}
        y={cube.y}
        cubeDefn={cube.cubeDefn}
        orientation={cube.orientation}
        colors={colors}
      />
    </div>
  )
}

