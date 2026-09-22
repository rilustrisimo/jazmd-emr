import { DOCUMENT_PAGE_SIZE, pageMarginCssValue, pageSizeCssValue } from '@/lib/print/page-size'

/**
 * Shared by both the browser-print route and the PDF renderer — this is
 * the ONE place document layout CSS lives, so the two outputs can never
 * visually drift apart. Reads DOCUMENT_PAGE_SIZE directly in millimeters,
 * same as lib/print/page-size.ts's own contract.
 */
export const documentStyles = `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #17181a;
    font-size: 11pt;
    line-height: 1.4;
  }
  @page {
    size: ${pageSizeCssValue};
    margin: 0;
  }
  .document {
    width: ${DOCUMENT_PAGE_SIZE.widthMm}mm;
    min-height: ${DOCUMENT_PAGE_SIZE.heightMm}mm;
    padding: ${pageMarginCssValue};
    position: relative;
  }
  .voided-stamp {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-20deg);
    font-size: 36pt;
    font-weight: 700;
    color: rgba(220, 38, 38, 0.35);
    border: 4pt solid rgba(220, 38, 38, 0.35);
    padding: 4pt 16pt;
    letter-spacing: 4pt;
    pointer-events: none;
  }
  .letterhead {
    text-align: center;
    border-bottom: 1pt solid #242424;
    padding-bottom: 6pt;
    margin-bottom: 10pt;
  }
  .letterhead .name {
    font-size: 14pt;
    font-weight: 700;
    margin: 0;
  }
  .letterhead .credentials {
    font-size: 9pt;
    margin: 1pt 0;
  }
  .letterhead .clinic {
    font-size: 8pt;
    color: #484848;
    margin: 1pt 0;
  }
  .letterhead .license {
    font-size: 8pt;
    color: #484848;
    margin: 2pt 0 0;
  }
  .patient-info {
    display: flex;
    justify-content: space-between;
    font-size: 9pt;
    margin-bottom: 10pt;
  }
  .patient-info .label {
    color: #484848;
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
  }
  .content-label {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    color: #484848;
    margin-bottom: 4pt;
  }
  .rx-symbol {
    font-size: 20pt;
    font-weight: 700;
    margin-bottom: 4pt;
  }
  .content-body {
    white-space: pre-wrap;
    font-size: 10.5pt;
    min-height: 60mm;
  }
  .field-row {
    display: flex;
    gap: 12pt;
    font-size: 9.5pt;
    margin-bottom: 4pt;
  }
  .field-row .label {
    color: #484848;
    min-width: 30mm;
  }
  .signature-block {
    margin-top: 20pt;
    text-align: right;
  }
  .signature-block img {
    max-height: 18mm;
    max-width: 50mm;
  }
  .signature-block .signed-name {
    font-size: 9.5pt;
    font-weight: 700;
    border-top: 1pt solid #242424;
    padding-top: 2pt;
    margin-top: 2pt;
    display: inline-block;
    min-width: 50mm;
  }
  .signature-block .signed-license {
    font-size: 8pt;
    color: #484848;
  }
`
