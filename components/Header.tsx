
import React from 'react';
import { Department } from '../types';

interface HeaderProps {
  status: string;
  department: Department | null;
  onBack: () => void;
  onClear?: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, department, onBack, onClear, onOpenAdmin }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'bot': return 'bg-green-500';
      case 'waiting_human': return 'bg-amber-500';
      case 'human': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getPulseColor = () => {
    switch (status) {
      case 'bot': return 'bg-green-400';
      case 'waiting_human': return 'bg-amber-400';
      case 'human': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <header className="text-white p-3 md:p-4 shadow-md flex items-center justify-between z-20" style={{ backgroundColor: 'var(--primary-color)' }}>
      <div className="flex items-center space-x-3">
        {department && (
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Voltar ao menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <div className="flex items-center space-x-3">
          {department ? (
            <div className="relative">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(department)}&background=128c7e&color=fff&bold=true`} 
                alt={department} 
                className="w-10 h-10 rounded-full border border-white/20 shadow-sm"
              />
              {status !== 'idle' && (
                <span className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor()} border-2 border-theme-primary rounded-full`}></span>
              )}
            </div>
          ) : (
            <div className="p-2 bg-white/10 rounded-full relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          <div className="overflow-hidden">
            <h2 className="font-bold text-base md:text-lg leading-tight truncate max-w-[180px] md:max-w-xs uppercase tracking-tight flex items-center">
              {department || "Colégio Flama"}
              <span className="ml-2 flex h-2 w-2 relative">
                {status !== 'idle' && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${getPulseColor()} opacity-75`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor()}`}></span>
              </span>
            </h2>
            <div className="flex items-center space-x-1.5">
              <p className="text-[10px] md:text-xs text-white/80 font-medium whitespace-nowrap">
                {status === 'idle' ? 'Central de Atendimento' : status === 'bot' ? 'Suporte Digital (IA)' : status === 'waiting_human' ? 'Conectando Humano...' : 'Suporte Humano Ativo'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        {onOpenAdmin && !department && (
          <button 
            onClick={onOpenAdmin}
            className="hover:bg-white/10 p-2 rounded-full text-white/70 hover:text-white transition-all mr-1"
            title="Configurações Administrativas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
        {onClear && (
          <button 
            onClick={() => {
              if(confirm('Deseja realmente limpar seu histórico do Colégio Flama?')) onClear();
            }} 
            className="hover:bg-red-500/20 p-2 rounded-full text-white/40 hover:text-white transition-all"
            title="Apagar dados"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
};
