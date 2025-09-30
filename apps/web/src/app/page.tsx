"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Badge,
  Button,
  Card,
  Metric,
  Section
} from '@brisa/ui';
import {
  ArrowUpRight,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  Gauge,
  Leaf,
  ShieldAlert
} from 'lucide-react';

const heroMetrics = [
  { value: '≤ 90 min', label: 'Onboarding digital promedio' },
  { value: '97 %', label: 'SLA puntualidad objetivo', helper: 'Pilotos 2025Q4' },
  { value: 'CleanScore™', label: 'Auditoría visual con IA en cada servicio' }
];

const differentiators = [
  {
    title: 'Concierge multimodal',
    description:
      'Agente conversacional bilingüe (voz, texto, imagen y video) que cotiza, agenda, cobra y gestiona excepciones en tiempo real.',
    icon: <Bot />
  },
  {
    title: 'Orquestación event-driven',
    description:
      'Workflows Temporal + Redpanda para automatizar reservas, rework, facturación y reaprovisionamiento sin fricciones.',
    icon: <CalendarClock />
  },
  {
    title: 'Operaciones con gemelo digital',
    description:
      'Digital twin operativo-financiero que simula demanda, rutas y márgenes antes de desplegar cambios en campo.',
    icon: <Gauge />
  },
  {
    title: 'Sostenibilidad medible',
    description:
      'Reporte ESG listo para clientes corporativos: consumo, químicos, emisiones y métricas WELL/LEED generadas automáticamente.',
    icon: <Leaf />
  }
];

const roadmap = [
  {
    phase: 'MVP 2026 Q1',
    items: ['Concierge IA beta', 'CleanScore™ visión + audio', 'Panel admin con insights operativos']
  },
  {
    phase: 'Escala 2026 Q2-Q3',
    items: ['Pricing dinámico con señales externas', 'Marketplace de partners', 'App staff offline con voz español/inglés']
  },
  {
    phase: 'Expansión 2026 Q4+',
    items: ['Portal B2B XR', 'Integraciones PMS profundas (Opera Cloud, Mews)', 'Programa EB-3 + academias técnicas']
  }
];

