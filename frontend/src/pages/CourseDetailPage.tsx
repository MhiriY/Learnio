import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCourse,
  getCourseDocuments,
  CourseResponseDto,
  CourseDocumentResponseDto,
} from '../api/courses';
import { uploadDocument } from '../api/documents';
import { useAuth } from '../auth/useAuth';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [course, setCourse] = useState<CourseResponseDto | null>(null);
  const [documents, setDocuments] = useState<CourseDocumentResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadCourse();
      loadDocuments();
    }
  }, [id]);

  const loadCourse = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCourse(id);
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!id) return;
    setIsLoadingDocuments(true);
    try {
      const data = await getCourseDocuments(id);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadDocument(file, id);
      // Refresh documents list
      await loadDocuments();
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload document'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleChatClick = () => {
    if (id) {
      navigate(`/chat?courseId=${id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  if (isLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading course...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={styles.page}>
        <div style={styles.error}>
          {error || 'Course not found'}
          <button onClick={() => navigate('/courses')} style={styles.backButton}>
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <button
            onClick={() => navigate('/courses')}
            style={styles.backButton}
          >
            ← Back to Courses
          </button>
          <h1 style={styles.courseTitle}>{course.title}</h1>
          {course.description && (
            <p style={styles.courseDescription}>{course.description}</p>
          )}
        </div>
        <div style={styles.headerActions}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.name || user?.email}</span>
            <button onClick={logout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          style={{
            ...styles.actionButton,
            ...(isUploading ? styles.buttonDisabled : {}),
          }}
        >
          {isUploading ? 'Uploading...' : '📄 Upload Document'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx"
          onChange={handleFileSelect}
          style={styles.hiddenInput}
        />
        <button onClick={handleChatClick} style={styles.actionButton}>
          💬 Chat About This Course
        </button>
      </div>

      {uploadError && (
        <div style={styles.uploadError}>
          {uploadError}
          <button
            onClick={() => setUploadError(null)}
            style={styles.dismissButton}
          >
            ×
          </button>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Documents</h2>
        {isLoadingDocuments ? (
          <div style={styles.loading}>Loading documents...</div>
        ) : documents.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              No documents yet. Upload your first document to get started.
            </p>
          </div>
        ) : (
          <div style={styles.documentsList}>
            {documents.map((doc) => (
              <div key={doc.id} style={styles.documentCard}>
                <div style={styles.documentInfo}>
                  <h3 style={styles.documentTitle}>
                    {doc.originalFilename || 'Untitled Document'}
                  </h3>
                  <div style={styles.documentMeta}>
                    <span style={styles.documentDate}>
                      {formatDate(doc.createdAt)}
                    </span>
                    <span
                      style={{
                        ...styles.documentStatus,
                        color: getStatusColor(doc.status),
                      }}
                    >
                      {doc.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate(`/chat?courseId=${id}&documentId=${doc.id}`)
                  }
                  style={styles.chatDocumentButton}
                  title="Chat about this document"
                >
                  💬 Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  backButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#6c757d',
    backgroundColor: 'transparent',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'background-color 0.2s',
  },
  courseTitle: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    color: '#212529',
  },
  courseDescription: {
    margin: '8px 0 0 0',
    fontSize: '16px',
    color: '#6c757d',
    maxWidth: '600px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontSize: '14px',
    color: '#6c757d',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#6c757d',
    backgroundColor: 'transparent',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#0d6efd',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
  },
  hiddenInput: {
    display: 'none',
  },
  uploadError: {
    padding: '12px 16px',
    backgroundColor: '#f8d7da',
    color: '#dc3545',
    borderRadius: '6px',
    border: '1px solid #f5c2c7',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#dc3545',
    padding: 0,
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '24px',
    fontWeight: '600',
    color: '#212529',
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    fontSize: '16px',
    color: '#6c757d',
  },
  error: {
    padding: '24px',
    backgroundColor: '#f8d7da',
    color: '#dc3545',
    borderRadius: '6px',
    border: '1px solid #f5c2c7',
    textAlign: 'center',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6c757d',
  },
  documentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  documentCard: {
    padding: '16px',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    transition: 'border-color 0.2s, background-color 0.2s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  documentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  chatDocumentButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#0d6efd',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
  },
  documentTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#212529',
  },
  documentMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#6c757d',
  },
  documentDate: {
    color: '#6c757d',
  },
  documentStatus: {
    fontWeight: '500',
  },
};

