import { cn } from '../lib/cn';

/** Símbolo do IsFair (cédulas no quadro de foco). Original em brand/isfair-logo-original.jpg. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo-mark.png"
      alt=""
      aria-hidden
      draggable={false}
      className={cn('h-9 w-9 shrink-0 select-none rounded-[22%]', className)}
    />
  );
}

/** Logo com o nome; `inverted` para fundo azul-marinho. */
export function Logo({ inverted, tagline, className }: { inverted?: boolean; tagline?: string; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={inverted ? 'ring-1 ring-white/20' : undefined} />
      <span>
        {/* Cores do símbolo; no fundo claro, tons mais escuros para o texto continuar legível */}
        <span className="block text-xl font-extrabold leading-none tracking-tight">
          <span className={inverted ? 'text-[#6CFDAE]' : 'text-[#00A86B]'}>Is</span>
          <span className={inverted ? 'text-[#00B4F8]' : 'text-[#0091D5]'}>Fair</span>
        </span>
        {tagline && <span className={cn('mt-0.5 block text-[11px]', inverted ? 'text-white/60' : 'text-ink-2')}>{tagline}</span>}
      </span>
    </span>
  );
}
