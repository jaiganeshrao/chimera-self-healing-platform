import React, { useState } from 'react';
import { X, Server, AlertCircle, ShieldCheck } from 'lucide-react';

interface RegisterServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: {
    name: string;
    description: string;
    healthCheckUrl: string;
    tags: string[];
  }) => Promise<void>;
}

export const RegisterServiceModal: React.FC<RegisterServiceModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [healthCheckUrl, setHealthCheckUrl] = useState('http://localhost:3000/api/test-service/health?target=custom');
  const [tagsInput, setTagsInput] = useState('microservice, internal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !healthCheckUrl.trim()) {
      setError('Service name and health check endpoint URL are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onRegister({
        name: name.trim(),
        description: description.trim(),
        healthCheckUrl: healthCheckUrl.trim(),
        tags,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register service');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0C1426]/95 border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-slate-100">
                Register Target Microservice
              </h3>
              <p className="text-[11px] text-slate-400">
                Add an endpoint to Project Chimera's autonomous telemetry fleet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1.5 font-medium">
              Service Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Notification Dispatch Worker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080D1A]/90 border border-white/[0.08] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-all placeholder:text-slate-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1.5 font-medium">
              HTTP Health Check Endpoint URL *
            </label>
            <input
              type="url"
              placeholder="http://localhost:3000/api/test-service/health?target=..."
              value={healthCheckUrl}
              onChange={(e) => setHealthCheckUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080D1A]/90 border border-white/[0.08] rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-all placeholder:text-slate-500"
              required
            />
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSRF Filter: Target host must match localhost, 127.0.0.1, or ais-dev.</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1.5 font-medium">
              Operational Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief operational context, workload characteristics, and downstream dependencies..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080D1A]/90 border border-white/[0.08] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-all placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1.5 font-medium">
              Metadata Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="core, queue, notification"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080D1A]/90 border border-white/[0.08] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all shadow-md shadow-sky-950/40 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Registering...' : 'Register Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
