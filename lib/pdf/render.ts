import { DOCUMENT_PAGE_SIZE } from '@/lib/print/page-size'

/**
 * Two Chromium launch paths, chosen at runtime:
 *  - Vercel (process.env.VERCEL is set on every Vercel deployment,
 *    including preview): puppeteer-core + @sparticuz/chromium, the
 *    Lambda/Vercel-optimized binary this whole approach is built around.
 *  - Everywhere else (local dev, `next build && next start` on this
 *    machine): the full `puppeteer` package's own downloaded Chrome —
 *    a devDependency, never bundled into the production build, just a
 *    stand-in so this renders identically without needing the
 *    serverless-specific binary locally.
 */
async function launchBrowser() {
  if (process.env.VERCEL) {
    const [{ default: chromium }, { default: puppeteerCore }] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core'),
    ])
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  const { default: puppeteer } = await import('puppeteer')
  // Local dev on this machine runs x64 Node under Rosetta on Apple
  // Silicon, which makes Chrome's launch dramatically slower than normal
  // (arm64 Chrome binary translated through Rosetta) — the default 30s
  // timeout isn't enough here. Not a concern on Vercel (native x86_64
  // Linux) or on a real arm64 Node install.
  return puppeteer.launch({ headless: true, timeout: 120_000 })
}

export async function renderPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser()

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      width: `${DOCUMENT_PAGE_SIZE.widthMm}mm`,
      height: `${DOCUMENT_PAGE_SIZE.heightMm}mm`,
      printBackground: true,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
