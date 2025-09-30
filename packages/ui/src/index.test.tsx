import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Badge, Button, Metric } from './index';

describe('Button', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<Button>Primary</Button>);
    expect(html).toContain('Primary');
  });

  it('applies secondary variant styles', () => {
    const html = renderToStaticMarkup(<Button intent="secondary">Secondary</Button>);
    expect(html).toContain('bg-white/10');
  });

  it('supports ghost intent', () => {
    const html = renderToStaticMarkup(<Button intent="ghost">Ghost</Button>);
    expect(html).toContain('bg-transparent');
  });
});

describe('Badge', () => {
  it('renders with custom tone', () => {
    const html = renderToStaticMarkup(<Badge tone="sunset">Beta</Badge>);
    expect(html).toContain('bg-rose-500/15');
  });
});

describe('Metric', () => {
  it('renders KPI value and helper', () => {
    const html = renderToStaticMarkup(
      <Metric value="97%" label="SLA cumplido" helper="Datos de agosto 2025" />
    );
    expect(html).toContain('97%');
    expect(html).toContain('Datos de agosto 2025');
  });
});
