import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeContext';
import axiosInstance from '../api/axiosInstance';

interface PDFViewerProps {
  documentId: string | null;
  highlightedChunk?: {
    documentId: string;
    chunkIndex: number;
  } | null;
}

export function PDFViewer({
  documentId,
  highlightedChunk,
}: PDFViewerProps) {
  const { theme } = useTheme();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!documentId) {
      // Cleanup previous blob URL if exists
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Cleanup previous blob URL before loading new one
    let previousBlobUrl: string | null = null;
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      previousBlobUrl = pdfUrl;
    }

    // Fetch PDF URL from backend endpoint
    const fetchPdfUrl = async () => {
      try {
        const baseUrl = axiosInstance.defaults.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          throw new Error('Unauthorized - Please log in again');
        }

        // Use the backend endpoint to serve the file
        // We'll use a blob URL approach to handle authentication
        const apiUrl = `${baseUrl}/documents/${documentId}/file`;
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          throw new Error('Unauthorized - Please log in again');
        }

        if (response.status === 404) {
          throw new Error('Document not found');
        }

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Revoke previous blob URL
        if (previousBlobUrl) {
          URL.revokeObjectURL(previousBlobUrl);
        }
        
        setPdfUrl(blobUrl);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF document';
        setError(errorMessage);
        setIsLoading(false);
        
        // Revoke previous blob URL on error
        if (previousBlobUrl) {
          URL.revokeObjectURL(previousBlobUrl);
        }
      }
    };

    fetchPdfUrl();

    // Cleanup blob URL on unmount or document change
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  useEffect(() => {
    if (highlightedChunk && containerRef.current) {
      // Scroll to highlighted chunk (simplified - would need actual PDF page calculation)
      const chunkElement = containerRef.current.querySelector(
        `[data-chunk-index="${highlightedChunk.chunkIndex}"]`
      );
      if (chunkElement) {
        chunkElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedChunk]);

  const styles = getStyles(theme);

  if (!documentId) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>
          Select a document to view PDF
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>PDF not available</div>
      </div>
    );
  }

  return (
    <div style={styles.container} ref={containerRef}>
      <iframe
        src={pdfUrl}
        style={styles.iframe}
        title="PDF Viewer"
      />
    </div>
  );
}

function getStyles(theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  return {
    container: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    },
    iframe: {
      width: '100%',
      height: '100%',
      border: 'none',
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      fontSize: '16px',
      color: isDark ? '#b0b0b0' : '#6c757d',
    },
    error: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      fontSize: '14px',
      color: '#dc3545',
      padding: '20px',
      textAlign: 'center' as const,
    },
    placeholder: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      fontSize: '14px',
      color: isDark ? '#b0b0b0' : '#6c757d',
      textAlign: 'center' as const,
    },
  };
}

