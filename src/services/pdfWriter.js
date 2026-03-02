// ============================
// PDF Writer — pdf-lib annotation burn-in
// ============================
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const COLOR_RGB = {
    yellow: rgb(1, 0.92, 0.23),
    green: rgb(0.3, 0.69, 0.31),
    blue: rgb(0.13, 0.59, 0.95),
    pink: rgb(0.91, 0.12, 0.39),
    orange: rgb(1, 0.6, 0),
};

/**
 * Burn annotations into a PDF and return modified bytes
 * @param {ArrayBuffer} pdfBytes - original PDF
 * @param {Object} annotations - { highlights, textInsertions }
 * @returns {Promise<Uint8Array>} modified PDF bytes
 */
export async function burnAnnotations(pdfBytes, annotations) {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    // Draw highlights
    for (const h of annotations.highlights || []) {
        const page = pages[h.page - 1];
        if (!page) continue;
        const { height } = page.getSize();
        const color = COLOR_RGB[h.color] || COLOR_RGB.yellow;

        for (const rect of h.rects) {
            page.drawRectangle({
                x: rect.x,
                y: height - rect.y - rect.h,
                width: rect.w,
                height: rect.h,
                color,
                opacity: 0.3,
            });
        }
    }

    // Draw text insertions
    for (const t of annotations.textInsertions || []) {
        const page = pages[t.page - 1];
        if (!page) continue;
        const { height } = page.getSize();

        page.drawText(t.text, {
            x: t.x,
            y: height - t.y,
            size: t.fontSize || 10,
            font,
            color: rgb(0.86, 0.13, 0.13), // red
        });
    }

    return await pdfDoc.save();
}
