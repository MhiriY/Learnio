import { DocumentResponseDto } from '../api/documents';

interface DocumentContextBannerProps {
  document: DocumentResponseDto;
  onClear: () => void;
}

export function DocumentContextBanner({
  document,
  onClear,
}: DocumentContextBannerProps) {
  const uploadedAt = new Date(document.createdAt);
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(uploadedAt);

  const filename =
    document.originalFilename || document.filePath.split('/').pop() || 'PDF';

  return (
    <div style={styles.container}>
      <div style={styles.icon}>📄</div>
      <div style={styles.info}>
        <div style={styles.label}>Context document</div>
        <div style={styles.filename}>{filename}</div>
        <div style={styles.meta}>
          Using this PDF for answers • Uploaded {formattedDate}
        </div>
      </div>
      <button type="button" style={styles.clearButton} onClick={onClear}>
        Clear
      </button>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    background:
      'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(147,51,234,0.1))',
    border: '1px solid rgba(99,102,241,0.2)',
  },
  icon: {
    fontSize: '32px',
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  filename: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
  },
  meta: {
    fontSize: '13px',
    color: '#4b5563',
  },
  clearButton: {
    border: 'none',
    backgroundColor: '#fff',
    color: '#ef4444',
    borderRadius: '999px',
    padding: '6px 16px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  },
};


