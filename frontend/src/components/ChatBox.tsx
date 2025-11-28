import { useState, useRef, KeyboardEvent } from 'react';
import { useTheme } from '../theme/ThemeContext';

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
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (prompt.trim() && !isLoading && !isUploading) {
      onSend(prompt.trim());
      setPrompt('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      onFileUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Auto-resize textarea
  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  const styles = getStyles(theme);

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputContainer}>
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
            ...styles.iconButton,
            ...(isLoading || isUploading ? styles.buttonDisabled : {}),
          }}
          title="Upload PDF document"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask Anything"
          disabled={isLoading || isUploading}
          style={styles.textarea}
          rows={1}
        />
        <button
          type="submit"
          disabled={isLoading || isUploading || !prompt.trim()}
          style={{
            ...styles.iconButton,
            ...styles.sendButton,
            ...(isLoading || isUploading || !prompt.trim()
              ? styles.buttonDisabled
              : {}),
          }}
          title="Send message"
        >
          {isLoading ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="spinner"
            >
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}

function getStyles(theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  return {
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      width: '100%',
    },
    inputContainer: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      padding: '12px',
      backgroundColor: isDark ? 'var(--bg-tertiary)' : '#fff',
      border: `1px solid ${isDark ? 'var(--border-color)' : '#e9ecef'}`,
      borderRadius: '12px',
      transition: 'all 0.2s',
    },
    textarea: {
      flex: 1,
      padding: '8px 12px',
      fontSize: '16px',
      fontFamily: 'inherit',
      backgroundColor: 'transparent',
      border: 'none',
      color: 'var(--text-primary)',
      resize: 'none' as const,
      outline: 'none',
      minHeight: '24px',
      maxHeight: '200px',
      overflowY: 'auto' as const,
      lineHeight: '1.5',
    },
    iconButton: {
      padding: '8px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isDark ? 'var(--text-secondary)' : '#6c757d',
      transition: 'all 0.2s',
      flexShrink: 0,
    },
    sendButton: {
      color: isDark ? 'var(--accent-color)' : '#007bff',
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    hiddenInput: {
      display: 'none',
    },
  };
}
