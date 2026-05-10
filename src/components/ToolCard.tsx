import { Link } from 'react-router-dom';

export interface ToolCardData {
  id: string;
  path: string;
  icon: string;
  title: string;
  description: string;
  category: 'organize' | 'convert' | 'security' | 'edit' | 'other';
  color: string;
}

interface ToolCardProps {
  tool: ToolCardData;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      to={tool.path}
      className="group flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-red-700"
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl ${tool.color} transition-transform group-hover:scale-110`}
      >
        {tool.icon}
      </div>
      <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">{tool.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
    </Link>
  );
}
