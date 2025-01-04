import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from 'react';
import { HelpCircle } from 'lucide-react'

interface ForceExactSizeToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function ForceExactSizeToggle({ checked, onCheckedChange }: ForceExactSizeToggleProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  return (
    <div className="flex flex-row-reverse justify-end items-center space-x-2 space-x-reverse w-full">
      <TooltipProvider>
        <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
          <TooltipTrigger asChild>
            <div className="flex items-center relative gap-2">
              <TooltipTrigger asChild>
                <HelpCircle 
                  className="w-4 h-4 absolute -left-5 top-1/2 transform -translate-y-1/2 cursor-help text-muted-foreground" 
                  onClick={() => setIsTooltipOpen(!isTooltipOpen)}
                />
              </TooltipTrigger>
              <Label 
                htmlFor="force-exact-size" 
                className="cursor-pointer"
                onClick={() => setIsTooltipOpen(!isTooltipOpen)}
              >
                Force exact size
              </Label>
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

