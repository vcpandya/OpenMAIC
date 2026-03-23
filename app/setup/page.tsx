'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Building2, Check, ArrowRight, Sparkles, Shield, Users, Palette, Database, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

type DeploymentMode = 'personal' | 'organization';

const FEATURES = {
  personal: [
    { icon: Sparkles, label: 'AI-powered lesson generation' },
    { icon: Globe, label: '17 languages supported' },
    { icon: Home, label: 'Browser-based, no server setup' },
    { icon: Shield, label: 'Your data stays on your device' },
  ],
  organization: [
    { icon: Users, label: 'Multi-user with roles & invitations' },
    { icon: Database, label: 'PostgreSQL database for persistence' },
    { icon: Palette, label: 'White-label branding & custom domain' },
    { icon: Shield, label: 'Admin panel with usage analytics' },
  ],
};

export default function SetupPage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<DeploymentMode | null>(null);
  const [step, setStep] = useState<'choose' | 'confirm'>('choose');

  const handleSelect = (mode: DeploymentMode) => {
    setSelectedMode(mode);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedMode) return;

    // Save deployment mode
    try {
      await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode }),
      });

      if (selectedMode === 'personal') {
        router.push('/');
      } else {
        // Organization mode — redirect to register first admin account
        router.push('/auth/register');
      }
    } catch {
      // Fallback: just navigate
      router.push('/');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Welcome
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Set up OpenMAIC
          </h1>
          <p className="mt-3 text-muted-foreground text-base md:text-lg max-w-lg mx-auto">
            Choose how you want to deploy your AI interactive classroom
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid md:grid-cols-2 gap-4 md:gap-6"
            >
              {/* Personal Mode Card */}
              <button
                onClick={() => handleSelect('personal')}
                className="group relative text-left p-6 md:p-8 rounded-2xl border-2 border-border/50 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
              >
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Ready
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-1.5">Personal Mode</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Single user, zero configuration. All data stored in your browser. Perfect for self-study and personal use.
                </p>
                <div className="space-y-2.5">
                  {FEATURES.personal.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <f.icon className="w-4 h-4 text-primary/60 shrink-0" />
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                  Get Started <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Organization Mode Card */}
              <button
                onClick={() => handleSelect('organization')}
                className="group relative text-left p-6 md:p-8 rounded-2xl border-2 border-border/50 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
              >
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                  Advanced
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-1.5">Organization Mode</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Multi-user deployment with admin panel, user invitations, PostgreSQL database, and white-label branding.
                </p>
                <div className="space-y-2.5">
                  {FEATURES.organization.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <f.icon className="w-4 h-4 text-primary/60 shrink-0" />
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                  Learn More <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </motion.div>
          )}

          {step === 'confirm' && selectedMode && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                {selectedMode === 'personal' ? (
                  <Home className="w-8 h-8 text-primary" />
                ) : (
                  <Building2 className="w-8 h-8 text-primary" />
                )}
              </div>

              <h2 className="text-2xl font-semibold mb-2">
                {selectedMode === 'personal' ? 'Personal Mode' : 'Organization Mode'}
              </h2>

              {selectedMode === 'personal' ? (
                <p className="text-muted-foreground mb-8">
                  No setup required! Your classrooms will be stored in your browser. You can start creating lessons immediately.
                </p>
              ) : (
                <div className="text-left space-y-3 mb-8">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-5">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                      Organization mode requires a PostgreSQL database
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300/80 mb-3">
                      Set the <code className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-xs font-mono">DATABASE_URL</code> environment variable before starting. After setup, you&apos;ll create the first admin account and can invite users from the admin panel.
                    </p>
                    <div className="bg-blue-100/50 dark:bg-blue-900/30 rounded-lg p-3 font-mono text-xs text-blue-800 dark:text-blue-200 overflow-x-auto">
                      DATABASE_URL=&quot;postgresql://user:pass@host:5432/openmaic&quot;
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1.5">
                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> User authentication with email/password + Google/GitHub OAuth</p>
                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Admin panel with user management and role assignment</p>
                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Invitation system with email codes and CSV bulk upload</p>
                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> White-label branding (name, logo, colors) via admin UI</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setStep('choose')}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {selectedMode === 'personal' ? 'Start Learning' : 'Set Up Organization'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground/50 mt-10"
        >
          You can change your deployment mode later in Settings
        </motion.p>
      </motion.div>
    </div>
  );
}
