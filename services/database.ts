
import { Department, AttendantConfig } from "../types";
import { supabase } from "./supabase";

export interface KnowledgeEntry {
  id: string;
  topic: string;
  content: string;
  keywords: string;
  department: Department;
}

export interface ChatLogEntry {
  id: string;
  session_id: string;
  role: string;
  text: string;
  timestamp: string;
  department: string;
}

class SupabaseDatabase {

  // ─────────────────────────────────────────
  // Conhecimento
  // ─────────────────────────────────────────

  public async getKnowledge(): Promise<Record<Department, KnowledgeEntry[]>> {
    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[DB] getKnowledge error:', error.message);
      // Retorna estrutura vazia para não quebrar a UI
      const result: any = {};
      Object.values(Department).forEach(dept => { result[dept] = []; });
      return result;
    }

    const result: any = {};
    Object.values(Department).forEach(dept => {
      result[dept] = (data || []).filter(e => e.department === dept);
    });
    return result;
  }

  public async addKnowledge(dept: Department, entry: Omit<KnowledgeEntry, 'id' | 'department'>) {
    const { error } = await supabase
      .from('knowledge_entries')
      .insert({ ...entry, department: dept });

    if (error) console.error('[DB] addKnowledge error:', error.message);
  }

  public async deleteKnowledge(id: string) {
    const { error } = await supabase
      .from('knowledge_entries')
      .delete()
      .eq('id', id);

    if (error) console.error('[DB] deleteKnowledge error:', error.message);
  }

  public async searchKnowledge(dept: Department, query: string): Promise<string> {
    const q = query.toLowerCase();
    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('topic, content, keywords')
      .eq('department', dept);

    if (error) {
      console.error('[DB] searchKnowledge error:', error.message);
      return "";
    }

    const matches = (data || []).filter(e =>
      e.topic.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.keywords.toLowerCase().includes(q)
    );

    if (matches.length === 0) return "";
    return matches.map(m => `Tópico: ${m.topic} - Info: ${m.content}`).join("\n");
  }

  // ─────────────────────────────────────────
  // Atendentes
  // ─────────────────────────────────────────

  public async getAttendants(): Promise<AttendantConfig[]> {
    const { data, error } = await supabase
      .from('attendants')
      .select('department, name, phone')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[DB] getAttendants error:', error.message);
      return [{ department: Department.GENERAL, name: "Secretaria Geral", phone: "(11) 98765-4321" }];
    }

    return (data || []) as AttendantConfig[];
  }

  public async saveAttendants(configs: AttendantConfig[]) {
    // Upsert (insert ou update) baseado no campo department (unique)
    const rows = configs.map(c => ({ department: c.department, name: c.name, phone: c.phone }));
    const { error } = await supabase
      .from('attendants')
      .upsert(rows, { onConflict: 'department' });

    if (error) console.error('[DB] saveAttendants error:', error.message);
  }

  // ─────────────────────────────────────────
  // Logs de chat
  // ─────────────────────────────────────────

  public async logMessage(sessionId: string, role: string, text: string, department: string) {
    const { error } = await supabase
      .from('chat_logs')
      .insert({ session_id: sessionId, role, text, department });

    if (error) console.error('[DB] logMessage error:', error.message);
  }

  public async getLogs(): Promise<ChatLogEntry[]> {
    const { data, error } = await supabase
      .from('chat_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[DB] getLogs error:', error.message);
      return [];
    }

    return (data || []).map(r => ({
      id: r.id,
      session_id: r.session_id,
      role: r.role,
      text: r.text,
      timestamp: r.timestamp,
      department: r.department,
    }));
  }

  public async clearLogs() {
    const { error } = await supabase
      .from('chat_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // deleta tudo

    if (error) console.error('[DB] clearLogs error:', error.message);
  }

  // ─────────────────────────────────────────
  // Exportação (mantida para compatibilidade)
  // ─────────────────────────────────────────

  public async exportDatabase() {
    const [knowledge, attendants, logs] = await Promise.all([
      supabase.from('knowledge_entries').select('*'),
      supabase.from('attendants').select('*'),
      supabase.from('chat_logs').select('*').order('timestamp', { ascending: false }).limit(500),
    ]);

    const fullData = {
      knowledge: knowledge.data || [],
      attendants: attendants.data || [],
      logs: logs.data || [],
    };

    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_flama_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const dbService = new SupabaseDatabase();

export const getKnowledgeBase = () => dbService.getKnowledge();

export const getContextForDepartment = async (dept: Department, query: string): Promise<string> => {
  return await dbService.searchKnowledge(dept, query);
};
