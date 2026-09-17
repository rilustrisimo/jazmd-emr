'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Camera, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PatientPhotoUpload({ patientId, signedUrl }: { patientId: string; signedUrl: string | null }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/patients/${patientId}/photo`, { method: 'POST', body: formData })
    setIsUploading(false)
    event.target.value = ''

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to upload photo')
      return
    }

    toast.success('Photo updated')
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-secondary">
        {signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signedUrl} alt="Patient photo" className="size-full object-cover" />
        ) : (
          <User className="size-10 text-muted-foreground" />
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileChange} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="size-4" />
        {isUploading ? 'Uploading…' : signedUrl ? 'Change photo' : 'Add photo'}
      </Button>
    </div>
  )
}
