
import React, { useState } from 'react';

interface PhoneRegistrationProps {
  initialPhone?: string;
  onSave: (phone: string) => void;
}

export const PhoneRegistration: React.FC<PhoneRegistrationProps> = ({ initialPhone, onSave }) => {
  const [phone, setPhone] = useState(initialPhone || '');
  const [isEditing, setIsEditing] = useState(!initialPhone);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return value;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSave = () => {
    if (phone.length >= 14) {
      onSave(phone);
      setIsEditing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white border border-gray-100 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Vincular WhatsApp</h4>
            <p className="text-xs text-gray-500">Para notificações e histórico de atendimento</p>
          </div>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            Alterar
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="flex space-x-2 mt-3">
          <input
            type="text"
            value={phone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
          />
          <button
            onClick={handleSave}
            disabled={phone.length < 14}
            className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all ${
              phone.length >= 14 ? 'bg-[#00a884] hover:bg-[#008f6f]' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Salvar
          </button>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between bg-green-50/50 p-3 rounded-lg border border-green-100">
          <span className="text-sm font-medium text-gray-700">{phone}</span>
          <div className="flex items-center text-green-600 space-x-1">
            <span className="text-[10px] font-bold uppercase">Vinculado</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
