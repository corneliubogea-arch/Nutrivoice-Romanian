import React, { useState } from 'react';
import { AudioSettings, DEFAULT_AUDIO_SETTINGS } from '../types';
import { Settings, X, Volume2, Mic, Activity, Zap } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AudioSettings;
  onSave: (settings: AudioSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AudioSettings>(currentSettings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_AUDIO_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Settings size={20} />
            <h2 className="text-lg font-semibold">Setări Audio</h2>
          </div>
          <button onClick={onClose} className="hover:bg-emerald-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Sensitivity Slider */}
          <div className="space-y-2">
            <label className="flex justify-between text-sm font-medium text-gray-700">
              <span className="flex items-center gap-2"><Zap size={16} className="text-emerald-500"/> Sensibilitate Microfon</span>
              <span className="text-emerald-600 font-bold">{Math.round(localSettings.sensitivity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localSettings.sensitivity}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, sensitivity: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <p className="text-xs text-gray-400">
              Reglează pragul de activare. O valoare mai mare captează sunete mai slabe.
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Reducere Zgomot</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.noiseSuppression}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, noiseSuppression: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Anulare Ecou</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.echoCancellation}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, echoCancellation: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Control Automat Volum</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoGainControl}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, autoGainControl: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Sample Rate */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Rată de Eșantionare (Hz)</label>
            <select
              value={localSettings.sampleRate}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, sampleRate: parseInt(e.target.value) }))}
              className="w-full p-2 border border-gray-200 rounded-lg bg-teal-50 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            >
              <option value="16000">16000 (Recomandat)</option>
              <option value="24000">24000</option>
              <option value="44100">44100</option>
              <option value="48000">48000</option>
            </select>
            <p className="text-xs text-gray-400">Modificarea acestei valori va reporni sesiunea.</p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-between">
           <button 
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-emerald-600 transition font-medium"
           >
             Resetează
           </button>
           <div className="flex gap-2">
             <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
             >
                Anulează
             </button>
             <button 
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition"
             >
                Salvează
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
