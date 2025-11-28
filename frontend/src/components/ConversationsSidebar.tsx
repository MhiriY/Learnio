import { useState, useEffect } from 'react';
import {
  getConversations,
  deleteConversation,
  Conversation,
} from '../api/conversations';
import { useTheme } from '../theme/ThemeContext';

interface ConversationsSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string | null) => void;
  onNewChat: () => void;
  refreshTrigger?: number; // Trigger refresh when this changes
}

export function ConversationsSidebar({
  currentConversationId,
  onSelectConversation,
  onNewChat,
  refreshTrigger,
}: ConversationsSidebarProps) {
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, [refreshTrigger]);

  const loadConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        onSelectConversation(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  const styles = getStyles(theme);

  return (
    <div style={styles.sidebar}>
      <button onClick={onNewChat} style={styles.newChatButton}>
        + New Chat
      </button>

      {isLoading ? (
        <div style={styles.loading}>Loading conversations...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : conversations.length === 0 ? (
        <div style={styles.empty}>No conversations yet</div>
      ) : (
        <div style={styles.conversationList}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              style={{
                ...styles.conversationItem,
                ...(currentConversationId === conv.id
                  ? styles.conversationItemActive
                  : {}),
              }}
            >
              <div style={styles.conversationContent}>
                <div style={styles.conversationTitle}>
                  {conv.title || 'New Conversation'}
                </div>
                {conv._count && (
                  <div style={styles.conversationMeta}>
                    {conv._count.messages} messages
                  </div>
                )}
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                disabled={deletingId === conv.id}
                style={styles.deleteButton}
                title="Delete conversation"
              >
                {deletingId === conv.id ? '...' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getStyles(theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  return {
    sidebar: {
      width: '280px',
      height: '100vh',
      backgroundColor: 'var(--bg-tertiary)',
      borderRight: `1px solid var(--border-color)`,
      display: 'flex',
      flexDirection: 'column' as const,
      padding: '16px',
      overflowY: 'auto' as const,
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
    },
    newChatButton: {
      padding: '12px 16px',
      fontSize: '16px',
      fontWeight: '600',
      color: '#fff',
      backgroundColor: 'var(--accent-color)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '16px',
      transition: 'background-color 0.2s',
    },
    loading: {
      padding: '16px',
      textAlign: 'center' as const,
      color: 'var(--text-secondary)',
      fontSize: '14px',
    },
    error: {
      padding: '16px',
      textAlign: 'center' as const,
      color: 'var(--error-color)',
      fontSize: '14px',
    },
    empty: {
      padding: '16px',
      textAlign: 'center' as const,
      color: 'var(--text-secondary)',
      fontSize: '14px',
      fontStyle: 'italic' as const,
    },
    conversationList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    conversationItem: {
      padding: '12px',
      backgroundColor: 'var(--bg-primary)',
      border: `1px solid var(--border-color)`,
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s',
    },
    conversationItemActive: {
      backgroundColor: isDark ? '#2d4a6b' : '#e7f3ff',
      borderColor: 'var(--accent-color)',
    },
    conversationContent: {
      flex: 1,
      minWidth: 0,
    },
    conversationTitle: {
      fontSize: '14px',
      fontWeight: '500',
      color: 'var(--text-primary)',
      marginBottom: '4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    conversationMeta: {
      fontSize: '12px',
      color: 'var(--text-secondary)',
    },
    deleteButton: {
      padding: '4px 8px',
      fontSize: '20px',
      fontWeight: 'bold',
      color: 'var(--error-color)',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'background-color 0.2s',
      flexShrink: 0,
      marginLeft: '8px',
    },
  };
}

