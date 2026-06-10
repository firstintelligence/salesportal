## What I found

- **Preview font today:** the invoice preview does not explicitly set a font in the invoice template itself. It inherits the browser/default app font. In this project that effectively means the browser sans-serif stack unless a parent sets something else.
- **Generated PDF font today:** the export code tries to force `Helvetica, Helvetica Neue, Open Sans, Arial, sans-serif`, but the order is wrong for reliability because PDFShift may choose different available fonts than the browser preview.
- **Why text is still not highlightable:** when the PDFShift backend call fails, the code still has a legacy fallback using `html2canvas`. That fallback renders the invoice as one big image, so the letters cannot be highlighted individually.
- **Helvetica limitation:** true Helvetica is not reliably available in the PDFShift Chromium environment, and embedding random web-hosted Helvetica/Helvetica Neue fonts can produce PDFs without proper Unicode text maps. That makes text look correct but not selectable/copyable. Helvetica can be used safely only if we embed/control a proper licensed font file with valid text mapping, or if the PDF engine uses the built-in PDF Helvetica for text it draws itself. The HTML-to-PDF route cannot guarantee true Helvetica unless we control the font file.

## Recommendation

Use **Open Sans** as the single controlled font for both preview and generated PDF right now. It is close enough for professional invoices, can be loaded consistently in the browser and PDFShift, and preserves selectable text when the PDF is generated from HTML text instead of a canvas image.

If you still want true Helvetica later, the clean path is to provide a licensed Helvetica `.ttf/.otf` file and we embed that exact file in both preview/export. Without that file, I should not claim the downloaded PDF is truly Helvetica.

## Implementation plan

1. **Create one invoice font source of truth**
   - Add a shared invoice font stack constant, likely:
     - `"Open Sans", Arial, sans-serif`
   - Stop using mixed stacks like `Helvetica, "Helvetica Neue", "Open Sans", Arial` because that lets preview and export choose different fonts.

2. **Force the preview invoice to use the same font**
   - Apply the shared invoice font stack at the invoice render root/template root.
   - Update the Consumer Protection Act page and invoice render route so they use the same stack.
   - Keep app UI fonts separate unless they affect the invoice preview.

3. **Force the exported HTML to use the same font**
   - Generate the PDF HTML with the exact same stack: `"Open Sans", Arial, sans-serif`.
   - Load Open Sans from Google Fonts in the export HTML.
   - Add `document.fonts.ready` / font-load readiness script inside the exported HTML if PDFShift supports waiting for a JS condition; otherwise use delay only as a secondary safety net.

4. **Remove the image-based invoice fallback from the invoice export path**
   - Do not call `generatePDFClientSide()` for invoice downloads if text selectability is required.
   - If the backend PDF generation fails, show a clear error and do not download a rasterized PDF.
   - This prevents the user from ever receiving an unhighlightable image PDF while thinking it succeeded.

5. **Keep images as images, keep text as text**
   - Logos/signatures can remain images.
   - Invoice body, product lines, prices, terms, page numbers, and CPA field text must remain real PDF text.

6. **Fix the backend PDFShift request safely**
   - Use only PDFShift-supported wait options; do not reuse `networkidle0` if PDFShift rejects it.
   - Keep PDFShift as the primary generator because it converts HTML text into selectable PDF text when it succeeds.

7. **Verification before calling it fixed**
   - Generate a test PDF through the deployed edge function.
   - Run `pdftotext` against the PDF and confirm invoice text extracts correctly.
   - Confirm the generated PDF does **not** come from `html2canvas`.
   - Confirm preview/export font declarations match exactly.
   - Optionally inspect the generated PDF font names if the tooling exposes them.

## Expected result

- The preview invoice and downloaded invoice use the same visible font.
- The downloaded invoice text is highlightable/selectable piece by piece.
- If PDF generation fails, the app will not silently download an image-based PDF.
- We will not claim Helvetica unless we have a reliable Helvetica font source to embed.