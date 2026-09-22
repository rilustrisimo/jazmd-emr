import { requireUser, AuthError } from '@/lib/auth/session'
import { getMedcertPrintData } from '@/lib/documents/get-print-data'
import { renderMedcertBodyHtml, wrapDocumentHtml } from '@/lib/print/render-document-html'
import { documentStyles } from '@/lib/print/document-styles'
import { renderPdf } from '@/lib/pdf/render'

export const runtime = 'nodejs'
export const maxDuration = 60

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const { id } = await params

    const data = await getMedcertPrintData(id)
    if (!data) {
      return Response.json({ error: 'Medical certificate not found' }, { status: 404 })
    }

    const html = wrapDocumentHtml(renderMedcertBodyHtml(data), documentStyles)
    const pdf = await renderPdf(html)

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="medcert-${id}.pdf"`,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/medcerts/[id]/pdf] Render error:', error)
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
