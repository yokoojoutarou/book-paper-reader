// ============================
// PDFViewer — pdf.js canvas renderer with text layer
// ============================
import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useLibraryStore } from '../../stores/libraryStore';
import { useAnnotationStore } from '../../stores/annotationStore';
import AnnotationLayer from './AnnotationLayer';
import ContextMenu from './ContextMenu';
import styles from './PDFViewer.module.css';

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

export default function PDFViewer() {
    const containerRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.3);
    const [pageRendering, setPageRendering] = useState(false);
    const [selection, setSelection] = useState(null); // { text, rects, x, y }
    const canvasRefs = useRef({});
    const textLayerRefs = useRef({});

    const { currentPdf, currentAnnotations } = useLibraryStore();
    const { loadAnnotations } = useAnnotationStore();

    // Load PDF when data changes
    useEffect(() => {
        if (!currentPdf?.arrayBuffer) return;

        const loadPdf = async () => {
            const data = new Uint8Array(currentPdf.arrayBuffer);
            const doc = await pdfjsLib.getDocument({ data }).promise;
            setPdfDoc(doc);
            setTotalPages(doc.numPages);
            setCurrentPage(1);
        };
        loadPdf();
    }, [currentPdf]);

    // Load annotations
    useEffect(() => {
        if (currentAnnotations?.data) {
            loadAnnotations(currentAnnotations.data);
        }
    }, [currentAnnotations]);

    // Render pages
    useEffect(() => {
        if (!pdfDoc || !containerRef.current) return;
        renderAllVisiblePages();
    }, [pdfDoc, scale]);

    async function renderPage(pageNum) {
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Canvas
        const canvas = canvasRefs.current[pageNum];
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Text layer
        const textLayerDiv = textLayerRefs.current[pageNum];
        if (textLayerDiv) {
            textLayerDiv.innerHTML = '';
            textLayerDiv.style.width = `${viewport.width}px`;
            textLayerDiv.style.height = `${viewport.height}px`;

            const textContent = await page.getTextContent();
            pdfjsLib.renderTextLayer({
                textContentSource: textContent,
                container: textLayerDiv,
                viewport,
                textDivs: [],
            });
        }
    }

    async function renderAllVisiblePages() {
        if (!pdfDoc) return;
        setPageRendering(true);
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            await renderPage(i);
        }
        setPageRendering(false);
    }

    // Handle text selection
    const handleMouseUp = useCallback(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (!text) {
            setSelection(null);
            return;
        }

        // Get selection rects relative to the container
        const range = sel.getRangeAt(0);
        const rects = Array.from(range.getClientRects());
        const containerRect = containerRef.current.getBoundingClientRect();

        const mappedRects = rects.map(r => ({
            x: r.left - containerRect.left + containerRef.current.scrollLeft,
            y: r.top - containerRect.top + containerRef.current.scrollTop,
            w: r.width,
            h: r.height,
        }));

        // Find which page the selection is on
        let pageNum = 1;
        const pageElements = containerRef.current.querySelectorAll('[data-page]');
        for (const el of pageElements) {
            const elRect = el.getBoundingClientRect();
            if (rects[0] && rects[0].top >= elRect.top && rects[0].top <= elRect.bottom) {
                pageNum = parseInt(el.getAttribute('data-page'));
                break;
            }
        }

        // Position context menu near the end of selection
        const lastRect = rects[rects.length - 1];
        setSelection({
            text,
            rects: mappedRects,
            page: pageNum,
            menuX: lastRect ? lastRect.right - containerRect.left + containerRef.current.scrollLeft : 0,
            menuY: lastRect ? lastRect.bottom - containerRect.top + containerRef.current.scrollTop + 8 : 0,
        });
    }, []);

    // Zoom controls
    const zoomIn = () => setScale(s => Math.min(s + 0.2, 3.0));
    const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));

    if (!currentPdf) {
        return (
            <div className={styles.empty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
                <p>Select a document from the sidebar to begin reading.</p>
            </div>
        );
    }

    return (
        <div className={styles.viewer}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    <span className={styles.pageInfo}>
                        {totalPages > 0 ? `${totalPages} pages` : ''}
                    </span>
                </div>
                <div className={styles.zoomControls}>
                    <button onClick={zoomOut} className={styles.zoomBtn} title="Zoom out">−</button>
                    <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
                    <button onClick={zoomIn} className={styles.zoomBtn} title="Zoom in">+</button>
                </div>
            </div>

            {/* PDF Pages */}
            <div
                ref={containerRef}
                className={styles.pagesContainer}
                onMouseUp={handleMouseUp}
            >
                {pdfDoc && Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <div key={pageNum} className={styles.page} data-page={pageNum}>
                        <canvas
                            ref={el => { canvasRefs.current[pageNum] = el; }}
                            className={styles.canvas}
                        />
                        <div
                            ref={el => { textLayerRefs.current[pageNum] = el; }}
                            className={`${styles.textLayer} textLayer`}
                        />
                        <AnnotationLayer pageNum={pageNum} scale={scale} />
                    </div>
                ))}

                {/* Context menu */}
                {selection && (
                    <ContextMenu
                        selection={selection}
                        onClose={() => setSelection(null)}
                    />
                )}
            </div>
        </div>
    );
}
