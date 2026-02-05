/**
 * WhisperModelPicker Component
 * 
 * A component for selecting Whisper model variants for local speech-to-text processing.
 */

import React from 'react';

interface WhisperModelPickerProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  disabled?: boolean;
}

const WHISPER_MODELS = [
  { id: 'tiny', name: 'Tiny', size: '~75MB', description: 'Fastest, lowest accuracy' },
  { id: 'base', name: 'Base', size: '~150MB', description: 'Good balance of speed and accuracy' },
  { id: 'small', name: 'Small', size: '~500MB', description: 'Better accuracy, slower' },
  { id: 'medium', name: 'Medium', size: '~1.5GB', description: 'High accuracy, requires more resources' },
  { id: 'large', name: 'Large', size: '~3GB', description: 'Best accuracy, slowest' },
];

export default function WhisperModelPicker({ 
  selectedModel, 
  onModelSelect,
  disabled = false 
}: WhisperModelPickerProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Whisper Model
      </label>
      <div className="grid gap-2">
        {WHISPER_MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            disabled={disabled}
            onClick={() => onModelSelect(model.id)}
            className={`
              p-3 rounded-lg border text-left transition-colors
              ${selectedModel === model.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{model.name}</span>
              <span className="text-xs text-gray-500">{model.size}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{model.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
