import { useState } from 'react';
import { ChatBox } from '../components/ChatBox';
import { ResponseBox } from '../components/ResponseBox';
import { askAgent } from '../api/agent';

export function LandingPage() {
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const agentResponse = await askAgent(prompt);
      setResponse(agentResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Learnio AI Agent</h1>
        <p style={styles.subtitle}>Ask anything and get an AI-powered response</p>
        
        <ChatBox onSend={handleSend} isLoading={isLoading} />
        <ResponseBox response={response} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '600px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 24px 0',
    fontSize: '16px',
    color: '#6c757d',
    textAlign: 'center',
  },
};


