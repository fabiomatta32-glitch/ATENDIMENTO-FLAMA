
import React from 'react';
import { Department } from '../types';

interface DepartmentGridProps {
  onSelect: (dept: Department) => void;
}

const departments = [
  { 
    id: Department.ACADEMIC, 
    icon: '🎓', 
    desc: 'Notas, faltas e documentos acadêmicos',
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    id: Department.FINANCIAL, 
    icon: '💰', 
    desc: 'Mensalidades, boletos e negociações',
    color: 'bg-green-100 text-green-600'
  },
  { 
    id: Department.SUPPORT, 
    icon: '💻', 
    desc: 'Acesso ao portal e problemas técnicos',
    color: 'bg-purple-100 text-purple-600'
  },
  { 
    id: Department.ADMISSIONS, 
    icon: '📝', 
    desc: 'Novas matrículas e transferências',
    color: 'bg-orange-100 text-orange-600'
  },
  { 
    id: Department.GENERAL, 
    icon: 'ℹ️', 
    desc: 'Dúvidas gerais e informações da escola',
    color: 'bg-gray-100 text-gray-600'
  }
];

export const DepartmentGrid: React.FC<DepartmentGridProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
      {departments.map((dept) => (
        <button
          key={dept.id}
          onClick={() => onSelect(dept.id)}
          className="flex items-start p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
        >
          <div className={`${dept.color} w-12 h-12 flex items-center justify-center rounded-lg text-2xl mr-4 group-hover:scale-110 transition-transform`}>
            {dept.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{dept.id}</h3>
            <p className="text-sm text-gray-500 mt-1">{dept.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
};
