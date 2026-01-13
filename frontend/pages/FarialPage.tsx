import React from 'react';
import { VeloHeader } from '../shared/components/Header';
import { useLandingStyles } from '../shared/hooks/useLandingStyles';
import { ArrowLeft, Github, Linkedin, Mail, MapPin, Briefcase } from 'lucide-react';
// import farialImg from '../assets/images/img/farial.png'; // Commented out until file exists

interface FarialPageProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'dashboard' | 'farial') => void;
}

export const FarialPage: React.FC<FarialPageProps> = ({ onNavigate }) => {
  useLandingStyles();

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '0 2rem', 
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.12)'
      }}>
        <div style={{ paddingTop: '0.75rem' }}>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: 'white',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '999px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              fontWeight: 600,
              color: '#4B5563'
            }}
          >
            <ArrowLeft size={18} />
            Retour
          </button>
        </div>
        <VeloHeader onNavigate={onNavigate} isAuthenticated={false} onLogout={() => {}} />
      </div>

      <div style={{ 
        flex: 1, 
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '30px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 400px) 1fr',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '1100px',
          minHeight: '600px',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          {/* Sidebar / Image Section */}
          <div style={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)',
            padding: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
            position: 'relative'
          }}>
             <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'white',
                padding: '5px',
                marginBottom: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
             }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundImage: 'url("/Data-Analysis-Dashboard/assets/img/farial.png")', 
                    backgroundColor: '#e2e8f0', // Fallback color
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }} />
             </div>

             <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Farial Huda</h1>
             <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2rem' }}>Développeur Full-Stack</p>

             <div style={{ display: 'flex', gap: '1rem' }}>
                <SocialButton icon={<Github />} />
                <SocialButton icon={<Linkedin />} />
                <SocialButton icon={<Mail />} />
             </div>
          </div>

          {/* Content Section */}
          <div style={{ padding: '4rem' }}>
            <div style={{ marginBottom: '3rem' }}>
               <h2 style={{ fontSize: '2rem', color: '#1a202c', marginBottom: '1.5rem', fontWeight: 700 }}>Discours de motivation - Projet Vélib’ Métropole</h2>
               <div style={{ lineHeight: 1.8, color: '#4a5568', fontSize: '1.1rem' }}>
                 <p style={{ marginBottom: '1rem' }}>
                   Bonjour,<br/>
                   Je souhaite m’investir pleinement dans ce projet d’analyse, d’optimisation et de supervision du réseau Vélib’ Métropole, car il se situe exactement à la croisée de ce qui me motive le plus en tant que développeur full-stack : la donnée, la performance des systèmes, et l’impact concret sur la vie quotidienne des usagers.
                 </p>
                 <p style={{ marginBottom: '1rem' }}>
                   Vélib’ Métropole n’est pas seulement un service de mobilité ; c’est aujourd’hui une infrastructure essentielle du quotidien urbain. La disponibilité des vélos, la fiabilité des stations et la capacité à anticiper les problèmes ont un impact direct sur l’expérience des utilisateurs et sur l’image du service. Contribuer à améliorer cette qualité de service grâce à la donnée est pour moi un enjeu technique autant que sociétal.
                 </p>
                 
                 <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Ce projet répond à des problématiques que je considère centrales dans les systèmes modernes :</p>
                 <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                   <li>l’exploitation de flux de données temps réel,</li>
                   <li>la structuration et l’historisation de données volumineuses,</li>
                   <li>la détection automatique d’anomalies,</li>
                   <li>la visualisation claire pour des profils métiers non techniques,</li>
                   <li>et l’intégration de modèles prédictifs pour anticiper plutôt que subir.</li>
                 </ul>

                 <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>En tant que développeur full-stack, mon objectif est d’apporter une vision globale et cohérente de la solution :</p>
                 <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                   <li>côté backend, en construisant des pipelines robustes, des APIs fiables et des systèmes capables de monter en charge,</li>
                   <li>côté data, en garantissant la qualité, la traçabilité et la réutilisabilité des données,</li>
                   <li>côté frontend, en proposant des tableaux de bord clairs, exploitables et orientés décision,</li>
                   <li>et enfin, sur l’ensemble du système, en veillant à la maintenabilité, la sécurité et la reproductibilité.</li>
                 </ul>

                 <p style={{ marginBottom: '1rem' }}>
                   Ce qui me motive particulièrement dans ce projet, c’est sa progressivité : partir d’un état initial sans outils centralisés pour aller vers une plateforme complète, modulaire et réutilisable. Cette approche permet non seulement de répondre aux besoins immédiats, mais aussi de poser un socle technique solide pour les projets futurs.
                 </p>

                 <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Je vois ce projet comme une opportunité de :</p>
                 <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                   <li>transformer des données ouvertes brutes en valeur opérationnelle,</li>
                   <li>aider les équipes à prendre de meilleures décisions,</li>
                   <li>réduire concrètement les stations vides ou saturées,</li>
                   <li>et démontrer qu’une architecture bien pensée peut améliorer durablement un service public à grande échelle.</li>
                 </ul>

                 <p style={{ marginBottom: '1rem' }}>
                   Enfin, je suis motivé par la dimension collaborative du projet. Travailler avec des profils data, exploitation et support dans une logique transverse est essentiel pour concevoir une solution réellement utile et adoptée. Mon ambition est de jouer un rôle actif dans cette collaboration, en faisant le lien entre les besoins métiers et les choix techniques.
                 </p>
                 
                 <p>
                   Pour toutes ces raisons, je suis pleinement engagé à contribuer à la réussite de ce projet, avec une approche rigoureuse, pragmatique et orientée impact.
                 </p>
               </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
               <h2 style={{ fontSize: '1.5rem', color: '#1a202c', marginBottom: '1.5rem', fontWeight: 600 }}>Compétences</h2>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                 {['React', 'Django', 'Python', 'TypeScript', 'Data Analysis', 'PostgreSQL', 'Docker'].map((skill) => (
                   <span key={skill} style={{
                     padding: '0.5rem 1.25rem',
                     background: '#f3f4f6',
                     color: '#4b5563',
                     borderRadius: '20px',
                     fontSize: '0.95rem',
                     fontWeight: 500
                   }}>
                     {skill}
                   </span>
                 ))}
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
               <InfoCard icon={<MapPin size={24} />} title="Location" value="Paris, France" />
               <InfoCard icon={<Briefcase size={24} />} title="Expérience" value="3+ Ans" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialButton = ({ icon }: { icon: React.ReactNode }) => (
  <button style={{
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(5px)'
  }}>
    {icon}
  </button>
);

const InfoCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{
      padding: '0.75rem',
      background: '#ebf4ff',
      color: '#3182ce',
      borderRadius: '12px'
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '0.25rem' }}>{title}</h3>
      <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2d3748' }}>{value}</p>
    </div>
  </div>
);
