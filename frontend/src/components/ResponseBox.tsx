interface ResponseBoxProps {
  response: string | null;
  isLoading: boolean;
  error: string | null;
}

export function ResponseBox({ response, isLoading, error }: ResponseBoxProps) {
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading response...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>
          Your agent response will appear here...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.response}>{response}</div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginTop: '24px',
    width: '100%',
  },
  response: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    fontSize: '16px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
  loading: {
    padding: '16px',
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '16px',
  },
  error: {
    padding: '16px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    color: '#721c24',
    fontSize: '16px',
  },
  placeholder: {
    padding: '16px',
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '16px',
    fontStyle: 'italic',
  },
};