const trustSignals = [
  'Cumplimiento TCPA, OSHA, Florida Digital Bill of Rights',
  'Pipeline CI/CD con matrices Node 24 + Bun 1.2 y escaneo continuo',
  'Política de retención de datos 90 días y anonimización automática de PII'
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#03191f] via-[#04070b] to-[#050a10] text-neutral-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full bg-teal-500/20 blur-[160px]" />
        <div className="absolute bottom-[-40%] left-[-5%] h-[520px] w-[520px] rounded-full bg-emerald-500/15 blur-[180px]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-teal-100"
          >
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-300" />
            Brisa Cubana Clean Intelligence
          </Link>
          <nav className="flex items-center gap-4 text-sm text-neutral-300">
            <Link href="/docs" className="hover:text-white transition-colors">
              Documentación
            </Link>
            <Link
              href="https://github.com/tu-usuario/brisa-cubana-clean-intelligence"
              className="inline-flex items-center gap-1 text-neutral-300 hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              Repositorio <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Link
              href="mailto:hola@brisacubanaclean.com"
              className="hidden rounded-full border border-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10 sm:inline-flex"
            >
              Contacto rápido
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 py-20">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid gap-12 lg:grid-cols-[1.8fr_1fr] lg:items-center"
        >
          <div className="space-y-8">
            <Badge tone="teal">IA · Operaciones Autónomas · Experiencia Premium</Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                El sistema operativo inteligente para la limpieza boutique de Miami-Dade.
              </h1>
              <p className="max-w-2xl text-lg text-neutral-300">
                Orquestamos crews, clientes y aliados con workflows event-driven, IA multimodal y métricas verificables que ponen la calidad al centro. Diseñado para property managers, hosts de lujo y oficinas que esperan excelencia cubana con precisión tecnológica.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                intent="primary"
                as="a"
                href="https://cal.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Agendar demo piloto
              </Button>
              <Link href="/docs/04-arquitectura-y-stack" prefetch={false} legacyBehavior passHref>
                <Button intent="secondary" as="a">
                  Ver blueprint técnico
                </Button>
              </Link>
              <Link href="/docs/07-roadmap-y-operaciones" prefetch={false} legacyBehavior passHref>
                <Button intent="ghost" as="a">
                  Roadmap 12+ meses
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {heroMetrics.map((metric) => (
              <Metric key={metric.label} value={metric.value} label={metric.label} helper={metric.helper} />
            ))}
          </div>
        </motion.section>

        <Section
          eyebrow="Experiencia diferencial"
          title="Tecnología tangible en cada servicio"
          description="Convertimos procesos de limpieza en experiencias de lujo verificables: IA para anticipar necesidades, automatización para ejecutar y data para demostrarlo."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {differentiators.map((item) => (
              <Card key={item.title} title={item.title} description={item.description} icon={item.icon} bleed />
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Ruta"
          title="Roadmap 2026 inspirado en revenue y eficiencia"
          description="Iteramos en ciclos de impacto corto con pilotos reales y mediciones CleanScore™/NPS continuas."
        >
          <div className="grid gap-6 md:grid-cols-3">
            {roadmap.map((stage) => (
              <Card key={stage.phase} title={stage.phase}>
                <ul className="space-y-2 text-sm text-neutral-300">
                  {stage.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-[2px] h-4 w-4 text-teal-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Confianza"
          title="Compliance y resiliencia por diseño"
          description="La plataforma incorpora políticas zero-trust, auditoría total y protocolos de continuidad para clima y demanda extrema."
        >
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Card
              title="Qué garantizamos"
              description="Cada release pasa por pruebas binario cruzadas (Bun & Node), pipelines de seguridad y control de datos." 
              icon={<ShieldAlert />}
              className="lg:col-span-1"
            >
              <ul className="mt-4 space-y-3 text-sm text-neutral-300">
                {trustSignals.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 text-teal-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card
              title="Infraestructura base"
              description="Procesamos en Vercel Edge + Temporal Cloud con data lake en MotherDuck y vector search en Weaviate 1.33."
              icon={<Building2 />}
            >
              <p className="text-sm text-neutral-300">
                Todo orquestado con pnpm + Turborepo y monitoreo OTel → Grafana Cloud / SIEM, asegurando visibilidad continua del negocio.
              </p>
            </Card>
          </div>
        </Section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="rounded-3xl border border-teal-500/40 bg-gradient-to-br from-teal-500/20 via-transparent to-emerald-500/10 p-10"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Listos para iniciar Sprint 0</h2>
              <p className="max-w-2xl text-sm text-neutral-50/80">
                Revisa la documentación viva, configura tu entorno con `pnpm dev` y desbloquea el concierge IA con los scripts de la carpeta <code className="rounded bg-black/40 px-1">apps/</code>. El roadmap, los ADR y los planes operativos ya están listos para ejecutar.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                intent="primary"
                as="a"
                href="https://github.com/tu-usuario/brisa-cubana-clean-intelligence"
                target="_blank"
                rel="noopener noreferrer"
              >
                Revisar código
              </Button>
              <Link href="/docs" prefetch={false} legacyBehavior passHref>
                <Button intent="secondary" as="a">
                  Abrir documentación
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="relative border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-neutral-400 sm:flex-row">
          <span>© {new Date().getFullYear()} Brisa Cubana. Orgullo cubano, precisión tecnológica.</span>
          <div className="flex gap-5">
            <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              LinkedIn
            </Link>
            <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Instagram
            </Link>
            <Link href="mailto:hola@brisacubanaclean.com" className="hover:text-white">
              hola@brisacubanaclean.com
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
