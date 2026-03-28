import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Author } from '../services/gemini';

export type BookStatus = 'Wishlist' | 'Reading' | 'Read' | 'Ignored';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  dateAdded: string;
  tags: string[]; // tag IDs
  coverUrl?: string;
  description?: string;
  rating?: number; // 1-5 rating
  notes?: string;
  publicationYear?: number;
  genre?: string;
}

export type TagCategory = 'Genre' | 'Trope' | 'Setting' | 'Vibe' | 'Other';

export interface Tag {
  id: string;
  name: string;
  category?: TagCategory;
  lastUsed?: string; // ISO date string
}

export interface Goal {
  target: number;
  year: number;
}

export interface BackgroundTask {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: any;
}

export type Theme = 'light' | 'dark' | 'leaf' | 'system';

interface LibraryContextType {
  books: Book[];
  tags: Tag[];
  goals: Goal;
  tasks: BackgroundTask[];
  authors: Author[];
  theme: Theme;
  githubUser: any | null;
  setTheme: (theme: Theme) => void;
  loginGitHub: () => Promise<void>;
  logoutGitHub: () => Promise<void>;
  fetchGitHubUser: () => Promise<void>;
  syncToGitHub: () => Promise<{ success: boolean; url?: string; error?: string }>;
  addBook: (book: Omit<Book, 'id' | 'dateAdded'>) => { success: boolean; message?: string };
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  bulkUpdateStatus: (ids: string[], status: BookStatus) => void;
  bulkDeleteBooks: (ids: string[]) => void;
  addTag: (name: string, category?: TagCategory) => string;
  renameTag: (id: string, newName: string) => void;
  updateTagCategory: (id: string, category: TagCategory) => void;
  markTagUsed: (id: string) => void;
  deleteTag: (id: string) => void;
  reorderTags: (newTags: Tag[]) => void;
  updateGoal: (goal: Goal) => void;
  addTask: (task: Omit<BackgroundTask, 'id'>) => string;
  updateTask: (id: string, updates: Partial<BackgroundTask>) => void;
  removeTask: (id: string) => void;
  addAuthor: (author: Author) => void;
  updateAuthor: (id: string, updates: Partial<Author>) => void;
  removeAuthor: (id: string) => void;
  exportData: () => string;
  importData: (jsonString: string, merge: boolean) => void;
  clearLibrary: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider = ({ children }: { children: ReactNode }) => {
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('sapphic-shelves-books');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse books from localStorage", e);
      return [];
    }
  });
  
  const [tags, setTags] = useState<Tag[]>(() => {
    const saved = localStorage.getItem('sapphic-shelves-tags');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse tags from localStorage", e);
      }
    }
    return [
      { id: '1', name: 'Enemies to Lovers', category: 'Trope' },
      { id: '2', name: 'Sci-Fi', category: 'Genre' },
      { id: '3', name: 'Fantasy', category: 'Genre' }
    ];
  });

  const [goals, setGoals] = useState<Goal>(() => {
    const saved = localStorage.getItem('sapphic-shelves-goals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse goals from localStorage", e);
      }
    }
    return { target: 50, year: new Date().getFullYear() };
  });

  const [tasks, setTasks] = useState<BackgroundTask[]>([]);

  const [authors, setAuthors] = useState<Author[]>(() => {
    const saved = localStorage.getItem('sapphic-shelves-authors');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse authors from localStorage", e);
      return [];
    }
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('sapphic-shelves-theme');
    return (saved as Theme) || 'system';
  });

  const [githubUser, setGithubUser] = useState<any | null>(null);

  const fetchGitHubUser = async () => {
    try {
      const res = await fetch('/api/auth/github/user');
      if (res.ok) {
        const data = await res.json();
        setGithubUser(data.user);
      } else {
        setGithubUser(null);
      }
    } catch (e) {
      setGithubUser(null);
    }
  };

  const loginGitHub = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const { url } = await res.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (e) {
      console.error("Failed to get GitHub auth URL", e);
    }
  };

  const logoutGitHub = async () => {
    try {
      await fetch('/api/auth/github/logout', { method: 'POST' });
      setGithubUser(null);
    } catch (e) {
      console.error("Failed to logout from GitHub", e);
    }
  };

  const syncToGitHub = async () => {
    try {
      const data = { books, tags, goals, authors };
      const res = await fetch('/api/auth/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      const result = await res.json();
      return result;
    } catch (e) {
      console.error("Failed to sync to GitHub", e);
      return { success: false, error: "Network error" };
    }
  };

  useEffect(() => {
    fetchGitHubUser();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'github') {
        fetchGitHubUser();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    localStorage.setItem('sapphic-shelves-books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('sapphic-shelves-tags', JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem('sapphic-shelves-goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('sapphic-shelves-authors', JSON.stringify(authors));
  }, [authors]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const isLeaf = theme === 'leaf';
    
    root.classList.remove('light', 'dark', 'leaf');
    
    if (isDark) {
      root.classList.add('dark');
    } else if (isLeaf) {
      root.classList.add('leaf');
    } else {
      root.classList.add('light');
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('sapphic-shelves-theme', newTheme);
  };

  const addBook = (bookData: Omit<Book, 'id' | 'dateAdded'>) => {
    const isDuplicate = books.some(b => 
      (b.title?.toLowerCase() || '') === (bookData.title?.toLowerCase() || '') && 
      (b.author?.toLowerCase() || '') === (bookData.author?.toLowerCase() || '')
    );

    if (isDuplicate) {
      return { success: false, message: 'This book already exists in your library.' };
    }

    const newBook: Book = {
      ...bookData,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    };
    setBooks(prev => [newBook, ...prev]);
    return { success: true };
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  const bulkUpdateStatus = (ids: string[], status: BookStatus) => {
    setBooks(prev => prev.map(b => ids.includes(b.id) ? { ...b, status } : b));
  };

  const bulkDeleteBooks = (ids: string[]) => {
    setBooks(prev => prev.filter(b => !ids.includes(b.id)));
  };

  const addTag = (name: string, category: TagCategory = 'Other') => {
    const existing = tags.find(t => (t.name?.toLowerCase() || '') === (name?.toLowerCase() || ''));
    if (existing) {
      return existing.id;
    }
    const newId = crypto.randomUUID();
    setTags(prev => [...prev, { id: newId, name, category, lastUsed: new Date().toISOString() }]);
    return newId;
  };

  const renameTag = (id: string, newName: string) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const updateTagCategory = (id: string, category: TagCategory) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, category } : t));
  };

  const markTagUsed = (id: string) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, lastUsed: new Date().toISOString() } : t));
  };

  const deleteTag = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
    // Remove tag from all books
    setBooks(prev => prev.map(b => ({
      ...b,
      tags: b.tags.filter(tId => tId !== id)
    })));
  };

  const reorderTags = (newTags: Tag[]) => {
    setTags(newTags);
  };

  const updateGoal = (goal: Goal) => {
    setGoals(goal);
  };

  const addTask = (taskData: Omit<BackgroundTask, 'id'>) => {
    const id = crypto.randomUUID();
    setTasks(prev => [...prev, { ...taskData, id }]);
    return id;
  };

  const updateTask = (id: string, updates: Partial<BackgroundTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addAuthor = (author: Author) => {
    if (!authors.find(a => a.name === author.name)) {
      setAuthors(prev => [...prev, author]);
    }
  };

  const updateAuthor = (id: string, updates: Partial<Author>) => {
    setAuthors(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeAuthor = (id: string) => {
    setAuthors(prev => prev.filter(a => a.id !== id));
  };

  const clearLibrary = () => {
    setBooks([]);
    setTags([]);
    setAuthors([]);
    setGoals({ target: 50, year: new Date().getFullYear() });
  };

  const exportData = () => {
    return JSON.stringify({ books, tags, goals, authors });
  };

  const importData = (jsonString: string, merge: boolean) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.books) {
        setBooks(prev => merge ? [...prev, ...data.books] : data.books);
      }
      if (data.tags) {
        setTags(prev => merge ? [...prev, ...data.tags.filter((newTag: Tag) => !prev.find(t => t.id === newTag.id))] : data.tags);
      }
      if (data.goals && !merge) {
        setGoals(data.goals);
      }
      if (data.authors) {
        setAuthors(prev => merge ? [...prev, ...data.authors.filter((newAuthor: Author) => !prev.find(a => a.id === newAuthor.id))] : data.authors);
      }
    } catch (e) {
      console.error("Failed to parse import data", e);
    }
  };

  return (
    <LibraryContext.Provider value={{
      books, tags, goals, tasks, authors, theme, setTheme,
      githubUser, loginGitHub, logoutGitHub, fetchGitHubUser, syncToGitHub,
      addBook, updateBook, deleteBook, bulkUpdateStatus, bulkDeleteBooks,
      addTag, renameTag, updateTagCategory, markTagUsed, deleteTag, reorderTags, updateGoal,
      addTask, updateTask, removeTask,
      addAuthor, updateAuthor, removeAuthor,
      exportData, importData, clearLibrary
    }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
