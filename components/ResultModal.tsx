'use client';

interface Props {
  icon: string;
  title: string;
  detail: string;
  onClose: () => void;
}

export default function ResultModal({ icon, title, detail, onClose }: Props) {
  const isGood = icon === '✅';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`bg-paper paper-grain grain-overlay rounded-card p-8 text-center max-w-sm w-[90%] border-4 animate-stamp ${isGood ? 'border-success' : 'border-error'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-5xl mb-3">{icon}</div>
        <h3 className={`font-display text-2xl font-extrabold mb-2 uppercase tracking-wide ${isGood ? 'text-success' : 'text-error'}`}>{title}</h3>
        <p className="text-ink-light mb-5">{detail}</p>
        <button
          onClick={onClose}
          className={`px-6 py-2 font-display font-bold rounded-cell transition-all text-paper ${isGood ? 'bg-success hover:brightness-110' : 'bg-error hover:brightness-110'}`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
