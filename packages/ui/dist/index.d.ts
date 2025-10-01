import * as react_jsx_runtime from 'react/jsx-runtime';
import { PropsWithChildren, ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';

interface BadgeProps extends PropsWithChildren {
    tone?: "teal" | "sunset" | "neutral";
    className?: string;
}
declare function Badge({ tone, className, children }: BadgeProps): react_jsx_runtime.JSX.Element;

type Intent = "primary" | "secondary" | "ghost";
interface ButtonBaseProps {
    intent?: Intent;
    className?: string;
}
interface NativeButtonProps extends ButtonBaseProps, ButtonHTMLAttributes<HTMLButtonElement> {
    as?: "button";
}
type AnchorButtonProps = PropsWithChildren<ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "a";
    href: string;
}>;
type ButtonProps = PropsWithChildren<NativeButtonProps | AnchorButtonProps>;
/**
 * Botón adaptable a `<button>` o `<a>` conservando estilos consistentes.
 */
declare function Button(props: ButtonProps): react_jsx_runtime.JSX.Element;
declare const tokens: {
    brand: string;
    accent: string;
};

interface CardProps extends PropsWithChildren {
    title?: string;
    description?: string;
    icon?: ReactNode;
    bleed?: boolean;
    className?: string;
}
declare function Card({ title, description, icon, bleed, className, children, }: CardProps): react_jsx_runtime.JSX.Element;

interface MetricProps {
    value: string;
    label: string;
    helper?: string;
}
declare function Metric({ value, label, helper }: MetricProps): react_jsx_runtime.JSX.Element;

interface SectionProps extends PropsWithChildren {
    id?: string;
    eyebrow?: string;
    title: string;
    description?: string;
    align?: "left" | "center";
    className?: string;
}
declare function Section({ id, eyebrow, title, description, align, className, children, }: SectionProps): react_jsx_runtime.JSX.Element;

export { Badge, type BadgeProps, Button, Card, type CardProps, Metric, type MetricProps, Section, type SectionProps, tokens };
