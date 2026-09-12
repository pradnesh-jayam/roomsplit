import { isDemoMode, exitDemoMode } from '../utils/demo.js';

export default function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between text-sm">
        <span className="text-yellow-200">👀 Demo mode — changes aren't saved</span>
        <button
          onClick={() => {
            exitDemoMode();
            window.location.href = '/';
          }}
          className="text-yellow-200 hover:text-white underline"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
