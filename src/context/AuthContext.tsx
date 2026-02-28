
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import accounts from '@/data/usuarios.json';

interface User {
  id: number;
  nombre: string;
  usuario: string;
  rol: 'dueño' | 'telefonista';
  telefonistaId?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username, password) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback((username, password) => {
    const account = accounts.find(
      (acc) => acc.usuario === username && acc.contraseña === password
    );
    if (account) {
      const userData: User = {
        id: account.id,
        nombre: account.nombre,
        usuario: account.usuario,
        rol: account.rol as 'dueño' | 'telefonista',
        telefonistaId: account.telefonistaId,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
