
import React, { useState, useEffect } from 'react';
import { Department, AttendantConfig, ThemeConfig } from '../types';
import { getKnowledgeBase, KnowledgeEntry, dbService, ChatLogEntry } from '../services/database';

interface AdminPanelProps {
  configs: AttendantConfig[];
  theme: ThemeConfig;
  onSave: (configs: AttendantConfig[]) => void;
  onSaveTheme: (theme: ThemeConfig) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ configs, theme, onSave, onSaveTheme, onClose }) => {
  const [activeTab, setActiveTab] = useState<'attendants' | 'knowledge' | 'logs' | 'theme'>('attendants');
  const [localConfigs, setLocalConfigs] = useState<AttendantConfig[]>(configs);
  const [localKB, setLocalKB] = useState<Record<Department, KnowledgeEntry[]>>({} as any);
  const [logs, setLogs] = useState<ChatLogEntry[]>([]);
  const [localTheme, setLocalTheme] = useState(theme);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newAttendant, setNewAttendant] = useState<AttendantConfig>({
    department: Department.GENERAL,
    name: '',
    phone: ''
  });

  const [newInfo, setNewInfo] = useState({
    topic: '',
    content: '',
    keywords: '',
    department: Department.GENERAL
  });

  useEffect(() => {
    const loadDB = async () => {
      const kb = await getKnowledgeBase();
      setLocalKB(kb);
      const dbLogs = await dbService.getLogs();
      setLogs(dbLogs);
      setIsLoading(false);
    };
    loadDB();
  }, [activeTab]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const handleAddAttendant = () => {
    if (newAttendant.name && newAttendant.phone.length >= 14) {
      setLocalConfigs([...localConfigs, newAttendant]);
      setNewAttendant({ department: Department.GENERAL, name: '', phone: '' });
    }
  };

  const handleAddInfo = async () => {
    if (newInfo.topic && newInfo.content) {
      await dbService.addKnowledge(newInfo.department, {
        topic: newInfo.topic,
        content: newInfo.content,
        keywords: newInfo.keywords
      });
      const updatedKB = await getKnowledgeBase();
      setLocalKB(updatedKB);
      setNewInfo({ topic: '', content: '', keywords: '', department: Department.GENERAL });
    }
  };

  const handleDeleteInfo = async (id: string) => {
    await dbService.deleteKnowledge(id);
    const updatedKB = await getKnowledgeBase();
    setLocalKB(updatedKB);
  };

  const handleSaveAll = () => {
    onSave(localConfigs);
    onSaveTheme(localTheme);
    onClose();
  };

  const clearAllLogs = async () => {
    if(confirm("Deseja apagar todos os registros de conversa?")) {
      await dbService.clearLogs();
      setLogs([]);
    }
  };

  if (isLoading) return <div className="p-20 text-center font-black text-gray-400">CARREGANDO DADOS...</div>;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-y-auto relative z-30 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Painel de <span className="text-theme-secondary">Gestão</span></h2>
          <p className="text-gray-500 text-sm italic">Configurações de Atendimento Escolar</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => dbService.exportDatabase()}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
            title="Exportar Dados"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setActiveTab('attendants')} className={`pb-3 px-4 text-[10px] font-black uppercase tracking-widest ${activeTab === 'attendants' ? 'border-b-4 border-theme-primary text-theme-primary' : 'text-gray-400'}`}>👤 Canais WhatsApp</button>
        <button onClick={() => setActiveTab('knowledge')} className={`pb-3 px-4 text-[10px] font-black uppercase tracking-widest ${activeTab === 'knowledge' ? 'border-b-4 border-theme-primary text-theme-primary' : 'text-gray-400'}`}>📖 Base Conhecimento</button>
        <button onClick={() => setActiveTab('logs')} className={`pb-3 px-4 text-[10px] font-black uppercase tracking-widest ${activeTab === 'logs' ? 'border-b-4 border-theme-primary text-theme-primary' : 'text-gray-400'}`}>📜 Auditoria Chat</button>
        <button onClick={() => setActiveTab('theme')} className={`pb-3 px-4 text-[10px] font-black uppercase tracking-widest ${activeTab === 'theme' ? 'border-b-4 border-theme-primary text-theme-primary' : 'text-gray-400'}`}>🎨 Personalização</button>
      </div>

      <div className="flex-1">
        {activeTab === 'attendants' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xs font-black text-theme-secondary uppercase tracking-widest mb-4">Novo Atendente</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select 
                  value={newAttendant.department}
                  onChange={(e) => setNewAttendant({...newAttendant, department: e.target.value as Department})}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.values(Department).map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
                <input 
                  type="text" 
                  value={newAttendant.name}
                  onChange={(e) => setNewAttendant({...newAttendant, name: e.target.value})}
                  placeholder="Nome do Atendente"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={newAttendant.phone}
                    onChange={(e) => setNewAttendant({...newAttendant, phone: formatPhone(e.target.value)})}
                    placeholder="(00) 00000-0000"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <button onClick={handleAddAttendant} className="bg-theme-primary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase">OK</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase">
                  <tr><th className="px-6 py-4">Setor</th><th className="px-6 py-4">Nome</th><th className="px-6 py-4">WhatsApp</th><th className="px-6 py-4"></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {localConfigs.map((config, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-bold">{config.department}</td>
                      <td className="px-6 py-4 text-sm">{config.name}</td>
                      <td className="px-6 py-4 text-sm font-mono text-green-600">{config.phone}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setLocalConfigs(localConfigs.filter((_, i) => i !== index))} className="text-red-400 uppercase text-[10px] font-black">Remover</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'knowledge' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xs font-black text-theme-secondary uppercase tracking-widest mb-4">Adicionar Informação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select 
                  value={newInfo.department}
                  onChange={(e) => setNewInfo({...newInfo, department: e.target.value as Department})}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.values(Department).map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
                <input 
                  type="text" 
                  value={newInfo.topic}
                  onChange={(e) => setNewInfo({...newInfo, topic: e.target.value})}
                  placeholder="Título"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <textarea 
                value={newInfo.content}
                onChange={(e) => setNewInfo({...newInfo, content: e.target.value})}
                placeholder="Conteúdo para o Chatbot..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4"
              />
              <button onClick={handleAddInfo} className="bg-theme-primary text-white py-2 px-6 rounded-lg text-xs font-bold uppercase">Salvar</button>
            </div>

            <div className="space-y-4">
              {(Object.entries(localKB) as [string, KnowledgeEntry[]][]).map(([dept, entries]) => (
                entries.length > 0 && (
                  <div key={dept} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{dept}</h4>
                    <div className="space-y-2">
                      {entries.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex-1 mr-4">
                            <p className="text-sm font-bold text-gray-800">{entry.topic}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{entry.content}</p>
                          </div>
                          <button onClick={() => handleDeleteInfo(entry.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        ) : activeTab === 'logs' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Logs de Interação</h3>
               <button onClick={clearAllLogs} className="text-[10px] font-black text-red-500 uppercase">Limpar Histórico</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="max-h-[600px] overflow-y-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 border-b sticky top-0 text-[10px] font-bold text-gray-400 uppercase">
                     <tr>
                       <th className="px-6 py-4">Data/Hora</th>
                       <th className="px-6 py-4">Sessão</th>
                       <th className="px-6 py-4">Ator</th>
                       <th className="px-6 py-4">Setor</th>
                       <th className="px-6 py-4">Mensagem</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 text-[11px]">
                     {logs.map((log) => (
                       <tr key={log.id} className="hover:bg-gray-50">
                         <td className="px-6 py-3 whitespace-nowrap text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                         <td className="px-6 py-3 font-mono text-gray-400">{log.session_id}</td>
                         <td className="px-6 py-3 uppercase font-black">
                           <span className={log.role === 'user' ? 'text-blue-600' : log.role === 'bot' ? 'text-green-600' : 'text-orange-600'}>
                             {log.role}
                           </span>
                         </td>
                         <td className="px-6 py-3 text-gray-500">{log.department}</td>
                         <td className="px-6 py-3 text-gray-800">{log.text}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h3 className="text-xs font-black text-theme-secondary uppercase tracking-widest">Aparência Visual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Cor Primária (Topo)</label>
                <div className="flex items-center space-x-4">
                  <input type="color" value={localTheme.primary} onChange={(e) => setLocalTheme({...localTheme, primary: e.target.value})} className="h-12 w-24 rounded-lg cursor-pointer border-none" />
                  <span className="text-sm font-mono text-gray-400">{localTheme.primary}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Cor Secundária (Destaques)</label>
                <div className="flex items-center space-x-4">
                  <input type="color" value={localTheme.secondary} onChange={(e) => setLocalTheme({...localTheme, secondary: e.target.value})} className="h-12 w-24 rounded-lg cursor-pointer border-none" />
                  <span className="text-sm font-mono text-gray-400">{localTheme.secondary}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-8 flex justify-end space-x-4 border-t border-gray-100">
        <button onClick={onClose} className="px-6 py-2 text-gray-400 font-bold uppercase text-[10px]">Fechar</button>
        <button onClick={handleSaveAll} className="bg-theme-primary text-white px-10 py-3 rounded-full font-black shadow-xl uppercase text-[10px] tracking-widest active:scale-95 transition-transform">
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};
