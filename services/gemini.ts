
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Department } from "../types";
import { getContextForDepartment } from "./database";

// Lê a chave pelo define customizado no Vite (process.env.API_KEY) ou meta.env caso alterado no futuro
const ai = new GoogleGenAI({ apiKey: (process as any)?.env?.API_KEY || (import.meta as any).env?.VITE_API_KEY || '' });

export const generateBotResponse = async (
  userMessage: string,
  history: { role: string; text: string }[],
  department: Department
): Promise<{ text: string; actions?: string[]; sources?: any[] }> => {
  try {
    const context = await getContextForDepartment(department, userMessage);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: history.map(h => ({
        parts: [{ text: h.text }],
        role: h.role === 'user' ? 'user' : 'model'
      })).concat([{
        parts: [{ text: userMessage }],
        role: 'user'
      }]),
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "A resposta textual para o usuário."
            },
            suggestedActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 2 a 4 frases curtas para botões de ação rápida."
            }
          },
          required: ["reply"]
        },
        systemInstruction: `Você é o Assistente Oficial do Colégio Flama (${department}).
        Use a base de conhecimento interna fornecida abaixo. 
        Se o usuário perguntar sobre datas externas (feriados, ENEM, notícias MEC), use a pesquisa do Google.
        
        BASE DE CONHECIMENTO INTERNA:
        ---
        ${context}
        ---

        DIRETRIZES:
        - Responda de forma executiva e acolhedora.
        - Priorize a base interna sobre a externa.
        - Sempre ofereça ajuda humana para casos financeiros ou acadêmicos críticos.`,
        temperature: 0.5,
      },
    });

    let data;
    const rawText = response.text || '';

    try {
      data = JSON.parse(rawText);
    } catch (e) {
      data = { reply: rawText, suggestedActions: [] };
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return {
      text: data.reply || "Desculpe, tive um problema ao processar sua solicitação.",
      actions: data.suggestedActions,
      sources: sources
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "Estamos com uma alta demanda no momento. Posso te transferir para um atendente humano agora mesmo?",
      actions: ["Sim, falar com humano", "Tentar novamente"]
    };
  }
};

export const createLiveSession = async (
  department: Department,
  callbacks: {
    onAudioChunk: (base64Audio: string) => void;
    onTranscription: (text: string, isUser: boolean) => void;
    onTurnComplete: () => void;
    onError: (e: any) => void;
  }
) => {
  const context = await getContextForDepartment(department, "");

  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => console.log('Live session opened'),
      onmessage: async (message) => {
        if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
          callbacks.onAudioChunk(message.serverContent.modelTurn.parts[0].inlineData.data);
        }
        if (message.serverContent?.outputTranscription) {
          callbacks.onTranscription(message.serverContent.outputTranscription.text ?? '', false);
        }
        if (message.serverContent?.inputTranscription) {
          callbacks.onTranscription(message.serverContent.inputTranscription.text ?? '', true);
        }
        if (message.serverContent?.turnComplete) {
          callbacks.onTurnComplete();
        }
      },
      onerror: callbacks.onError,
      onclose: () => console.log('Live session closed'),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: `Você é o atendente por voz do Colégio Flama (${department}). Seja conciso. Use a base interna de conhecimento: ${context}.`,
    },
  });
};
