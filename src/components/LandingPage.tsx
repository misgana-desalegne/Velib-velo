import { useState } from 'react';
import { Bike, ArrowRight, BarChart3, Map, TrendingUp, Shield, Users, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface LandingPageProps {
  onNavigate: (page: 'login' | 'register' | 'dashboard') => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header/Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bike className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">VéloStation</h1>
                <p className="text-xs text-gray-500">Analyse de Données</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => onNavigate('login')}>
                Connexion
              </Button>
              <Button onClick={() => onNavigate('register')}>
                S'inscrire
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block mb-4">
              <span className="bg-blue-100 text-blue-600 text-sm font-semibold px-4 py-2 rounded-full">
                🚴 Plateforme d'Analyse de Données
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Optimisez votre réseau de
              <span className="text-blue-600"> vélos partagés</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Analysez en temps réel les données de vos stations de vélos partagés. 
              Prenez des décisions éclairées grâce à des visualisations puissantes et des insights détaillés.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8" onClick={() => onNavigate('register')}>
                Commencer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => onNavigate('login')}>
                Voir la démo
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span>Temps réel</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>1500+ Stations</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative w-full aspect-square">
              <img 
                src="/src/assets/img/hero/hero-5/hero-img.svg" 
                alt="VéloStation Dashboard"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-10 right-10 bg-white p-4 rounded-xl shadow-2xl animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Utilisation</p>
                    <p className="text-2xl font-bold text-gray-900">+24%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités Principales
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète pour gérer et analyser votre réseau de vélos partagés
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Analyse en Temps Réel
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Surveillez l'état de toutes vos stations en temps réel avec des mises à jour automatiques toutes les 5 secondes.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Map className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Vue Cartographique
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Visualisez la répartition géographique de vos stations et identifiez les zones à optimiser.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Analyse Comportementale
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Comprenez les patterns d'utilisation quotidiens, hebdomadaires et mensuels de chaque station.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Bike className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Suivi des Vélos
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Surveillez la disponibilité des vélos et des emplacements pour optimiser la redistribution.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Alertes Intelligentes
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Recevez des notifications pour les stations critiques nécessitant une intervention immédiate.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Analyse par Arrondissement
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Comparez les performances entre différents arrondissements et zones géographiques.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold mb-2">1,500+</p>
              <p className="text-blue-100">Stations actives</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">20,000+</p>
              <p className="text-blue-100">Vélos disponibles</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">98.5%</p>
              <p className="text-blue-100">Taux de disponibilité</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">24/7</p>
              <p className="text-blue-100">Surveillance continue</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Prêt à optimiser votre réseau ?
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Rejoignez les gestionnaires de flottes qui utilisent VéloStation pour améliorer leurs opérations
        </p>
        <Button size="lg" className="text-lg px-8" onClick={() => onNavigate('register')}>
          Commencer maintenant
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Bike className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-xl font-bold">VéloStation</h3>
                <p className="text-sm text-gray-400">Analyse de Données</p>
              </div>
            </div>
            <div className="text-gray-400 text-sm">
              © 2026 VéloStation. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
