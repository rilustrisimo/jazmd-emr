'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'

export function SignaturePad({
  onSave,
  isSaving,
}: {
  onSave: (blob: Blob, width: number, height: number) => void
  isSaving?: boolean
}) {
  const padRef = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  function handleClear() {
    padRef.current?.clear()
    setIsEmpty(true)
  }

  function handleSave() {
    const pad = padRef.current
    if (!pad || pad.isEmpty()) return
    const canvas = pad.getTrimmedCanvas()
    canvas.toBlob((blob) => {
      if (blob) onSave(blob, canvas.width, canvas.height)
    }, 'image/png')
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <SignatureCanvas
          ref={padRef}
          penColor="#242424"
          canvasProps={{ width: 500, height: 200, className: 'w-full touch-none' }}
          onBegin={() => setIsEmpty(false)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleClear}>
          Clear
        </Button>
        <Button type="button" size="sm" className="rounded-full" onClick={handleSave} disabled={isEmpty || isSaving}>
          {isSaving ? 'Saving…' : 'Save signature'}
        </Button>
      </div>
    </div>
  )
}
