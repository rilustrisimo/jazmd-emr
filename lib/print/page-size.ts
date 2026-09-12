/**
 * The ONLY place a physical page dimension is defined. Both the browser
 * print stylesheet (@media print { @page { size: ... } }) and the
 * server-side PDF renderer (Puppeteer's page.pdf({ width, height })) read
 * these same millimeter values directly — never convert to px/DPI anywhere,
 * that conversion step is the most common source of print/PDF drift.
 *
 * TODO before launch: physically measure the clinic's actual Rx pad with a
 * ruler and adjust these three numbers if needed. Placeholder below is
 * standard US Half-Letter, the common size for PH prescription pads.
 */
export const DOCUMENT_PAGE_SIZE = {
  widthMm: 139.7,
  heightMm: 215.9,
  marginMm: 6,
} as const

export const pageSizeCssValue = `${DOCUMENT_PAGE_SIZE.widthMm}mm ${DOCUMENT_PAGE_SIZE.heightMm}mm`
export const pageMarginCssValue = `${DOCUMENT_PAGE_SIZE.marginMm}mm`
