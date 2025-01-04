import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ExportPopupProps {
  isOpen: boolean
  onClose: () => void
  jsonData: string
}

export function ExportPopup({ isOpen, onClose, jsonData }: ExportPopupProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const copyToClipboard = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select()
      navigator.clipboard.writeText(textAreaRef.current.value).then(() => {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      }).catch(() => {
        setCopySuccess(false)
      })
    }
  }

  const downloadJson = () => {
    const element = document.createElement('a')
    const file = new Blob([jsonData], { type: 'application/json' })
    element.href = URL.createObjectURL(file)
    element.download = 'export.json'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Exported Data</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <textarea
            ref={textAreaRef}
            className="w-full h-64 p-2 border rounded-md font-mono text-sm"
            value={jsonData}
            readOnly
          />
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button onClick={copyToClipboard}>
            {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
          <Button onClick={downloadJson}>Download JSON</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

