import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ForceExactSizeToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function ForceExactSizeToggle({ checked, onCheckedChange }: ForceExactSizeToggleProps) {
  return (
    <div className="flex flex-row-reverse justify-end items-center space-x-2 space-x-reverse w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild className="flex flex-row-reverse items-center space-x-2 space-x-reverse cursor-help">
            <div className="flex items-center gap-2 cursor-help">
              <Label htmlFor="force-exact-size" className="cursor-help order-2">Force exact size</Label>
              <Switch
                id="force-exact-size"
                checked={checked}
                onCheckedChange={onCheckedChange}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p>If disabled, the resulting image might be smaller than the specified dimensions to preserve aspect ratio. Extra pixels on the Rubik&apos;s cubes will be filled in with the color labelled D</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

