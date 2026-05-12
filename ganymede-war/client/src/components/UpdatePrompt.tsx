import { useRegisterSW } from "virtual:pwa-register/react";

export default function UpdatePrompt() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update();
      }, 60_000);
    },
  });

  const visible = !!needRefresh?.[0];

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] w-[min(92vw,560px)] -translate-x-1/2 rounded-xl border border-blue-500/40 bg-gray-900/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-wide text-blue-300">新しいバージョンがあります</p>
          <p className="text-xs text-gray-300">アップデートして最新機能を利用できます。</p>
        </div>
        <button className="btn-primary whitespace-nowrap" onClick={() => updateServiceWorker(true)}>
          更新
        </button>
      </div>
    </div>
  );
}
