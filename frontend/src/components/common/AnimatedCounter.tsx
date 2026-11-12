import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Componente visual que muestra el incremento numérico paso a paso (0, 1, 2, 3, 4, 5...)
 * de acuerdo a la cantidad (ej. 19 reservas, 15 asistencias, 4 inasistencias).
 */
export default function AnimatedCounter({
  value,
  duration = 850,
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const animated = useAnimatedNumber(value, duration);

  return (
    <span className={`inline-block font-poppins ${className}`}>
      {prefix}
      {animated}
      {suffix}
    </span>
  );
}
