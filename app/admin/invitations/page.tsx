'use client';

import { useState, useRef } from 'react';
import { Mail, Upload, Copy, Check, Plus, Trash2 } from 'lucide-react';

interface Invitation {
  id: string;
  email: string | null;
  code: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load invitations on mount
  useState(() => {
    fetch('/api/admin/invitations').then(r => r.json()).then(d => {
      if (d.data) setInvitations(d.data);
    });
  });

  const createInvitation = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email || undefined, role }),
    });
    const data = await res.json();
    if (data.data) {
      setInvitations(prev => [data.data, ...prev]);
      setEmail('');
    }
    setLoading(false);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    // Skip header row if it contains "email"
    const startIdx = lines[0]?.toLowerCase().includes('email') ? 1 : 0;

    const entries = lines.slice(startIdx).map(line => {
      const [csvEmail, csvRole] = line.split(',').map(s => s.trim().replace(/"/g, ''));
      return { email: csvEmail, role: csvRole || 'STUDENT' };
    }).filter(e => e.email && e.email.includes('@'));

    if (entries.length === 0) return;

    const res = await fetch('/api/admin/invitations/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitations: entries }),
    });
    const data = await res.json();
    if (data.data) {
      setInvitations(prev => [...data.data, ...prev]);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/auth/register?code=${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const revokeInvitation = async (id: string) => {
    await fetch(`/api/admin/invitations/${id}`, { method: 'DELETE' });
    setInvitations(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'REVOKED' } : inv));
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-600',
    ACCEPTED: 'bg-emerald-500/10 text-emerald-600',
    EXPIRED: 'bg-gray-500/10 text-gray-500',
    REVOKED: 'bg-red-500/10 text-red-600',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Invitations</h1>

      {/* Create invitation form */}
      <div className="bg-card border border-border/50 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4">Send Invitation</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-muted-foreground mb-1">Email (optional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              placeholder="user@example.com" />
          </div>
          <div className="w-36">
            <label className="block text-xs text-muted-foreground mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button onClick={createInvitation} disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
          <div className="w-px h-8 bg-border/50 mx-1" />
          <div>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Bulk CSV
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          CSV format: email, role (one per line). Leave email blank to create a shareable code.
        </p>
      </div>

      {/* Invitations table */}
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email / Code</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {invitations.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm">{inv.email || <span className="text-muted-foreground italic">Open code</span>}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{inv.role.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || ''}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {inv.status === 'PENDING' && (
                      <>
                        <button onClick={() => copyCode(inv.code, inv.id)}
                          className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy invite link">
                          {copiedId === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => revokeInvitation(inv.id)}
                          className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-destructive transition-colors"
                          title="Revoke">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {invitations.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No invitations yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
