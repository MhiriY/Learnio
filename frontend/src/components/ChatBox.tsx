import { useState, useRef } from 'react';

interface ChatBoxProps {
  onSend: (prompt: string) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  isUploading: boolean;
}

export function ChatBox({
  onSend,
  onFileUpload,
  isLoading,
  isUploading,
}: ChatBoxProps) {
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading && !isUploading) {
      onSend(prompt.trim());
      setPrompt('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      onFileUpload(file);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt here..."
        disabled={isLoading || isUploading}
        style={styles.textarea}
        rows={4}
      />
      <div style={styles.buttonContainer}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={styles.hiddenInput}
          disabled={isLoading || isUploading}
        />
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={isLoading || isUploading}
          style={{
            ...styles.uploadButton,
            ...(isLoading || isUploading ? styles.buttonDisabled : {}),
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </button>
        <button
          type="submit"
          disabled={isLoading || isUploading || !prompt.trim()}
          style={{
            ...styles.button,
            ...(isLoading || isUploading || !prompt.trim()
              ? styles.buttonDisabled
              : {}),
          }}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontFamily: 'inherit',
    border: '1px solid #ddd',
    borderRadius: '8px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    flex: 1,
  },
  uploadButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  hiddenInput: {
    display: 'none',
  },
};


