import Link from "next/link";

const sections = [
  {
    title: "Estado",
    body:
      "Monorepo reiniciado con API Hono y frontend Next.js listos para desarrollar capacidades reales.",
  },
  {
    title: "Siguientes pasos",
    body:
      "Conectar la API a PostgreSQL, construir autenticación básica y documentar solo lo verificado.",
  },
  {
    title: "Contacto",
    body: "hola@brisacubanaclean.com",
  },
];

export default function HomePage() {
  return (
    <main style={{ padding: "4rem 1.5rem", maxWidth: "960px", margin: "0 auto" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "#7ee7c4" }}>
          Brisa Cubana Clean Intelligence
        </span>
        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", margin: 0 }}>
          Plataforma en construcción con código verificable
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#b8d9d0", maxWidth: "60ch" }}>
          Replanteamos el proyecto para que cada afirmación esté respaldada por implementación real. Este landing refleja el estado actual y enlaza solo a documentación verificada.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="https://github.com/albertodimas/brisa-cubana-clean-intelligence" style={{ color: "#7ee7c4" }}>
            Repositorio en GitHub
          </Link>
          <Link href="/docs" style={{ color: "#7ee7c4" }}>
            Documentación (en progreso)
          </Link>
        </div>
      </header>
      <section style={{ marginTop: "3rem", display: "grid", gap: "1.5rem" }}>
        {sections.map((section) => (
          <article key={section.title} style={{ background: "rgba(13,25,30,0.6)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(126,231,196,0.2)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1.5rem" }}>{section.title}</h2>
            <p style={{ margin: 0, color: "#d5f6eb" }}>{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
