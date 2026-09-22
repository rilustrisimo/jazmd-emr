'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SignaturePad } from '@/components/signature/SignaturePad'
import type { ActiveSignature } from '@/lib/signatures/get-signature'

export function SignatureCapture({ activeSignature }: { activeSignature: ActiveSignature | null }) {
  const router = useRouter()
  const [isCapturing, setIsCapturing] = useState(!activeSignature)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave(blob: Blob, width: number, height: number) {
    setIsSaving(true)
    const formData = new FormData()
    formData.append('file', blob, 'signature.png')
    formData.append('widthPx', String(width))
    formData.append('heightPx', String(height))

    const response = await fetch('/api/signatures', { method: 'POST', body: formData })
    setIsSaving(false)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to save signature')
      return
    }

    toast.success('Signature saved')
    setIsCapturing(false)
    router.refresh()
  }

  if (!isCapturing && activeSignature) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center rounded-xl border border-border bg-white p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeSignature.signed_url ?? undefined}
            alt="Your signature"
            className="max-h-32"
            style={{ aspectRatio: `${activeSignature.width_px} / ${activeSignature.height_px}` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Captured {new Date(activeSignature.created_at).toLocaleDateString()}. Documents you&apos;ve already issued
          keep this exact signature even if you replace it.
        </p>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsCapturing(true)}>
          <PenLine className="size-4" />
          Replace signature
        </Button>
      </div>
    )
  }

  return <SignaturePad onSave={handleSave} isSaving={isSaving} />
}
