import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authenticateUser, loadUsers, saveUsers, addUser, updateUser, deleteUser, generateUserId } from '../data/authData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  users: User[];
  addUser: (data: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'teatro_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw) as User;
    } catch { /* ignore */ }
    return null;
  });

  const [users, setUsers] = useState<User[]>(() => loadUsers());

  useEffect(() => {
    setUsers(loadUsers());
  }, []);

  const login = useCallback((email: string, password: string): User | null => {
    const found = authenticateUser(email, password);
    if (found) {
      setUser(found);
      localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    }
    return found;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const handleAddUser = useCallback((data: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...data,
      id: generateUserId(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    addUser(newUser);
    setUsers(loadUsers());
  }, []);

  const handleUpdateUser = useCallback((id: string, updates: Partial<User>) => {
    updateUser(id, updates);
    setUsers(loadUsers());
    if (user?.id === id && updates.active === false) {
      logout();
    }
  }, [user, logout]);

  const handleDeleteUser = useCallback((id: string) => {
    deleteUser(id);
    setUsers(loadUsers());
    if (user?.id === id) logout();
  }, [user, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        users,
        addUser: handleAddUser,
        updateUser: handleUpdateUser,
        deleteUser: handleDeleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
