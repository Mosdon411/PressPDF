import React from 'react';
import { Eye, Shield, Sliders, Cpu } from 'lucide-react';

export const PreservationEngineGuide: React.FC = () => {
  return (
    <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-800/80">
      <div className="max-w-2xl">
        <h2 className="text-base font-semibold text-white">
          How PressPDF Preserves Visual Fidelity
        </h2>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          Most online compressors blindly crush images to low-bitrate JPEG 40% with muddy text and noisy artifacts. PressPDF uses a multi-tier raster and structural pipeline designed for professional output.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/60">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <Cpu className="w-4 h-4" />
            <h4 className="text-xs font-semibold text-slate-200">Bicubic Resampling</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Oversized scans (300–600 DPI) are resampled with high-quality pixel interpolation. Text edges remain sharp and readable even at reduced file sizes.
          </p>
        </div>

        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/60">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <Sliders className="w-4 h-4" />
            <h4 className="text-xs font-semibold text-slate-200">High-Q Quantization</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Maintains high quantization tables (80%–94% quality) to eliminate blocking artifacts around text glyphs and photos, avoiding muddy compression halos.
          </p>
        </div>

        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/60">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <Shield className="w-4 h-4" />
            <h4 className="text-xs font-semibold text-slate-200">Object Stream Deflate</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            PDF cross-reference tables and redundant metadata (XMP packets, printer stamps) are compressed into binary streams without touching pixel data.
          </p>
        </div>
      </div>
    </div>
  );
};
