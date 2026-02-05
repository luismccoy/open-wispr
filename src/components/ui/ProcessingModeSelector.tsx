/**
 * ProcessingModeSelector Component
 * 
 * A component for selecting between local (Whisper) and cloud (OpenAI) processing modes.
 */

import React from 'react';
import { Cloud, Cpu } from 'lucide-react';

interface ProcessingModeSelectorProps {
  useLocalWhisper: boolean;
  setUseLocalWhisper: (value: boolean) => void;
}

export default function ProcessingModeSelector({ 
  useLocalWhisper, 
  setUseLocalWhisper 
}: ProcessingModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => setUseLocalWhisper(true)}
        className={`
          p-4 rounded-xl border-2 text-left transition-all
          ${useLocalWhisper 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
          }
        `}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${useLocalWhisper ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Cpu className={`w-5 h-5 ${useLocalWhisper ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
          <span className="font-semibold">Local Processing</span>
        </div>
        <p className="text-sm text-gray-600">
          Process speech on your device using Whisper. 
          More private, works offline.
        </p>
      </button>

      <button
        type="button"
        onClick={() => setUseLocalWhisper(false)}
        className={`
          p-4 rounded-xl border-2 text-left transition-all
          ${!useLocalWhisper 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
          }
        `}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${!useLocalWhisper ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Cloud className={`w-5 h-5 ${!useLocalWhisper ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
          <span className="font-semibold">Cloud Processing</span>
        </div>
        <p className="text-sm text-gray-600">
          Use OpenAI's servers for transcription. 
          Faster, more accurate, requires API key.
        </p>
      </button>
    </div>
  );
}
