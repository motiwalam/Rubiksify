import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ShareUrlWithCopy from './ShareUrlWithCopy'

interface SharePopupProps {
  isOpen: boolean
  onClose: () => void
  onShare: (imageUrl: string) => void
  originalImage: string | null
  shareUrl: string | null
}

export function SharePopup({ isOpen, onClose, onShare, originalImage, shareUrl }: SharePopupProps) {
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setImageUrl('')
    }
  }, [isOpen])

  const handleUpload = async () => {
    if (!originalImage) return

    setIsUploading(true)
    try {
      const response = await fetch(originalImage)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const uploadResponse = await fetch('https://www.cs.toronto.edu/~motiwala/upload.cgi', {
        method: 'POST',
        body: uint8Array,
      })

      if (!uploadResponse.ok) throw new Error('Failed to upload image')

      const uploadedUrl = await uploadResponse.text()
      setImageUrl(uploadedUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Configuration</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <p className="text-sm text-gray-500">
            A publicly available URL for the original image is required to share. You can upload your image to a third-party service or provide an existing URL.
          </p>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Button onClick={handleUpload} disabled={isUploading || !originalImage}>
              {isUploading ? 'Uploading...' : 'Upload to 3rd party'}
            </Button>
          </div>
          <Button
            onClick={() => {
              onShare(imageUrl)
              setGenerated(true)
              setTimeout(() => setGenerated(false), 500)
            }}
            disabled={!imageUrl}
            className="w-full"
          >
            {generated ? 'Generated!' : 'Generate link'}
          </Button>
          {shareUrl && ( 
            <ShareUrlWithCopy shareUrl={shareUrl} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

