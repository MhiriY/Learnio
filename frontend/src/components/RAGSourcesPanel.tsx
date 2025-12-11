import { RAGSource } from '../api/agent';
import { useTheme } from '../theme/ThemeContext';

interface RAGSourcesPanelProps {
  sources: RAGSource[];
  onSelectSource: (source: RAGSource) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function RAGSourcesPanel({
  sources,
  onSelectSource,
  isOpen,
  onClose,
}: RAGSourcesPanelProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Sources ({sources.length})</h3>
          <button onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>
        <div style={styles.content}>
          {sources.length === 0 ? (
            <div style={styles.empty}>No sources available</div>
          ) : (
            sources.map((source, index) => (
              <div
                key={index}
                style={styles.sourceCard}
                onClick={() => onSelectSource(source)}
              >
                <div style={styles.sourceHeader}>
                  <span style={styles.documentName}>
                    📄 {source.documentName}
                  </span>
                  <span style={styles.chunkIndex}>Chunk {source.chunkIndex}</span>
                </div>
                <div style={styles.sourceContent}>
                  {source.content.length > 200
                    ? `${source.content.substring(0, 200)}...`
                    : source.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getStyles(theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  return {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    panel: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      borderBottom: `1px solid ${isDark ? '#3a3a3a' : '#e9ecef'}`,
    },
    title: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '600',
      color: isDark ? '#e0e0e0' : '#212529',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      color: isDark ? '#b0b0b0' : '#6c757d',
      cursor: 'pointer',
      padding: '0',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'background-color 0.2s',
    },
    content: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '16px 20px',
    },
    empty: {
      textAlign: 'center' as const,
      padding: '48px',
      color: isDark ? '#b0b0b0' : '#6c757d',
      fontSize: '14px',
    },
    sourceCard: {
      padding: '12px',
      marginBottom: '12px',
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      border: `1px solid ${isDark ? '#3a3a3a' : '#e9ecef'}`,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, border-color 0.2s',
    },
    sourceHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },
    documentName: {
      fontSize: '14px',
      fontWeight: '600',
      color: isDark ? '#e0e0e0' : '#212529',
    },
    chunkIndex: {
      fontSize: '12px',
      color: isDark ? '#b0b0b0' : '#6c757d',
      backgroundColor: isDark ? '#3a3a3a' : '#e9ecef',
      padding: '4px 8px',
      borderRadius: '4px',
    },
    sourceContent: {
      fontSize: '13px',
      color: isDark ? '#b0b0b0' : '#6c757d',
      lineHeight: '1.5',
    },
  };
}

