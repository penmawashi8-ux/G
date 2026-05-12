import { useEffect, useState } from "react";

interface TimerProps {
  deadline: number; // unix ms
  onExpire?: () => void;
}

export default function Timer({ deadline, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));

  useEffect(() => {
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(tick);
        onExpire?.();
      }
    }, 500);
    return () => clearInterval(tick);
  }, [deadline, onExpire]);

  const urgent = remaining <= 10;

  return (
    <div
      className={`text-4xl font-bold tabular-nums ${
        urgent ? "text-red-400 animate-pulse" : "text-yellow-400"
      }`}
    >
      {remaining}
    </div>
  );
}
