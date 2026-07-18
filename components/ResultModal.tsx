'use client';

interface Props {
  icon: string;
  title: string;
  detail: string;
  onClose: () => void;
}

export default function ResultModal({ icon, title, detail, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-bg-card rounded-card p-8 text-center max-w-sm w-[90%] border border-border animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-3">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-text-secondary mb-5">{detail}</p>
        <button onClick={onClose} className="px-6 py-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-cell transition-all">
          OK
        </button>
      </div>
    </div>
  );
}
