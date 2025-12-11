import { useTheme } from '../theme/ThemeContext';
import { CourseDocumentResponseDto } from '../api/courses';

interface DocumentSidebarProps {
  documents: CourseDocumentResponseDto[];
  currentDocumentId?: string | null;
  onSelectDocument: (documentId: string | null) => void;
}

export function DocumentSidebar({
  documents,
  currentDocumentId,
  onSelectDocument,
}: DocumentSidebarProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return '#28a745';
      case 'PROCESSING':
        return '#ffc107';
      case 'FAILED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <h3 style={styles.title}>Documents</h3>
      </div>
      <div style={styles.list}>
        <button
          onClick={() => onSelectDocument(null)}
          style={{
            ...styles.item,
            ...(currentDocumentId === null ? styles.itemActive : {}),
          }}
        >
          <div style={styles.itemContent}>
            <div style={styles.itemTitle}>🌐 Global Course Chat</div>
            <div style={styles.itemSubtitle}>All documents</div>
          </div>
        </button>
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onSelectDocument(doc.id)}
            style={{
              ...styles.item,
              ...(currentDocumentId === doc.id ? styles.itemActive : {}),
            }}
          >
            <div style={styles.itemContent}>
              <div style={styles.itemTitle}>
                {doc.originalFilename || 'Untitled Document'}
              </div>
              <div style={styles.itemMeta}>
                <span
                  style={{
                    ...styles.statusBadge,
                    color: getStatusColor(doc.status),
                  }}
                >
                  {doc.status}
                </span>
              </div>
            </div>
          </button>
        ))}
        {documents.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No documents in this course</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getStyles(theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  return {
    sidebar: {
      width: '280px',
      height: '100%',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRight: `1px solid ${isDark ? '#3a3a3a' : '#e9ecef'}`,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    header: {
      padding: '16px',
      borderBottom: `1px solid ${isDark ? '#3a3a3a' : '#e9ecef'}`,
    },
    title: {
      margin: 0,
      fontSize: '16px',
      fontWeight: '600',
      color: isDark ? '#e0e0e0' : '#212529',
    },
    list: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '8px',
    },
    item: {
      width: '100%',
      padding: '12px',
      marginBottom: '4px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      textAlign: 'left' as const,
      transition: 'background-color 0.2s',
    },
    itemActive: {
      backgroundColor: isDark ? '#3a5a78' : '#e7f3ff',
    },
    itemContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    itemTitle: {
      fontSize: '14px',
      fontWeight: '500',
      color: isDark ? '#e0e0e0' : '#212529',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    itemSubtitle: {
      fontSize: '12px',
      color: isDark ? '#b0b0b0' : '#6c757d',
    },
    itemMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '4px',
    },
    statusBadge: {
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    emptyState: {
      padding: '24px 16px',
      textAlign: 'center' as const,
    },
    emptyText: {
      fontSize: '14px',
      color: isDark ? '#b0b0b0' : '#6c757d',
      fontStyle: 'italic',
    },
  };
}

