import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chatStream, RAGSource } from '../api/agent';
import {
  getCourse,
  getCourseDocuments,
  CourseResponseDto,
  CourseDocumentResponseDto,
} from '../api/courses';
import { getDocument, DocumentResponseDto } from '../api/documents';
import { getMessages, Message } from '../api/messages';
import { getConversations, Conversation } from '../api/conversations';
import { ChatBox } from '../components/ChatBox';
import { DocumentSidebar } from '../components/DocumentSidebar';
import { PDFViewer } from '../components/PDFViewer';
import { RAGSourcesPanel } from '../components/RAGSourcesPanel';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../theme/ThemeContext';

interface MessageWithSources extends Message {
  sources?: RAGSource[];
}

export function CourseChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const courseId = searchParams.get('courseId');
  const documentId = searchParams.get('documentId');
  const conversationIdParam = searchParams.get('conversationId');

  const [course, setCourse] = useState<CourseResponseDto | null>(null);
  const [documents, setDocuments] = useState<CourseDocumentResponseDto[]>([]);
  const [document, setDocument] = useState<DocumentResponseDto | null>(null);
  const [messages, setMessages] = useState<MessageWithSources[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    conversationIdParam || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [streamingSources, setStreamingSources] = useState<RAGSource[] | undefined>(undefined);
  const [selectedSourceMessageId, setSelectedSourceMessageId] = useState<string | null>(null);
  const [highlightedChunk, setHighlightedChunk] = useState<{
    documentId: string;
    chunkIndex: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if no courseId
  useEffect(() => {
    if (!courseId) {
      navigate('/courses');
    }
  }, [courseId, navigate]);

  // Load course and documents data
  useEffect(() => {
    if (courseId) {
      loadCourse();
      loadCourseDocuments();
      if (documentId) {
        loadDocument();
      } else {
        setDocument(null);
      }
    }
  }, [courseId, documentId]);

  // Find and load conversation for current context
  useEffect(() => {
    if (courseId) {
      findAndLoadConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, documentId, conversationIdParam]);

  // Load messages when conversationId changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCourse = async () => {
    if (!courseId) return;
    setIsLoadingCourse(true);
    setError(null);
    try {
      const data = await getCourse(courseId);
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
      navigate('/courses');
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const loadCourseDocuments = async () => {
    if (!courseId) return;
    setIsLoadingDocuments(true);
    try {
      const data = await getCourseDocuments(courseId);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const loadDocument = async () => {
    if (!documentId) {
      setDocument(null);
      return;
    }
    try {
      const doc = await getDocument(documentId);
      setDocument(doc);
    } catch (err) {
      console.error('Failed to load document:', err);
      setDocument(null);
    }
  };

  const findAndLoadConversation = async () => {
    if (!courseId) return;

    try {
      const allConversations = await getConversations();

      // If conversationId is provided in URL, verify it matches context
      if (conversationIdParam) {
        const conv = allConversations.find((c) => c.id === conversationIdParam);
        if (conv) {
          const courseMatch = conv.courseId === courseId;
          const documentMatch =
            documentId === null
              ? conv.documentId === null
              : conv.documentId === documentId;
          if (courseMatch && documentMatch) {
            setCurrentConversationId(conversationIdParam);
            return;
          }
        }
        // Conversation doesn't match context, remove it from URL
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('conversationId');
        navigate(`/chat?${newParams.toString()}`, { replace: true });
      }

      // Try to find existing conversation for this context
      const matchingConversation = allConversations.find((conv) => {
        const courseMatch = conv.courseId === courseId;
        const documentMatch =
          documentId === null
            ? conv.documentId === null
            : conv.documentId === documentId;
        return courseMatch && documentMatch;
      });

      if (matchingConversation) {
        setCurrentConversationId(matchingConversation.id);
        // Update URL to include conversationId
        const newParams = new URLSearchParams(searchParams);
        newParams.set('conversationId', matchingConversation.id);
        navigate(`/chat?${newParams.toString()}`, { replace: true });
      } else {
        // No existing conversation, start fresh
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to find conversation:', err);
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const loadMessages = async (convId: string) => {
    setIsLoadingMessages(true);
    try {
      const data = await getMessages(convId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleDocumentSelect = (selectedDocumentId: string | null) => {
    if (!courseId) return;

    // Clear current conversation when switching context
    setCurrentConversationId(null);
    setMessages([]);
    setStreamingMessage('');

    // Navigate to new context
    const newParams = new URLSearchParams();
    newParams.set('courseId', courseId);
    if (selectedDocumentId) {
      newParams.set('documentId', selectedDocumentId);
    }
    // Don't include conversationId - will be found/created automatically

    navigate(`/chat?${newParams.toString()}`);
  };

  const handleSend = async (prompt: string) => {
    if (!courseId) return;

    setIsLoading(true);
    setError(null);
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
      // Use streaming for better UX
      await chatStream(
        prompt,
        currentConversationId || undefined,
        courseId,
        documentId || undefined,
        (content: string) => {
          setStreamingMessage((prev) => prev + content);
        },
        (newConversationId: string, sources?: RAGSource[]) => {
          // Streaming complete
          setStreamingMessage('');
          setStreamingSources(sources);

          // Update conversation ID if it's a new conversation
          if (!currentConversationId) {
            setCurrentConversationId(newConversationId);
            // Update URL with conversationId
            const newParams = new URLSearchParams(searchParams);
            newParams.set('conversationId', newConversationId);
            navigate(`/chat?${newParams.toString()}`, { replace: true });
          }

          // Reload messages to get the latest, then attach sources
          loadMessages(newConversationId).then(() => {
            // Attach sources to the last assistant message after reload
            if (sources && sources.length > 0) {
              setTimeout(() => {
                setMessages((prev) => {
                  const updated = [...prev];
                  // Find the last assistant message
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].role === 'ASSISTANT') {
                      updated[i] = { ...updated[i], sources };
                      break;
                    }
                  }
                  return updated;
                });
              }, 100);
            }
          });
        },
        (err: Error) => {
          setError(err.message);
          setStreamingMessage('');
          setStreamingSources(undefined);
          // Remove the user message on error
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setStreamingMessage('');
      // Remove the user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = () => {
    // File upload not supported in course chat - redirect to course detail
    if (courseId) {
      navigate(`/courses/${courseId}`);
    }
  };

  const styles = getStyles(theme);

  if (isLoadingCourse) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading course...</div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div style={styles.page}>
        <div style={styles.error}>{error}</div>
        <button onClick={() => navigate('/courses')} style={styles.backButton}>
          Back to Courses
        </button>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          style={styles.backButton}
        >
          ← Back to Course
        </button>
        <div style={styles.headerContent}>
          <h1 style={styles.courseTitle}>{course.title}</h1>
          {document ? (
            <p style={styles.documentLabel}>
              Chat about: {document.originalFilename || 'Untitled'}
            </p>
          ) : (
            <p style={styles.documentLabel}>Course-wide AI Assistant</p>
          )}
        </div>
        <div style={styles.userInfo}>
          <span style={styles.userName}>{user?.name || user?.email}</span>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.mainContainer}>
        <DocumentSidebar
          documents={documents}
          currentDocumentId={documentId || null}
          onSelectDocument={handleDocumentSelect}
        />

        <div style={styles.chatBody}>
          {/* Context indicator */}
          <div style={styles.contextIndicator}>
            {document ? (
              <span style={styles.contextText}>
                📄 Using document: <strong>{document.originalFilename || 'Untitled'}</strong>
              </span>
            ) : (
              <span style={styles.contextText}>
                🌐 Using course-wide context
              </span>
            )}
          </div>

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
                    {message.role === 'ASSISTANT' && message.sources && message.sources.length > 0 && (
                      <button
                        onClick={() => setSelectedSourceMessageId(message.id)}
                        style={styles.showSourcesButton}
                      >
                        📚 Show Sources ({message.sources.length})
                      </button>
                    )}
                  </div>
                ))}
              {streamingMessage && (
                <div style={{ ...styles.message, ...styles.assistantMessage }}>
                  <div style={styles.messageRole}>Assistant</div>
                  <div style={styles.messageContent}>
                    {streamingMessage}
                    <span style={styles.cursor}>▋</span>
                  </div>
                  {streamingSources && streamingSources.length > 0 && (
                    <button
                      onClick={() => {
                        // Store sources temporarily for streaming message
                        const tempId = `streaming-${Date.now()}`;
                        setSelectedSourceMessageId(tempId);
                      }}
                      style={styles.showSourcesButton}
                    >
                      📚 Show Sources ({streamingSources.length})
                    </button>
                  )}
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

          <div style={styles.chatBoxContainer}>
            <ChatBox
              onSend={handleSend}
              onFileUpload={handleFileUpload}
              isLoading={isLoading}
              isUploading={false}
            />
          </div>
        </div>

        <div style={styles.pdfPanel}>
          <PDFViewer
            documentId={documentId || null}
            highlightedChunk={highlightedChunk}
          />
        </div>
      </div>

      {/* RAG Sources Panel */}
      {selectedSourceMessageId && (
        <RAGSourcesPanel
          sources={
            selectedSourceMessageId.startsWith('streaming-')
              ? streamingSources || []
              : messages.find((m) => m.id === selectedSourceMessageId)?.sources || []
          }
          onSelectSource={(source) => {
            // Switch to document if different
            if (source.documentId !== documentId) {
              handleDocumentSelect(source.documentId);
            }
            // Highlight chunk
            setHighlightedChunk({
              documentId: source.documentId,
              chunkIndex: source.chunkIndex,
            });
            setSelectedSourceMessageId(null);
          }}
          isOpen={!!selectedSourceMessageId}
          onClose={() => setSelectedSourceMessageId(null)}
        />
      )}
    </div>
  );
}

function getStyles(theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  return {
    page: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
      transition: 'background-color 0.3s ease',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 24px',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderBottom: `1px solid ${isDark ? '#3a3a3a' : '#e9ecef'}`,
      flexWrap: 'wrap' as const,
    },
    backButton: {
      padding: '8px 16px',
      fontSize: '14px',
      color: isDark ? '#e0e0e0' : '#6c757d',
      backgroundColor: 'transparent',
      border: `1px solid ${isDark ? '#3a3a3a' : '#dee2e6'}`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    headerContent: {
      flex: 1,
      minWidth: 0,
    },
    courseTitle: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '600',
      color: isDark ? '#e0e0e0' : '#212529',
    },
    documentLabel: {
      margin: '4px 0 0 0',
      fontSize: '14px',
      color: isDark ? '#b0b0b0' : '#6c757d',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    userName: {
      fontSize: '14px',
      color: isDark ? '#b0b0b0' : '#6c757d',
    },
    logoutButton: {
      padding: '8px 16px',
      fontSize: '14px',
      color: isDark ? '#b0b0b0' : '#6c757d',
      backgroundColor: 'transparent',
      border: `1px solid ${isDark ? '#3a3a3a' : '#dee2e6'}`,
      borderRadius: '6px',
      cursor: 'pointer',
    },
    mainContainer: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
    },
    pdfPanel: {
      width: '400px',
      borderLeft: `1px solid ${isDark ? '#3a3a3a' : '#e9ecef'}`,
      display: 'flex',
      flexDirection: 'column' as const,
    },
    showSourcesButton: {
      marginTop: '8px',
      padding: '6px 12px',
      fontSize: '12px',
      color: isDark ? '#4dabf7' : '#007bff',
      backgroundColor: 'transparent',
      border: `1px solid ${isDark ? '#4dabf7' : '#007bff'}`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    chatBody: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
    },
    contextIndicator: {
      padding: '12px 16px',
      marginBottom: '16px',
      backgroundColor: isDark ? '#2a2a2a' : '#e7f3ff',
      border: `1px solid ${isDark ? '#3a3a3a' : '#b3d9ff'}`,
      borderRadius: '8px',
      fontSize: '14px',
    },
    contextText: {
      color: isDark ? '#e0e0e0' : '#004085',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '20px',
      marginBottom: '16px',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontSize: '18px',
      color: isDark ? '#b0b0b0' : '#6c757d',
    },
    loadingMessages: {
      textAlign: 'center' as const,
      padding: '48px',
      fontSize: '16px',
      color: isDark ? '#b0b0b0' : '#6c757d',
    },
    emptyMessages: {
      textAlign: 'center' as const,
      padding: '48px',
      fontSize: '16px',
      color: isDark ? '#b0b0b0' : '#6c757d',
      fontStyle: 'italic',
    },
    message: {
      padding: '16px',
      borderRadius: '12px',
      maxWidth: '80%',
      wordWrap: 'break-word' as const,
    },
    userMessage: {
      alignSelf: 'flex-end' as const,
      backgroundColor: isDark ? '#3a5a78' : '#0d6efd',
      color: '#fff',
    },
    assistantMessage: {
      alignSelf: 'flex-start' as const,
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      color: isDark ? '#e0e0e0' : '#212529',
      border: `1px solid ${isDark ? '#3a3a3a' : '#e9ecef'}`,
    },
    messageRole: {
      fontSize: '12px',
      fontWeight: '600',
      marginBottom: '8px',
      opacity: 0.8,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    messageContent: {
      fontSize: '16px',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap' as const,
    },
    cursor: {
      display: 'inline-block',
      width: '8px',
      height: '16px',
      backgroundColor: isDark ? '#e0e0e0' : '#212529',
      marginLeft: '4px',
      animation: 'blink 1s infinite',
    },
    errorBox: {
      padding: '12px 16px',
      marginBottom: '16px',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      borderRadius: '6px',
      border: '1px solid #f5c2c7',
    },
    error: {
      padding: '24px',
      textAlign: 'center' as const,
      color: '#dc3545',
      fontSize: '16px',
    },
    chatBoxContainer: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${isDark ? '#3a3a3a' : '#e9ecef'}`,
    },
  };
}
