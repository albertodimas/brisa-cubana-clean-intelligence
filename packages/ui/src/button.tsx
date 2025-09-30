import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  PropsWithChildren
} from 'react';

type Intent = 'primary' | 'secondary' | 'ghost';

type ButtonBaseProps = {
  intent?: Intent;
  className?: string;
};

type NativeButtonProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: 'button';
  };

type AnchorButtonProps = PropsWithChildren<
  ButtonBaseProps &
    AnchorHTMLAttributes<HTMLAnchorElement> & {
      as: 'a';
      href: string;
    }
>;

type ButtonProps = PropsWithChildren<NativeButtonProps | AnchorButtonProps>;

/**
 * Botón adaptable a `<button>` o `<a>` conservando estilos consistentes.
 */
export function Button(props: ButtonProps) {
  const { children, intent = 'primary', className = '' } = props;
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  const palettes: Record<Intent, string> = {
    primary:
      'bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-400/40 hover:from-teal-300 hover:to-emerald-200 focus-visible:outline-emerald-300',
    secondary:
      'bg-white/10 text-white border border-white/20 hover:bg-white/20 focus-visible:outline-white',
    ghost: 'bg-transparent text-neutral-100 hover:bg-white/10 focus-visible:outline-neutral-200'
  };

  if (props.as === 'a') {
    const { as: _as, ...rest } = props as AnchorButtonProps;
    return (
      <a className={`${base} ${palettes[intent]} ${className}`} {...rest}>
        {children}
      </a>
    );
  }

  const { as: _as, ...rest } = props as NativeButtonProps;
  return (
    <button className={`${base} ${palettes[intent]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export const tokens = {
  brand: '#00857A',
  accent: '#FF5A7B'
};
