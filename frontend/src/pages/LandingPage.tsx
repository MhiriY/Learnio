import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChatBox } from '../components/ChatBox';
import { ConversationsSidebar } from '../components/ConversationsSidebar';
import { DocumentContextBanner } from '../components/DocumentContextBanner';
import { chatStream } from '../api/agent';
import { uploadDocument, DocumentResponseDto } from '../api/documents';
import { getMessages, Message } from '../api/messages';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../theme/ThemeContext';

export function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] =
    useState<DocumentResponseDto | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Read courseId and documentId from URL params on mount
  useEffect(() => {
    const courseId = searchParams.get('courseId');
    const documentId = searchParams.get('documentId');
    if (courseId) {
      setCurrentCourseId(courseId);
    }
    if (documentId) {
      setCurrentDocumentId(documentId);
    }
  }, [searchParams]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
      setStreamingMessage('');
    }
  }, [currentConversationId]);

  // Auto-scroll to bottom when messages or streaming message changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    setError(null);
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSend = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setUploadMessage(null);
    setStreamingMessage('');

    // Add user message immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: currentConversationId || '',
      role: 'USER',
      content: prompt,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      await chatStream(
        prompt,
        currentConversationId || undefined,
        currentCourseId || undefined,
        currentDocumentId || undefined,
        (content: string) => {
          // Update streaming message in real-time
          setStreamingMessage((prev) => prev + content);
        },
        (conversationId: string) => {
          // Streaming complete
          setStreamingMessage('');
          
          // Update conversation ID if it's a new conversation
          if (!currentConversationId) {
            setCurrentConversationId(conversationId);
            setSidebarRefreshTrigger((prev) => prev + 1);
          }

          // Reload messages to get the latest (including the new assistant message)
          loadMessages(conversationId);
        },
        (err: Error) => {
          setError(err.message);
          setIsLoading(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadMessage(null);
    setUploadedDocument(null);

    try {
      const document = await uploadDocument(file);
      setUploadedDocument(document);
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

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setStreamingMessage('');
    setError(null);
  };

  const handleSelectConversation = (conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    setStreamingMessage('');
    setError(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const styles = getStyles(theme);

  return (
    <div style={styles.page}>
      <ConversationsSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        refreshTrigger={sidebarRefreshTrigger}
      />
      <div style={styles.mainContent}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Learnio AI Agent</h1>
              
            </div>
            <div style={styles.userSection}>
              {user && (
                <span style={styles.userInfo}>
                  {user.name || user.email}
                </span>
              )}
              <button onClick={toggleTheme} style={styles.themeButton} title="Toggle theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>

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

          {/* Messages Display */}
          <div style={styles.messagesContainer}>
            {isLoadingMessages ? (
              <div style={styles.loadingMessages}>Loading messages...</div>
            ) : messages.length === 0 && !streamingMessage ? (
              <div style={styles.emptyMessages}>
                {currentConversationId
                  ? 'No messages in this conversation'
                  : 'Start a new conversation by sending a message'}
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      ...styles.message,
                      ...(message.role === 'USER'
                        ? styles.userMessage
                        : styles.assistantMessage),
                    }}
                  >
                    <div style={styles.messageRole}>
                      {message.role === 'USER' ? 'You' : 'Assistant'}
                    </div>
                    <div style={styles.messageContent}>{message.content}</div>
                  </div>
                ))}
                {streamingMessage && (
                  <div style={{ ...styles.message, ...styles.assistantMessage }}>
                    <div style={styles.messageRole}>Assistant</div>
                    <div style={styles.messageContent}>
                      {streamingMessage}
                      <span style={styles.cursor}>▋</span>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <ChatBox
            onSend={handleSend}
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
            isUploading={isUploading}
          />
        </div>
      </div>
    </div>
  );
}

function getStyles(theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  return {
    page: {
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-secondary)',
      transition: 'background-color 0.3s ease',
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflow: 'auto',
    },
    card: {
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: `0 2px 8px ${isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'}`,
      width: '100%',
      maxWidth: '800px',
      display: 'flex',
      flexDirection: 'column' as const,
      maxHeight: 'calc(100vh - 40px)',
      transition: 'background-color 0.3s ease',
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
      color: 'var(--text-primary)',
      textAlign: 'left' as const,
    },
    subtitle: {
      margin: '0',
      fontSize: '16px',
      color: 'var(--text-secondary)',
      textAlign: 'left' as const,
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    userInfo: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
    },
    themeButton: {
      padding: '8px 12px',
      fontSize: '18px',
      backgroundColor: 'transparent',
      border: `1px solid var(--border-color)`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    logoutButton: {
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#fff',
      backgroundColor: 'var(--error-color)',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    contextWrapper: {
      marginBottom: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px',
    },
    uploadHint: {
      fontSize: '13px',
      color: 'var(--success-color)',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      marginBottom: '24px',
      padding: '16px',
      backgroundColor: 'var(--bg-tertiary)',
      borderRadius: '8px',
      minHeight: '200px',
      maxHeight: '400px',
      transition: 'background-color 0.3s ease',
    },
    loadingMessages: {
      padding: '16px',
      textAlign: 'center' as const,
      color: 'var(--text-secondary)',
      fontSize: '14px',
    },
    emptyMessages: {
      padding: '16px',
      textAlign: 'center' as const,
      color: 'var(--text-secondary)',
      fontSize: '14px',
      fontStyle: 'italic' as const,
    },
    message: {
      marginBottom: '16px',
      padding: '12px',
      borderRadius: '8px',
      transition: 'background-color 0.3s ease',
    },
    userMessage: {
      backgroundColor: isDark ? '#2d4a6b' : '#e7f3ff',
      marginLeft: '20%',
    },
    assistantMessage: {
      backgroundColor: isDark ? '#2d3a3a' : '#f8f9fa',
      marginRight: '20%',
    },
    messageRole: {
      fontSize: '12px',
      fontWeight: '600',
      color: 'var(--text-secondary)',
      marginBottom: '4px',
    },
    messageContent: {
      fontSize: '16px',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap' as const,
      wordWrap: 'break-word' as const,
      color: 'var(--text-primary)',
    },
    cursor: {
      display: 'inline-block',
      marginLeft: '2px',
      animation: 'blink 1s infinite',
    },
    errorBox: {
      padding: '12px',
      backgroundColor: isDark ? '#4a2d2d' : '#f8d7da',
      border: `1px solid ${isDark ? '#6b3a3a' : '#f5c6cb'}`,
      borderRadius: '8px',
      color: isDark ? '#ff6b6b' : '#721c24',
      fontSize: '14px',
      marginBottom: '16px',
    },
  };
}
