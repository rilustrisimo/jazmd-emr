import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { getMedcertPrintData } from '@/lib/documents/get-print-data'
import { renderMedcertBodyHtml } from '@/lib/print/render-document-html'
import { documentStyles } from '@/lib/print/document-styles'

export default async function MedcertPrintPage({
  params,
}: {
  params: Promise<{ patientId: string; mcId: string }>
}) {
  await requireUser()
  const { mcId } = await params
  const data = await getMedcertPrintData(mcId)

  if (!data) notFound()

  const bodyHtml = renderMedcertBodyHtml(data)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: documentStyles }} />
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  )
}
