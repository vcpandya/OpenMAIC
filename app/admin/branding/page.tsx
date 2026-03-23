'use client';

import { useState, useEffect } from 'react';
import { Palette, Save, Check } from 'lucide-react';

interface BrandingConfig {
  brandName: string;
  brandLogo: string;
  primaryColor: string;
  faviconUrl: string;
}

export default function BrandingPage() {
  const [config, setConfig] = useState<BrandingConfig>({
    brandName: '', brandLogo: '', primaryColor: '#722ed1', faviconUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/branding').then(r => r.json()).then(d => {
      if (d.data) setConfig(d.data);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/admin/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const colorPresets = [
    { color: '#722ed1', label: 'Purple' },
    { color: '#2563eb', label: 'Blue' },
    { color: '#e11d48', label: 'Rose' },
    { color: '#059669', label: 'Emerald' },
    { color: '#d97706', label: 'Amber' },
    { color: '#0d9488', label: 'Teal' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Branding</h1>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6 max-w-lg">
        <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Organization Name</label>
            <input type="text" value={config.brandName}
              onChange={(e) => setConfig(c => ({ ...c, brandName: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
              placeholder="My Organization" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Logo URL</label>
            <input type="text" value={config.brandLogo}
              onChange={(e) => setConfig(c => ({ ...c, brandLogo: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
              placeholder="https://example.com/logo.png" />
            {config.brandLogo && (
              <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                <img src={config.brandLogo} alt="Logo preview" className="h-8 object-contain" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={config.primaryColor}
                onChange={(e) => setConfig(c => ({ ...c, primaryColor: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
              <input type="text" value={config.primaryColor}
                onChange={(e) => setConfig(c => ({ ...c, primaryColor: e.target.value }))}
                className="w-28 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" />
            </div>
            <div className="flex gap-2 mt-2">
              {colorPresets.map((p) => (
                <button key={p.color} onClick={() => setConfig(c => ({ ...c, primaryColor: p.color }))}
                  className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                  style={{ backgroundColor: p.color, borderColor: config.primaryColor === p.color ? p.color : 'transparent' }}
                  title={p.label} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Favicon URL</label>
            <input type="text" value={config.faviconUrl}
              onChange={(e) => setConfig(c => ({ ...c, faviconUrl: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
              placeholder="https://example.com/favicon.ico" />
          </div>
        </div>

        {/* Preview */}
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" /> Preview
          </h3>
          <div className="rounded-lg border border-border p-4 bg-background">
            <div className="flex items-center gap-3 mb-3">
              {config.brandLogo ? (
                <img src={config.brandLogo} alt="" className="h-6 object-contain" />
              ) : (
                <div className="w-6 h-6 rounded" style={{ backgroundColor: config.primaryColor }} />
              )}
              <span className="font-semibold text-sm">{config.brandName || 'OpenMAIC'}</span>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: config.primaryColor }}>
                Primary Button
              </div>
              <div className="px-3 py-1.5 rounded-lg border text-xs font-medium" style={{ borderColor: config.primaryColor, color: config.primaryColor }}>
                Secondary
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
