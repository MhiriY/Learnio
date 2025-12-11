import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, CourseResponseDto } from '../api/courses';
import { CreateCourseModal } from '../components/CreateCourseModal';
import { useAuth } from '../auth/useAuth';

export function CoursesPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<CourseResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = (courseId: string) => {
    setIsCreateModalOpen(false);
    navigate(`/courses/${courseId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>My Courses</h1>
          <p style={styles.subtitle}>Manage your learning materials</p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={styles.newCourseButton}
          >
            + New Course
          </button>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.name || user?.email}</span>
            <button onClick={logout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={styles.loading}>Loading courses...</div>
      ) : error ? (
        <div style={styles.error}>
          {error}
          <button onClick={loadCourses} style={styles.retryButton}>
            Retry
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>No courses yet</h2>
          <p style={styles.emptyText}>
            Create your first course to get started organizing your documents
            and conversations.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={styles.emptyButton}
          >
            Create Your First Course
          </button>
        </div>
      ) : (
        <div style={styles.coursesGrid}>
          {courses.map((course) => (
            <div
              key={course.id}
              style={styles.courseCard}
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <h3 style={styles.courseTitle}>{course.title}</h3>
              {course.description && (
                <p style={styles.courseDescription}>{course.description}</p>
              )}
              <div style={styles.courseMeta}>
                <span style={styles.metaItem}>
                  📄 {course._count?.documents || 0} documents
                </span>
                <span style={styles.metaItem}>
                  💬 {course._count?.conversations || 0} conversations
                </span>
              </div>
              <div style={styles.courseFooter}>
                <span style={styles.courseDate}>
                  Created {formatDate(course.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
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
  pageTitle: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    color: '#212529',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '16px',
    color: '#6c757d',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  newCourseButton: {
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
  loading: {
    textAlign: 'center',
    padding: '48px',
    fontSize: '18px',
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
  retryButton: {
    marginTop: '12px',
    padding: '8px 16px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '64px 24px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#212529',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6c757d',
    marginBottom: '24px',
  },
  emptyButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#0d6efd',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  courseTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#212529',
  },
  courseDescription: {
    margin: 0,
    fontSize: '14px',
    color: '#6c757d',
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  courseMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#6c757d',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  courseFooter: {
    paddingTop: '12px',
    borderTop: '1px solid #e9ecef',
  },
  courseDate: {
    fontSize: '12px',
    color: '#adb5bd',
  },
};

