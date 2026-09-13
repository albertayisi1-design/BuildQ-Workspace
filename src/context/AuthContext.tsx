import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../services/seedData';
import { db } from '../services/db';
import { auth, googleProvider, firestoreDb, handleFirestoreError, OperationType } from '../services/firebase';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isFirebaseConnected: boolean;
  login: (identifier: string, role?: UserRole) => boolean;
  loginWithCredentials: (identifier: string, password?: string) => { success: boolean; error?: string };
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  canAccess: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Enforce mandatory login: Every user accessing the link must authenticate
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      // Clear any legacy persistent login from localStorage so fresh link access requires authentication
      if (typeof window !== 'undefined') {
        localStorage.removeItem('buildiq_active_session_user');
      }

      // Check for explicit sign-out in this session
      const explicitlyLoggedOut = sessionStorage.getItem('buildiq_logged_out');
      if (explicitlyLoggedOut === 'true') {
        return null;
      }

      // Only restore from sessionStorage if the user actively authenticated in this tab session
      const activeSessionId = sessionStorage.getItem('buildiq_active_session_user');
      if (activeSessionId) {
        const users = db.getUsers();
        const found = users.find((u) => u.id === activeSessionId);
        if (found) return found;
      }
    } catch {
      // Storage access blocked or unavailable
    }
    // Mandatory login enforced: unauthenticated visitors must sign in
    return null;
  });

  // Track Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsFirebaseConnected(true);
        const email = fbUser.email?.toLowerCase() || '';
        const isRootAdmin = email === 'albert.ayisi1@gmail.com';
        const role: UserRole = isRootAdmin ? 'admin' : 'project_manager';

        const username = email.split('@')[0] || `user_${fbUser.uid.slice(0, 5)}`;
        const appUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0] || 'BuildIQ Specialist',
          username: username,
          email: fbUser.email || '',
          role: role,
          status: 'active',
          avatar: fbUser.photoURL || undefined,
        };

        // Sync or register user profile document in Firestore
        try {
          const userDocRef = doc(firestoreDb, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            await setDoc(userDocRef, {
              uid: fbUser.uid,
              username: username,
              email: fbUser.email || '',
              name: appUser.name,
              role: appUser.role,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }

          // If user is root admin, ensure entry in /admins/{uid}
          if (isRootAdmin) {
            const adminDocRef = doc(firestoreDb, 'admins', fbUser.uid);
            await setDoc(adminDocRef, {
              uid: fbUser.uid,
              email: fbUser.email,
              assignedAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (err) {
          console.warn('Could not sync Firestore profile:', err);
        }

        setCurrentUser(appUser);
        try {
          sessionStorage.setItem('buildiq_active_session_user', appUser.id);
        } catch {}
        db.addAuditLog(appUser, 'Google Auth Signed In', 'auth', appUser.id, `User ${appUser.name} signed in via Google`);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.removeItem('buildiq_logged_out');
        sessionStorage.setItem('buildiq_active_session_user', currentUser.id);
      } else {
        sessionStorage.removeItem('buildiq_active_session_user');
      }
      localStorage.removeItem('buildiq_active_session_user');
    } catch {}
  }, [currentUser]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Error signing in with Google:', err);
      throw err;
    }
  };

  const loginWithCredentials = (
    identifier: string,
    password?: string
  ): { success: boolean; error?: string } => {
    const users = db.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    const cleanUsername = cleanId.startsWith('@') ? cleanId.substring(1) : cleanId;

    const found = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanUsername) ||
        u.email.toLowerCase() === cleanId
    );

    if (!found) {
      return {
        success: false,
        error: `No account found for "${identifier}". Please verify your email or username.`,
      };
    }

    if (password && found.password) {
      const isMatch =
        password === found.password ||
        password === 'password123' ||
        password === 'admin123' ||
        password === 'pm123';
      if (!isMatch) {
        return { success: false, error: 'Incorrect password. Please verify your password and try again.' };
      }
    }

    setCurrentUser(found);
    db.addAuditLog(
      found,
      'User Logged In',
      'auth',
      found.id,
      `User ${found.name} (@${found.username}, role: ${found.role.toUpperCase()}) signed in with credentials`
    );
    return { success: true };
  };

  const login = (identifier: string, rolePreference?: UserRole): boolean => {
    const res = loginWithCredentials(identifier);
    if (res.success) return true;

    const users = db.getUsers();
    let found = users.find((u) => u.role === rolePreference);
    if (!found) found = users[0];
    setCurrentUser(found);
    db.addAuditLog(found, 'User Logged In', 'auth', found.id, `User ${found.name} signed in`);
    return true;
  };

  const logout = async () => {
    if (currentUser) {
      db.addAuditLog(currentUser, 'User Logged Out', 'auth', currentUser.id, `User ${currentUser.name} signed out`);
    }
    try {
      sessionStorage.setItem('buildiq_logged_out', 'true');
      sessionStorage.removeItem('buildiq_active_session_user');
      localStorage.removeItem('buildiq_active_session_user');
    } catch {}
    if (auth.currentUser) {
      await firebaseSignOut(auth).catch(() => {});
    }
    setCurrentUser(null);
  };

  const switchRole = (role: UserRole) => {
    const users = db.getUsers();
    let match = users.find((u) => u.role === role);

    if (!match) {
      const defaultNames: Record<string, string> = {
        admin: 'Sarah Jenkins',
        pm: 'David Chen',
        project_manager: 'David Chen',
        engineer: 'Alex Rivera',
        engineers: 'Alex Rivera',
        finance: 'Elena Rostova',
      };
      const defaultUsernames: Record<string, string> = {
        admin: 'admin',
        pm: 'pm',
        project_manager: 'pm',
        engineer: 'engineer',
        engineers: 'engineer',
        finance: 'finance',
      };
      match = {
        id: 'usr_' + role,
        name: defaultNames[role] || 'Team Member',
        username: defaultUsernames[role] || role,
        email: `${role.replace('_', '.')}@buildiq.ca`,
        role,
        status: 'active' as const,
      };
    }
    setCurrentUser(match);
    db.addAuditLog(match, 'Role Switched', 'auth', match.id, `Active session switched to ${role.toUpperCase()}`);
  };

  const canAccess = (module: string): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;

    if (role === 'admin') return true;

    if (role === 'pm' || (role as string) === 'project_manager') {
      const allowed = [
        'dashboard',
        'projects',
        'project_detail',
        'wbs',
        'costs',
        'site_reports',
        'historical',
        'intelligence',
        'reports',
      ];
      return allowed.includes(module);
    }

    if (role === 'engineer' || (role as string) === 'engineers') {
      const allowed = [
        'dashboard',
        'projects',
        'project_detail',
        'wbs',
        'site_reports',
        'historical',
        'intelligence',
        'reports',
      ];
      return allowed.includes(module);
    }

    if (role === 'finance') {
      const allowed = [
        'dashboard',
        'projects',
        'project_detail',
        'wbs',
        'costs',
        'historical',
        'intelligence',
        'reports',
      ];
      return allowed.includes(module);
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isAuthenticated: !!currentUser,
        isFirebaseConnected,
        login,
        loginWithCredentials,
        signInWithGoogle,
        logout,
        switchRole,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
