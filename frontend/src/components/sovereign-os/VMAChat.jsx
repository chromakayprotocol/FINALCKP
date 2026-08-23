import { useState } from 'react';
import { getSupabaseClient } from '../../services/supabase/client';
import { useSovereign } from '../../sovereign/runtime';

/**
 * The live half of Phase 18 (AI/VMA): a real chat interface calling the
 * deployed frontend/vma-worker's POST /chat, sending the same
 * buildVMAContext(state) payload the Worker's tests exercise — via
 * `useSovereign().vma.context`, not a re-derived shape. Grounded, not
 * decorative: if the Worker isn't configured or the call fails, this
 * says so rather than fabricating a reply.
 *
 * Auth mirrors src/services/apiClient.js's exact pattern for reaching
 * the FastAPI backend: pull the live Supabase access token per-request,
 * send it as a bearer token. No token stored, no separate session.
 */

const VMA_WORKER_URL = (import.meta.env.VITE_APP_VMA_WORKER_URL || '').replace(/\/+$/, '');

export default function VMAChat() {
  const { vma } = useSovereign();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;

    if (!VMA_WORKER_URL) {
      setError('VMA is not configured yet — VITE_APP_VMA_WORKER_URL is unset.');
      return;
    }

    const nextHistory = [...messages, { role: 'user', content: text }];
    setMessages(nextHistory);
    setDraft('');
    setError(null);
    setPending(true);

    try {
      const supabase = getSupabaseClient();
      const { data } = supabase ? await supabase.auth.getSession() : { data: {} };
      const token = data.session?.access_token;
      if (!token) throw new Error('Sign in to talk with VMA.');

      const response = await fetch(`${VMA_WORKER_URL}/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          context: vma.context,
          message: text,
          history: messages,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || `VMA request failed (${response.status})`);

      setMessages([...nextHistory, { role: 'assistant', content: body.reply }]);
    } catch (err) {
      setError(err.message || 'VMA is unavailable right now.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
        {messages.length === 0 && (
          <p className="text-zinc-500">
            Ask VMA about your journey — it reads your real progress (modules, retained concepts,
            patterns, protocols), not a script.
          </p>
        )}
        {messages.map((message, index) => (
          <p
            key={index}
            className={message.role === 'user' ? 'text-right text-zinc-200' : 'text-left text-red-200'}
          >
            <span className="mr-1 text-[10px] uppercase tracking-wide text-zinc-500">
              {message.role === 'user' ? 'You' : 'VMA'}
            </span>
            <br />
            {message.content}
          </p>
        ))}
        {pending && <p className="text-zinc-500">VMA is thinking…</p>}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What patterns have I found?"
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600"
          disabled={pending}
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          className="rounded-lg border border-red-500/30 px-3 py-2 text-xs uppercase tracking-wide text-red-200 hover:bg-red-500/10 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
