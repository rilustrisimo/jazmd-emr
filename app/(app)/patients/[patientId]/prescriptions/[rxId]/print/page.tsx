import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { getPrescriptionPrintData } from '@/lib/documents/get-print-data'
import { renderPrescriptionBodyHtml } from '@/lib/print/render-document-html'
import { documentStyles } from '@/lib/print/document-styles'

export default async function PrescriptionPrintPage({
  params,
}: {
  params: Promise<{ patientId: string; rxId: string }>
}) {
  await requireUser()
  const { rxId } = await params
  const data = await getPrescriptionPrintData(rxId)

  if (!data) notFound()

  const bodyHtml = renderPrescriptionBodyHtml(data)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: documentStyles }} />
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  )
}
