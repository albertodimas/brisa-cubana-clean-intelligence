#!/usr/bin/env ts-node
import { Command } from "commander";
import { writeFileSync, existsSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";

const program = new Command();

program
  .name("generate-utm")
  .description(
    "Construye URLs con parámetros UTM y opcionalmente guarda en CSV",
  )
  .requiredOption("-p, --path <path>", "Ruta del landing (ej. /diagnostico)")
  .requiredOption("-s, --source <source>", "utm_source")
  .requiredOption("-m, --medium <medium>", "utm_medium")
  .requiredOption("-c, --campaign <campaign>", "utm_campaign")
  .option("-n, --content <content>", "utm_content")
  .option("-t, --term <term>", "utm_term")
  .option(
    "-b, --base <base>",
    "URL base",
    "https://brisacubanacleanintelligence.com",
  )
  .option("-o, --output <file>", "Archivo CSV donde guardar el resultado")
  .parse(process.argv);

const opts = program.opts();

const params = new URLSearchParams({
  utm_source: opts.source,
  utm_medium: opts.medium,
  utm_campaign: opts.campaign,
});

if (opts.content) params.set("utm_content", opts.content);
if (opts.term) params.set("utm_term", opts.term);

const base = opts.base.replace(/\/?$/, "");
const path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
const fullUrl = `${base}${path}?${params.toString()}`;

console.log(`URL generada: ${fullUrl}`);

if (opts.output) {
  const header = "content_id,url\n";
  const filePath = resolve(opts.output);
  const row = `${opts.content ?? "custom"},${fullUrl}\n`;
  if (!existsSync(filePath)) {
    writeFileSync(filePath, header + row, "utf8");
    console.log(`Archivo creado: ${filePath}`);
  } else {
    appendFileSync(filePath, row, "utf8");
    console.log(`Fila agregada a ${filePath}`);
  }
}
