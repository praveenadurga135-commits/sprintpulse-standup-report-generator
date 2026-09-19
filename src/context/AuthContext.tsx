import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { SecurityService } from '../services/security';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isManager: boolean;
  isMember: boolean;
  login: (email: string, password?: string, rememberMe?: boolean) => { success: boolean; error?: string };
  register: (data: { name: string; email: string; password?: string; role: UserRole; title: string; department: string }, rememberMe?: boolean) => { success: boolean; error?: string };
  updateProfile: (partial: Partial<User>) => User | null;
  logout: () => void;
  switchUser: (userId: string) => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>(() => StorageService.getUsers());

  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setCurrentUser(StorageService.getCurrentUser());
      setAllUsers(StorageService.getUsers());
    });
    return unsub;
  }, []);

  const login = (email: string, password?: string, rememberMe: boolean = true) => {
    const cleanEmail = email.trim().toLowerCase();
    const found = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { success: false, error: 'No account found with this email address.' };
    }
    if (password && found.password) {
      const isValid = SecurityService.verifyPassword(password, found.password);
      if (!isValid) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
      // Upgrade legacy password hash to stronger KDF format if needed
      if (SecurityService.needsUpgrade(found.password)) {
        StorageService.updatePassword(found.email, password);
      }
    }

    const safeUser = SecurityService.sanitizeUser(found) as User;
    StorageService.setCurrentUser(safeUser, rememberMe);
    setCurrentUser(safeUser);
    return { success: true };
  };

  const register = (data: { name: string; email: string; password?: string; role: UserRole; title: string; department: string }, rememberMe: boolean = true) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const newUser = StorageService.registerUser({
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password || 'password123',
      role: data.role,
      avatar: '',
      title: data.title.trim() || (data.role === 'manager' ? 'Engineering Lead' : 'Software Engineer'),
      department: data.department.trim() || 'Core Engineering',
    }, rememberMe);

    setCurrentUser(newUser);
    return { success: true };
  };

  const updateProfile = (partial: Partial<User>): User | null => {
    if (!currentUser) return null;
    const updated = StorageService.updateUser(currentUser.id, partial);
    if (updated) {
      setCurrentUser(updated);
    }
    return updated;
  };

  const logout = () => {
    // Completely clear current authenticated user and session
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      StorageService.setCurrentUser(target, true);
      setCurrentUser(target);
    }
  };

  const isManager = currentUser?.role === 'manager';
  const isMember = currentUser?.role === 'member';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isManager,
        isMember,
        login,
        register,
        updateProfile,
        logout,
        switchUser,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
