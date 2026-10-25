import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Sparkles,
  Minimize2,
  Target,
  CheckCircle2,
} from 'lucide-react';
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
    enforceTarget: boolean;
  }> = [
    {
      id: 'target250kb',
      name: 'Strict < 250 KB Limit',
      targetDpi: 130,
      quality: 0.78,
      description: 'Guarantees output stays under 250 KB for portal & visa limits while maximizing image sharpness',
      icon: <Target className="w-4 h-4 text-emerald-400" />,
      reductionEst: 'Max < 250 KB Guaranteed',
      enforceTarget: true,
    },
    {
      id: 'archive',
      name: 'High Quality Archive',
      targetDpi: 200,
      quality: 0.88,
      description: 'Preserves sharp typography and rich image gradients (Standard Desktop/Print)',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
      reductionEst: '55% - 75% reduction',
      enforceTarget: false,
    },
    {
      id: 'balanced',
      name: 'Balanced Web & Email',
      targetDpi: 150,
      quality: 0.80,
      description: 'Ideal for email attachments, contracts, and general web distribution',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      reductionEst: '70% - 85% reduction',
      enforceTarget: false,
    },
    {
      id: 'ultra',
      name: 'Ultra High Fidelity',
      targetDpi: 250,
      quality: 0.94,
      description: 'Maximum visual integrity for photography spreads & design proofs',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      reductionEst: '35% - 55% reduction',
      enforceTarget: false,
    },
    {
      id: 'compact',
      name: 'Extreme Compact',
      targetDpi: 110,
      quality: 0.70,
      description: 'Aggressive compression for tight portal uploads under 500 KB',
      icon: <Minimize2 className="w-4 h-4 text-rose-400" />,
      reductionEst: '80% - 90% reduction',
      enforceTarget: false,
    },
  ];

  const handleSelectPreset = (p: typeof presets[number]) => {
    onChangeSettings({
      ...settings,
      preset: p.id,
      maxDpi: p.targetDpi,
      quality: p.quality,
      enforceTargetSize: p.enforceTarget,
      targetMaxKb: p.enforceTarget ? 250 : settings.targetMaxKb,
    });
  };

  const handleTargetLimitToggle = (enabled: boolean) => {
    onChangeSettings({
      ...settings,
      enforceTargetSize: enabled,
      preset: enabled ? 'target250kb' : 'archive',
      targetMaxKb: 250,
    });
  };

  return (
    <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800/80">
      {/* Strict < 250 KB Target Active Banner */}
      <div className="mb-4 p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-300">
                Target Ceiling Mode: Strictly Less Than 250 KB
              </span>
              {settings.enforceTargetSize && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Multi-pass adaptive resolution solver guarantees every output PDF is strictly under 250 KB without breaking image legibility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400">Target Ceiling:</span>
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-md p-0.5">
            {[200, 250, 300, 500].map((kb) => (
              <button
                key={kb}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChangeSettings({
                    ...settings,
                    enforceTargetSize: true,
                    targetMaxKb: kb,
                    preset: kb === 250 ? 'target250kb' : 'custom',
                  });
                }}
                className={`px-2 py-1 text-xs font-mono tabular-nums rounded transition-colors ${
                  settings.enforceTargetSize && settings.targetMaxKb === kb
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {kb} KB
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white">Compression Profiles</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Select a tailored profile or fine-tune DPI and quantization limits.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        {presets.map((preset) => {
          const isSelected = settings.preset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectPreset(preset)}
              className={`text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {preset.icon}
                  <span className="text-xs font-semibold text-white whitespace-nowrap">
                    {preset.name}
                  </span>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                )}
              </div>

              <p className="mt-2 text-xs text-slate-400 leading-relaxed min-h-[44px]">
                {preset.description}
              </p>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono tabular-nums">{preset.targetDpi} DPI</span>
                <span className="font-mono tabular-nums text-slate-300 font-medium">{preset.reductionEst}</span>
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
              min="40"
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
              <span>Compact (40%)</span>
              <span>Balanced (78%)</span>
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
              <option value="80">80 DPI (High Multi-Page Fit)</option>
              <option value="96">96 DPI (Email / Quick Screens)</option>
              <option value="110">110 DPI (Compact Standard)</option>
              <option value="130">130 DPI (250 KB Target Default)</option>
              <option value="150">150 DPI (Balanced Standard)</option>
              <option value="200">200 DPI (Archival Crisp)</option>
              <option value="250">250 DPI (Commercial Proof)</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Downsamples oversized raw scans while retaining clean edges.
            </p>
          </div>

          {/* Color & Metadata Toggles */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-slate-300">Target & Structure</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Strict &lt; 250 KB Guarantee</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleTargetLimitToggle(!settings.enforceTargetSize)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.enforceTargetSize ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.enforceTargetSize ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

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
