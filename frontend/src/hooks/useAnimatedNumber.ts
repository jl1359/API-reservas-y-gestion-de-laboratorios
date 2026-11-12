import { useState, useEffect } from 'react';

/**
 * Hook para incrementar números visiblemente paso a paso: 0, 1, 2, 3, 4, 5...
 * Al entrar a la sección de reportes o cambiar la fecha/filtro,
 * arranca en 0 y cuenta de uno en uno de acuerdo a la cantidad (ej. 19 reservas, 15 asistencias, 4 inasistencias).
 */
export function useAnimatedNumber(target: number, totalDuration: number = 850): number {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    const end = Math.max(0, isNaN(target) ? 0 : Math.round(target));
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    // Siempre arranca en 0
    setDisplayValue(0);

    // Para números discretos (<= 30 como 19, 15, 4): conteo exacto paso a paso (0, 1, 2, 3...)
    if (end <= 30) {
      // Ajuste fino del intervalo para que cada número sea claramente visible a la vista (~45ms a 95ms)
      const intervalMs = Math.max(45, Math.min(Math.floor(800 / end), 95));
      let current = 0;

      const timer = setInterval(() => {
        current += 1;
        setDisplayValue(current);
        if (current >= end) {
          clearInterval(timer);
        }
      }, intervalMs);

      return () => clearInterval(timer);
    }

    // Para porcentajes y números mayores (> 30, ej. 79%, 100): aceleración cúbica fluida
    const startTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      // Easing cúbico suave que desacelera al final
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.min(end, Math.round(end * eased));
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(end);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, totalDuration]);

  return displayValue;
}
