import { ShieldCheck, Question } from '@phosphor-icons/react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50">
      <div className="max-w-[1800px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
            <ShieldCheck weight="fill" className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">
            DeepVerify
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            Docs
          </a>
          <a href="#" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            API
          </a>
          <button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
            <Question weight="bold" className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
      </div>
    </nav>
  );
}
