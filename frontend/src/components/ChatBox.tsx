import { useState } from 'react';

interface ChatBoxProps {
  onSend: (prompt: string) => void;
  isLoading: boolean;
}

export function ChatBox({ onSend, isLoading }: ChatBoxProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSend(prompt.trim());
      setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt here..."
        disabled={isLoading}
        style={styles.textarea}
        rows={4}
      />
      <button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        style={{
          ...styles.button,
          ...(isLoading || !prompt.trim() ? styles.buttonDisabled : {}),
        }}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
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
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};


