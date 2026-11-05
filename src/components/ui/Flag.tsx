import {
  AR, AU, BO, BR, CA, CH, CL, CN, CO, ES, EU, FR, GB, IL, IN, IT, JP, KR, MX, PE, PY, SA, US, UY,
} from 'country-flag-icons/react/3x2';
import { cn } from '../../lib/cn';

/**
 * Bandeiras em SVG: emojis de bandeira não aparecem no Windows (viram "BR", "US").
 * Só as usadas pelo app são importadas, para não aumentar o pacote.
 */
const FLAGS = { AR, AU, BO, BR, CA, CH, CL, CN, CO, ES, EU, FR, GB, IL, IN, IT, JP, KR, MX, PE, PY, SA, US, UY };

export type FlagCode = keyof typeof FLAGS;

export function Flag({ code, className }: { code: FlagCode; className?: string }) {
  const Svg = FLAGS[code];
  return (
    <Svg
      aria-hidden
      className={cn('inline-block h-[0.75em] w-auto shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(11,27,61,0.12)]', className)}
    />
  );
}

/** Bandeira dentro do círculo cinza usado nas listas de moeda e idioma. */
export function FlagCircle({ code }: { code: FlagCode }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
      <Flag code={code} className="h-4" />
    </span>
  );
}
