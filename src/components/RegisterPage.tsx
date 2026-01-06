import { useState } from 'react';
import { Bike, Mail, Lock, User, Building2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Label } from './ui/label';

interface RegisterPageProps {
  onNavigate: (page: 'landing' | 'login' | 'dashboard') => void;
  onRegister: () => void;
}

export function RegisterPage({ onNavigate, onRegister }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    organization: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onRegister();
    }, 1500);
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
              Rejoignez VéloStation aujourd'hui
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Créez votre compte et commencez à optimiser votre réseau de vélos partagés en quelques minutes.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Essai gratuit de 30 jours</p>
                  <p className="text-gray-600">Aucune carte de crédit requise</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Support 24/7</p>
                  <p className="text-gray-600">Notre équipe est là pour vous aider</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Analyses en temps réel</p>
                  <p className="text-gray-600">Surveillez vos stations instantanément</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img 
              src="/src/assets/img/hero/hero-5/hero-img.svg" 
              alt="Dashboard Preview"
              className="w-full"
            />
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div>
          <Card className="p-8 lg:p-12 shadow-2xl">
            <div className="lg:hidden mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Bike className="w-10 h-10 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">VéloStation</h1>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h2>
              <p className="text-gray-600">
                Commencez votre essai gratuit de 30 jours
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-700 mb-2 block">
                    Prénom *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Jean"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="pl-11 h-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-gray-700 mb-2 block">
                    Nom *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-700 mb-2 block">
                  Adresse e-mail *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-11 h-11"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="organization" className="text-gray-700 mb-2 block">
                  Organisation
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="organization"
                    type="text"
                    placeholder="Nom de votre entreprise"
                    value={formData.organization}
                    onChange={(e) => handleChange('organization', e.target.value)}
                    className="pl-11 h-11"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700 mb-2 block">
                  Mot de passe *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="pl-11 h-11"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700 mb-2 block">
                  Confirmer le mot de passe *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="pl-11 h-11"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                  J'accepte les{' '}
                  <button type="button" className="text-blue-600 hover:text-blue-700 font-semibold">
                    conditions d'utilisation
                  </button>{' '}
                  et la{' '}
                  <button type="button" className="text-blue-600 hover:text-blue-700 font-semibold">
                    politique de confidentialité
                  </button>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-lg"
                disabled={loading}
              >
                {loading ? 'Création du compte...' : 'Créer mon compte'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Vous avez déjà un compte ?{' '}
                <button
                  onClick={() => onNavigate('login')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Se connecter
                </button>
              </p>
            </div>

            <div className="mt-4">
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
