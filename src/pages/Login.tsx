
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO } from '@/components/shared/SEO';
import { Car } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

      <SEO
        title="Iniciar Sesión"
        description="Accede al sistema de gestión de remisería. Controla viajes, choferes y pasajeros desde un solo lugar."
        noindex={false}
      />
      <Card className="w-full max-w-sm glass-card border-border shadow-2xl relative z-10 card-hover">
        <CardHeader className="space-y-1">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl text-center font-bold tracking-tight">Iniciar Sesión</CardTitle>
          <p className="text-sm text-center text-muted-foreground">
            Ingresa tus credenciales para continuar
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive font-medium text-center">{error}</p>}
            <Button type="submit" className="w-full btn-hover">
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
