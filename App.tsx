
import React, { useState, useEffect } from 'react';
import { Department, ChatSession, Message, AttendantConfig, ThemeConfig, MessageRole } from './types';
import { generateBotResponse } from './services/gemini';
import { DepartmentGrid } from './components/DepartmentGrid';
import { ChatInterface } from './components/ChatInterface';
import { Header } from './components/Header';
import { AdminPanel } from './components/AdminPanel';
import { dbService } from './services/database';

const STORAGE_KEY = 'colegio_flama_session_v7';
const THEME_KEY = 'colegio_flama_theme_v3';

const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved ? JSON.parse(saved) : { 
      primary: '#075e54', 
      secondary: '#e21a2c'
    };
  });

  const [session, setSession] = useState<ChatSession>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.messages = parsed.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        return parsed;
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return {
      id: Math.random().toString(36).substr(2, 9),
      department: null,
      messages: [],
      isHumanSupport: false,
      status: 'idle'
    };
  });

  const [attendants, setAttendants] = useState<AttendantConfig[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      const dbAttendants = await dbService.getAttendants();
      setAttendants(dbAttendants);
      setIsLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  }, [theme]);

  const handleSelectDepartment = async (dept: Department) => {
    const initialMessage: Message = {
      id: 'system-' + Date.now(),
      role: 'bot',
      text: `Olá! Bem-vindo ao setor: ${dept}. Sou o assistente digital do Colégio Flama. Como posso te auxiliar hoje?`,
      timestamp: new Date(),
      department: dept
    };

    const newSession: ChatSession = {
      id: Math.random().toString(36).substr(2, 9),
      department: dept,
      status: 'bot',
      messages: [initialMessage],
      isHumanSupport: false
    };

    setSession(newSession);
    dbService.logMessage(newSession.id, 'bot', initialMessage.text, dept);
  };

  const clearSession = () => {
    setSession({
      id: Math.random().toString(36).substr(2, 9),
      department: null,
      messages: [],
      isHumanSupport: false,
      status: 'idle'
    });
  };

  const sendMessage = async (text: string, role: MessageRole = 'user', skipBot: boolean = false, metadata?: any) => {
    if (!text.trim()) return;

    const msg: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      role,
      text,
      timestamp: new Date(),
      metadata
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, msg]
    }));

    dbService.logMessage(session.id, role, text, session.department || 'GENERAL');

    if (session.status === 'bot' && !skipBot && role === 'user') {
      setIsTyping(true);
      
      const lowerText = text.toLowerCase();
      const transferTriggers = ['humano', 'atendente', 'pessoa', 'falar com', 'whatsapp', 'atendimento', 'urgente', 'ajuda'];
      const shouldTransfer = transferTriggers.some(trigger => lowerText.includes(trigger));

      if (shouldTransfer) {
        setTimeout(() => {
          transferToHuman();
          setIsTyping(false);
        }, 800);
        return;
      }

      const history = session.messages.slice(-6).map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        text: m.text
      }));

      const botResult = await generateBotResponse(text, history, session.department!);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: botResult.text,
        suggestedActions: botResult.actions,
        timestamp: new Date()
      };

      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, botMsg]
      }));

      dbService.logMessage(session.id, 'bot', botMsg.text, session.department || 'GENERAL');
      setIsTyping(false);
    }
  };

  const transferToHuman = () => {
    const attendant = attendants.find(a => a.department === session.department) || attendants.find(a => a.department === Department.GENERAL);
    const attendantName = attendant ? attendant.name : 'Secretaria Flama';
    const attendantPhone = attendant ? attendant.phone.replace(/\D/g, '') : '';

    const transferMsg: Message = {
      id: 'system-transfer-' + Date.now(),
      role: 'system',
      text: `Entendo. Estou te conectando agora com ${attendantName} via WhatsApp para um atendimento personalizado.`,
      timestamp: new Date()
    };

    setSession(prev => ({
      ...prev,
      status: 'waiting_human',
      messages: [...prev.messages, transferMsg]
    }));

    dbService.logMessage(session.id, 'system', transferMsg.text, session.department || 'GENERAL');

    if (attendantPhone) {
      const cleanPhone = attendantPhone.length <= 11 ? `55${attendantPhone}` : attendantPhone;
      const lastQuestion = session.messages[session.messages.length - 1]?.text || "Gostaria de suporte.";
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Olá ${attendantName}, estou vindo da Central Flama e preciso de ajuda com: "${lastQuestion}"`)}`;
      
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        const humanJoined: Message = {
          id: 'system-joined-' + Date.now(),
          role: 'human',
          text: `Janela de chat externo aberta. Se preferir, aguarde aqui por uma resposta direta.`,
          timestamp: new Date()
        };
        setSession(prev => ({ ...prev, status: 'human', messages: [...prev.messages, humanJoined] }));
      }, 2000);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#075e54]">
      <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
      <span className="font-black text-white uppercase tracking-widest text-sm">Carregando Sistema Flama...</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto bg-white shadow-2xl relative overflow-hidden">
      <style>{`
        :root { --primary-color: ${theme.primary}; --secondary-color: ${theme.secondary}; }
        .bg-theme-primary { background-color: var(--primary-color); }
        .text-theme-primary { color: var(--primary-color); }
        .bg-theme-secondary { background-color: var(--secondary-color); }
        .text-theme-secondary { color: var(--secondary-color); }
      `}</style>
      
      <div className="whatsapp-bg"></div>
      
      <Header 
        status={session.status} 
        department={session.department} 
        onBack={() => setSession(prev => ({ ...prev, status: 'idle', department: null }))}
        onClear={clearSession}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-gray-50/50">
        {isAdminOpen ? (
          <AdminPanel 
            configs={attendants} 
            theme={theme}
            onSave={async (newAttendants) => {
              setAttendants(newAttendants);
              await dbService.saveAttendants(newAttendants);
            }}
            onSaveTheme={(newTheme) => setTheme(newTheme)}
            onClose={() => setIsAdminOpen(false)} 
          />
        ) : session.status === 'idle' ? (
          <div className="p-8 flex-1 flex flex-col justify-center items-center">
            <div className="text-center mb-12">
              <h1 className="text-7xl font-black text-gray-800 tracking-tighter uppercase leading-none mb-2">
                COLÉGIO <br/> <span className="text-theme-secondary">FLAMA</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Central de Atendimento</p>
              <div className="w-24 h-1.5 bg-theme-primary mx-auto mt-8 rounded-full"></div>
            </div>
            
            <div className="w-full max-w-3xl">
               <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-8 text-center border-b pb-4">Escolha um departamento</h3>
               <DepartmentGrid onSelect={handleSelectDepartment} />
            </div>
          </div>
        ) : (
          <ChatInterface 
            messages={session.messages} 
            onSendMessage={sendMessage} 
            isTyping={isTyping} 
            onTransfer={transferToHuman}
            department={session.department}
            status={session.status}
          />
        )}
      </main>

      <footer className="bg-white p-3 text-center border-t relative z-20 flex justify-between items-center px-8">
        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">
          Flama Desktop v1.8.0
        </span>
        <div className="flex items-center space-x-2">
           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
           <span className="text-[10px] text-gray-500 font-bold uppercase">Sistema Operacional</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
