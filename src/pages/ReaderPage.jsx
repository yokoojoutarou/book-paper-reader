// ============================
// ReaderPage — main layout with sidebar + PDF viewer
// ============================
import { useState, useCallback, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { saveFile, saveBinaryFile } from '../services/github';
import { burnAnnotations } from '../services/pdfWriter';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import PDFViewer from '../components/PDFViewer/PDFViewer';
import styles from './ReaderPage.module.css';

export default function ReaderPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { repoOwner, repoName } = useSettingsStore();
    const {
        currentBook, currentPdf, currentAnnotations,
        setSaveStatus, updateAnnotationsSha, updatePdfSha,
    } = useLibraryStore();
    const annotationStore = useAnnotationStore();

    // Save all (annotations JSON + optionally burn into PDF)
    const handleSave = useCallback(async () => {
        if (!currentBook || !currentPdf) return;

        setSaveStatus('saving');
        try {
            // 1. Save annotations.json
            const annotationsData = annotationStore.toJSON();
            const annResult = await saveFile(
                repoOwner, repoName,
                `${currentBook.path}/annotations.json`,
                JSON.stringify(annotationsData, null, 2),
                `Update annotations: ${currentBook.name}`,
                currentAnnotations?.sha,
            );
            updateAnnotationsSha(annResult.content.sha);

            // 2. Burn annotations into PDF and save
            const modifiedPdf = await burnAnnotations(currentPdf.arrayBuffer, annotationsData);
            const pdfResult = await saveBinaryFile(
                repoOwner, repoName,
                `${currentBook.path}/document.pdf`,
                modifiedPdf,
                `Update PDF with annotations: ${currentBook.name}`,
                currentPdf.sha,
            );
            updatePdfSha(pdfResult.content.sha);

            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('Save failed:', err);
            setSaveStatus('error');
        }
    }, [currentBook, currentPdf, currentAnnotations, annotationStore, repoOwner, repoName]);

    // Ctrl+S to save
    useEffect(() => {
        function onKeyDown(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleSave]);

    return (
        <div className={styles.layout}>
            <Header
                onToggleSidebar={() => setSidebarOpen(o => !o)}
                sidebarOpen={sidebarOpen}
            />
            <div className={styles.body}>
                <Sidebar open={sidebarOpen} />
                <main className={styles.main}>
                    <PDFViewer />
                </main>
            </div>
        </div>
    );
}
