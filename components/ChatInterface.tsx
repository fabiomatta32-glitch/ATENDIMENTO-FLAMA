
import React, { useState, useRef, useEffect } from 'react';
import { Message, Department, ChatSession, MessageRole } from '../types';
import { createLiveSession } from '../services/gemini';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audio';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, role?: MessageRole, skipBot?: boolean, metadata?: any) => void;
  isTyping: boolean;
  onTransfer: () => void;
  department: Department | null;
  archivedSessions?: ChatSession[];
  status?: 'idle' | 'bot' | 'waiting_human' | 'human';
}

const DEFAULT_ACTIONS: Record<string, string[]> = {
  [Department.ACADEMIC]: ["Calendário de Provas", "Recuperação", "Média Escolar", "Falar com Atendente"],
  [Department.FINANCIAL]: ["Chave PIX", "Segunda via de boleto", "Consultar Mensalidade", "Falar com Atendente"],
  [Department.SUPPORT]: ["Google Classroom", "Redefinir Senha", "E-mail Institucional", "Falar com Atendente"],
  [Department.ADMISSIONS]: ["Agendar Visita", "Valores 2024", "Documentos Matrícula", "Falar com Atendente"],
  [Department.GENERAL]: ["Horários", "Uniforme", "Cardápio Cantina", "Falar com Atendente"]
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isTyping, 
  onTransfer,
  department,
  archivedSessions = [],
  status
}) => {
  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<ChatSession | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [feedback, setFeedback] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const audioContextsRef = useRef<{ input?: AudioContext, output?: AudioContext }>({});
  
  // Buffers para consolidar a transcrição da rodada de voz
  const userTranscriptionBuffer = useRef('');
  const botTranscriptionBuffer = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!selectedArchive) scrollToBottom();
  }, [messages, isTyping, status, liveTranscription]);

  const showFeedback = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const toggleLive = async () => {
    if (isLiveActive) {
      stopLive();
      showFeedback("Conversa por voz encerrada", "info");
      return;
    }
    
    if (!department) return;

    try {
      setIsLiveActive(true);
      userTranscriptionBuffer.current = '';
      botTranscriptionBuffer.current = '';
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = createLiveSession(department, {
        onAudioChunk: async (base64) => {
          const ctx = outputCtx;
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
          const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
        },
        onTranscription: (text, isUser) => {
          if (isUser) {
            userTranscriptionBuffer.current += text;
            setLiveTranscription(`🗣️ ${userTranscriptionBuffer.current}`);
          } else {
            botTranscriptionBuffer.current += text;
            setLiveTranscription(`🤖 ${botTranscriptionBuffer.current}`);
          }
        },
        onTurnComplete: () => {
          // Salva as transcrições no histórico de mensagens da aplicação
          if (userTranscriptionBuffer.current.trim()) {
            onSendMessage(
              userTranscriptionBuffer.current.trim(), 
              'user', 
              true, 
              { isVoice: true, audioTranscription: userTranscriptionBuffer.current.trim() }
            );
          }
          if (botTranscriptionBuffer.current.trim()) {
            onSendMessage(
              botTranscriptionBuffer.current.trim(), 
              'bot', 
              true, 
              { isVoice: true, audioTranscription: botTranscriptionBuffer.current.trim() }
            );
          }
          
          userTranscriptionBuffer.current = '';
          botTranscriptionBuffer.current = '';
          setLiveTranscription('');
        },
        onError: (err) => {
          console.error(err);
          stopLive();
          showFeedback("Erro na conexão de voz", "error");
        }
      });

      liveSessionRef.current = sessionPromise;
      
      sessionPromise.then(session => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          if (isLiveActive) {
            session.sendRealtimeInput({ media: createPcmBlob(e.inputBuffer.getChannelData(0)) });
          }
        };
        source.connect(processor);
        processor.connect(inputCtx.destination);
        showFeedback("Microfone ativado", "success");
      });
    } catch (err) {
      console.error(err);
      setIsLiveActive(false);
      showFeedback("Permissão de microfone negada", "error");
    }
  };

  const stopLive = () => {
    liveSessionRef.current?.then((s: any) => s.close());
    audioContextsRef.current.input?.close();
    audioContextsRef.current.output?.close();
    setIsLiveActive(false);
    setLiveTranscription('');
  };

  const handleSend = (text: string, e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim()) { 
      onSendMessage(text); 
      setInputText(''); 
      setFeedback({ text: "Mensagem enviada", type: "success" });
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const currentActions = (lastMessage?.suggestedActions && lastMessage.suggestedActions.length > 0) 
    ? lastMessage.suggestedActions 
    : (department ? DEFAULT_ACTIONS[department] : []);

  const displayMessages = selectedArchive ? selectedArchive.messages : messages;

  return (
    <div className="flex-1 flex flex-col bg-[#e5ddd5] overflow-hidden relative">
      {/* Indicador de Feedback */}
      {feedback && (
        <div className={`absolute top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-widest transition-all animate-bounce ${
          feedback.type === 'error' ? 'bg-red-500 text-white' : 
          feedback.type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          {feedback.text}
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-sm p-3 flex items-center justify-between border-b shadow-sm z-10">
        <h3 className="text-xs font-black text-[#075e54] uppercase tracking-widest flex items-center">
          {selectedArchive ? 'Histórico de Atendimento' : 'Atendimento Flama Digital'}
          {isLiveActive && (
            <span className="ml-3 flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </h3>
        <button onClick={() => setShowHistory(!showHistory)} className="text-gray-400 hover:text-theme-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-2">
        {displayMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm animate-fade-in ${msg.role === 'user' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none border border-gray-100'}`}>
              <div className="flex items-center space-x-2 mb-1">
                {msg.metadata?.isVoice && (
                  <span className="text-[10px] bg-black/5 px-1.5 py-0.5 rounded text-gray-500 font-bold uppercase flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    Voz
                  </span>
                )}
              </div>
              <div className="text-sm md:text-base text-gray-800 leading-relaxed">{msg.text}</div>
              <div className="text-[9px] text-gray-400 text-right mt-1 font-bold uppercase">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
        {isTyping && <div className="bg-white px-4 py-2 rounded-full shadow-sm w-fit text-xs font-bold text-gray-400 animate-pulse italic">Digitando...</div>}
        
        {/* Transcrição ao vivo flutuante */}
        {liveTranscription && (
          <div className="flex justify-center my-4 sticky bottom-4 z-20">
            <div className="bg-black/80 backdrop-blur-md text-white text-xs px-6 py-3 rounded-full font-medium max-w-[90%] text-center border border-white/20 shadow-2xl flex items-center space-x-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="truncate">{liveTranscription}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!selectedArchive && status !== 'waiting_human' && !isTyping && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {currentActions.slice(0, 4).map((action, i) => (
            <button key={i} onClick={() => handleSend(action)} className="bg-white/80 backdrop-blur-md border border-theme-primary/20 text-theme-primary text-[10px] font-black uppercase px-4 py-2 rounded-full shadow-sm hover:bg-theme-primary hover:text-white transition-all transform active:scale-95">
              {action}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white p-4 border-t shadow-2xl relative">
        {/* Overlay de gravação ativa na barra de entrada */}
        {isLiveActive && (
          <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-red-500 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-t-xl animate-pulse shadow-lg flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="10" r="5" />
              </svg>
              <span>Escuta Ativa</span>
            </div>
          </div>
        )}

        <form onSubmit={(e) => handleSend(inputText, e)} className="flex items-center space-x-3">
          <button 
            type="button" 
            onClick={toggleLive} 
            className={`p-3 rounded-2xl transition-all relative group shadow-sm ${
              isLiveActive 
                ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-300 ring-4 ring-red-100 scale-110 z-30' 
                : 'bg-gray-100 text-gray-400 hover:bg-theme-primary hover:text-white hover:scale-105'
            }`}
            title={isLiveActive ? "Encerrar Chat por Voz" : "Iniciar Atendimento por Voz"}
          >
            {isLiveActive ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
            {isLiveActive && (
               <span className="absolute -top-1 -right-1 flex h-4 w-4">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-4 w-4 bg-white shadow-sm border border-red-200"></span>
               </span>
            )}
          </button>

          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isLiveActive ? "Modo de voz ativo..." : "Digite sua mensagem..."}
            className={`flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-theme-primary transition-all outline-none ${
              isLiveActive ? 'placeholder-red-400 text-red-900 bg-red-50/50' : ''
            }`}
            disabled={status === 'waiting_human'}
          />

          <button 
            type="submit" 
            disabled={!inputText.trim() || status === 'waiting_human' || isLiveActive}
            className={`p-3 rounded-2xl shadow-lg transition-all transform active:scale-90 ${
              inputText.trim() && !isLiveActive
                ? 'bg-theme-primary text-white shadow-theme-primary/20 hover:scale-105' 
                : 'bg-gray-100 text-gray-300 shadow-none opacity-50 cursor-not-allowed'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
