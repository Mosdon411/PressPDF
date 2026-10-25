import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, ShieldCheck, Zap, Sparkles, Minimize2 } from 'lucide-react';
import { CompressionPreset, CompressionSettings } from '../types';

interface PresetSelectorProps {
  settings: CompressionSettings;
  onChangeSettings: (settings: CompressionSettings) => void;
  disabled?: boolean;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  settings,
  onChangeSettings,
  disabled = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const presets: Array<{
    id: CompressionPreset;
    name: string;
    targetDpi: number;
    quality: number;
    description: string;
    icon: React.ReactNode;
    reductionEst: string;
  }> = [
    {
      id: 'archive',
      name: 'High Quality Archive',
      targetDpi: 200,
      quality: 0.88,
      description: 'Preserves sharp typography and rich image gradients (Recommended)',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
      reductionEst: '55% - 75% reduction',
    },
    {
      id: 'balanced',
      name: 'Balanced Web & Email',
      targetDpi: 150,
      quality: 0.80,
      description: 'Ideal for email attachments, contracts, and web distribution',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      reductionEst: '70% - 85% reduction',
    },
    {
      id: 'ultra',
      name: 'Ultra High Fidelity',
      targetDpi: 250,
      quality: 0.94,
      description: 'Maximum visual integrity for photography spreads & design proofs',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      reductionEst: '35% - 55% reduction',
    },
    {
      id: 'compact',
      name: 'Extreme Compact',
      targetDpi: 110,
      quality: 0.70,
      description: 'Tightest compression for portal upload limits under 5MB',
      icon: <Minimize2 className="w-4 h-4 text-rose-400" />,
      reductionEst: '80% - 90% reduction',
    },
  ];

  const handleSelectPreset = (p: typeof presets[number]) => {
    onChangeSettings({
      ...settings,
      preset: p.id,
      maxDpi: p.targetDpi,
      quality: p.quality,
    });
  };

  return (
    <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white">Compression Profile</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Intelligent bicubic resampling preserves sharp vector text and high-frequency photographic detail.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-colors shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Hide Fine Controls' : 'Custom Fine-Tuning'}</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {presets.map((preset) => {
          const isSelected = settings.preset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectPreset(preset)}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {preset.icon}
                  <span className="text-xs font-semibold text-white whitespace-nowrap">
                    {preset.name}
                  </span>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                )}
              </div>

              <p className="mt-2 text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {preset.description}
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono tabular-nums">{preset.targetDpi} DPI · {Math.round(preset.quality * 100)}% Q</span>
                <span className="font-mono tabular-nums text-slate-300">{preset.reductionEst}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Advanced Fine Controls Panel */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/40 p-4 rounded-lg">
          {/* Quality Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor="quality-slider" className="font-medium text-slate-300">
                JPEG Image Quality
              </label>
              <span className="font-mono tabular-nums text-indigo-400 font-semibold">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>
            <input
              id="quality-slider"
              type="range"
              min="50"
              max="98"
              step="2"
              disabled={disabled}
              value={Math.round(settings.quality * 100)}
              onChange={(e) => {
                onChangeSettings({
                  ...settings,
                  preset: 'custom',
                  quality: Number(e.target.value) / 100,
                });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Compact (50%)</span>
              <span>Balanced (80%)</span>
              <span>Ultra (98%)</span>
            </div>
          </div>

          {/* Target DPI Selector */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor="dpi-selector" className="font-medium text-slate-300">
                Resolution Ceiling (DPI)
              </label>
              <span className="font-mono tabular-nums text-indigo-400 font-semibold">
                {settings.maxDpi} DPI
              </span>
            </div>
            <select
              id="dpi-selector"
              disabled={disabled}
              value={settings.maxDpi}
              onChange={(e) => {
                onChangeSettings({
                  ...settings,
                  preset: 'custom',
                  maxDpi: Number(e.target.value),
                });
              }}
              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-750 text-slate-200 rounded-md focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="96">96 DPI (Email / Quick Screens)</option>
              <option value="120">120 DPI (Web Documents)</option>
              <option value="150">150 DPI (Balanced Standard)</option>
              <option value="180">180 DPI (High Clarity)</option>
              <option value="200">200 DPI (Archival Crisp - Recommended)</option>
              <option value="240">240 DPI (High Retina Displays)</option>
              <option value="300">300 DPI (Commercial Print Quality)</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Downsamples oversized raw scans while retaining clean edges.
            </p>
          </div>

          {/* Color & Metadata Toggles */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-slate-300">Color & Structure</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Grayscale Conversion</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChangeSettings({
                    ...settings,
                    colorMode: settings.colorMode === 'grayscale' ? 'color' : 'grayscale',
                  });
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.colorMode === 'grayscale' ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.colorMode === 'grayscale' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Strip Metadata & XMP</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChangeSettings({
                    ...settings,
                    stripMetadata: !settings.stripMetadata,
                  });
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.stripMetadata ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.stripMetadata ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
