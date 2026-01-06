import { useState } from 'react';
import { Bike, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Label } from './ui/label';

interface LoginPageProps {
  onNavigate: (page: 'landing' | 'register' | 'dashboard') => void;
  onLogin: () => void;
}

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // For demo purposes, accept any credentials
      if (email && password) {
        onLogin();
      } else {
        setError('Email ou mot de passe incorrect');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Bike className="w-12 h-12 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">VéloStation</h1>
                <p className="text-sm text-gray-500">Plateforme d'Analyse de Données</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Bienvenue sur votre tableau de bord
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Accédez à vos analyses en temps réel et optimisez votre réseau de vélos partagés.
            </p>
          </div>
          
          <div className="relative">
            <img 
              src="/src/assets/img/about/about-4/about-img.svg" 
              alt="Analytics"
              className="w-full"
            />
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div>
          <Card className="p-8 lg:p-12 shadow-2xl">
            <div className="lg:hidden mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Bike className="w-10 h-10 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">VéloStation</h1>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h2>
              <p className="text-gray-600">
                Connectez-vous pour accéder à votre tableau de bord
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-700 mb-2 block">
                  Adresse e-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password" className="text-gray-700">
                    Mot de passe
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={loading}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Vous n'avez pas de compte ?{' '}
                <button
                  onClick={() => onNavigate('register')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  S'inscrire
                </button>
              </p>
            </div>

            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={() => onNavigate('landing')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
