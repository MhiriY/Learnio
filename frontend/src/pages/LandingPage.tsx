import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBox } from '../components/ChatBox';
import { ResponseBox } from '../components/ResponseBox';
import { DocumentContextBanner } from '../components/DocumentContextBanner';
import { askAgent, docChat } from '../api/agent';
import { uploadDocument, DocumentResponseDto } from '../api/documents';
import { useAuth } from '../auth/useAuth';

export function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] =
    useState<DocumentResponseDto | null>(null);

  // This holds the DOCUMENT to use as context
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);

  // -------------------------------
  // FIXED handleSend
  // -------------------------------
  const handleSend = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setUploadMessage(null);

    try {
      let agentResponse;

      if (currentDocumentId) {
        // Document-aware chat uses uploaded doc as context
        agentResponse = await docChat(currentDocumentId, prompt);
      } else {
        // Normal chat
        agentResponse = await askAgent(prompt);
      }

      setResponse(agentResponse);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------
  // File upload logic
  // -------------------------------
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadMessage(null);
    setUploadedDocument(null);

    try {
      const document = await uploadDocument(file);

      // Store the uploaded document metadata
      setUploadedDocument(document);

      // VERY IMPORTANT: Store its documentId so chat uses it
      setCurrentDocumentId(document.id);

      setUploadMessage(
        `Successfully uploaded: ${document.originalFilename || file.name}`
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearContext = () => {
    setUploadedDocument(null);
    setCurrentDocumentId(null);
    setUploadMessage(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Learnio AI Agent</h1>
            <p style={styles.subtitle}>
              Ask anything and get an AI-powered response
            </p>
          </div>
          <div style={styles.userSection}>
            {user && (
              <span style={styles.userInfo}>
                {user.name || user.email}
              </span>
            )}
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        <ChatBox
          onSend={handleSend}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
          isUploading={isUploading}
        />

        {uploadedDocument && (
          <div style={styles.contextWrapper}>
            <DocumentContextBanner
              document={uploadedDocument}
              onClear={handleClearContext}
            />
            {uploadMessage && (
              <div style={styles.uploadHint}>✓ {uploadMessage}</div>
            )}
          </div>
        )}

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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#212529',
    textAlign: 'left',
  },
  subtitle: {
    margin: '0',
    fontSize: '16px',
    color: '#6c757d',
    textAlign: 'left',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInfo: {
    fontSize: '14px',
    color: '#6c757d',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  contextWrapper: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  uploadHint: {
    fontSize: '13px',
    color: '#16a34a',
  },
};


