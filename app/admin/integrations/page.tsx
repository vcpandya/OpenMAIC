'use client';

import { useState, useEffect } from 'react';
import { Bot, Check, ExternalLink, Unplug } from 'lucide-react';

interface IntegrationStatus {
  id: string;
  type: string;
  status: string;
  botName: string | null;
  createdAt: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/integrations/status').then(r => r.json()).then(d => {
      if (d.data) setIntegrations(d.data);
    });
  }, []);

  const handleSetup = async () => {
    if (!botToken.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/integrations/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken }),
      });
      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: `Connected to @${data.bot.name}` });
        setBotToken('');
        // Refresh integrations
        const statusRes = await fetch('/api/integrations/status');
        const statusData = await statusRes.json();
        if (statusData.data) setIntegrations(statusData.data);
      } else {
        setResult({ success: false, message: data.error || 'Setup failed' });
      }
    } catch {
      setResult({ success: false, message: 'Connection failed' });
    }
    setLoading(false);
  };

  const telegramIntegration = integrations.find(i => i.type === 'telegram');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Integrations</h1>

      {/* Telegram Bot */}
      <div className="bg-card border border-border/50 rounded-xl p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Telegram Bot</h2>
            <p className="text-xs text-muted-foreground">Let users generate lessons from Telegram</p>
          </div>
        </div>

        {telegramIntegration ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-800 dark:text-emerald-200">
                Connected to <strong>@{telegramIntegration.botName}</strong>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Users can link their account with <code className="px-1 py-0.5 rounded bg-muted text-xs">/link email@example.com</code> and then send any topic to generate a lesson.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Bot Token</label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono"
                placeholder="123456:ABC-DEF..."
              />
              <p className="text-xs text-muted-foreground">
                Get a token from{' '}
                <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  @BotFather <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <button
              onClick={handleSetup}
              disabled={loading || !botToken.trim()}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              Connect Bot
            </button>

            {result && (
              <div className={`p-3 rounded-lg text-sm ${result.success ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200' : 'bg-destructive/10 text-destructive'}`}>
                {result.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp — future */}
      <div className="mt-4 bg-card border border-border/50 rounded-xl p-6 max-w-lg opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Unplug className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">WhatsApp</h2>
            <p className="text-xs text-muted-foreground">WhatsApp Business API integration — coming in a future update</p>
          </div>
        </div>
      </div>
    </div>
  );
}
