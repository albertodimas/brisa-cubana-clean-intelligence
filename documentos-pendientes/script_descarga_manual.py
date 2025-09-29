#!/usr/bin/env python3
"""
Script para facilitar la descarga manual de documentos pendientes
Requiere intervención manual para acceder a los sitios protegidos
"""

import webbrowser
import os
from pathlib import Path

# Crear estructura de directorios si no existe
base_dir = Path(__file__).parent
dirs = [
    "turismo-2024",
    "salarios-oews",
    "competencia-pricing",
    "datos-adicionales"
]

for dir_name in dirs:
    (base_dir / dir_name).mkdir(exist_ok=True)

print("=" * 60)
print("SCRIPT DE AYUDA PARA DESCARGA MANUAL DE DOCUMENTOS")
print("=" * 60)
print()

# URLs a abrir
urls = {
    "1. GMCVB 2024 Industry Overview (Issuu)": {
        "url": "https://issuu.com/miamiandmiamibeachguides.com/docs/gmcvb_visitor_industry_overview_2024",
        "instrucciones": [
            "1. Click en el botón de descarga (si está disponible)",
            "2. O toma capturas de pantalla de las páginas clave",
            "3. Busca datos de: 28M visitantes, $22B gastos, 209K empleos",
            "4. Guarda en: documentos-pendientes/turismo-2024/"
        ]
    },
    "2. BLS OEWS Miami Data": {
        "url": "https://www.bls.gov/oes/current/oes_33100.htm",
        "instrucciones": [
            "1. Busca SOC code 37-2012",
            "2. Descarga el Excel/CSV si está disponible",
            "3. Busca: Employment, Hourly mean wage, Annual mean wage",
            "4. Guarda en: documentos-pendientes/salarios-oews/"
        ]
    },
    "3. BLS National SOC 37-2012": {
        "url": "https://www.bls.gov/oes/current/oes372012.htm",
        "instrucciones": [
            "1. Compara datos nacionales vs Miami",
            "2. Descarga tabla de percentiles",
            "3. Guarda en: documentos-pendientes/salarios-oews/"
        ]
    },
    "4. Thumbtack Miami Cleaners": {
        "url": "https://www.thumbtack.com/fl/miami/house-cleaning",
        "instrucciones": [
            "1. Toma captura mostrando '543 five star cleaners'",
            "2. Captura precios desde $70",
            "3. Documenta rangos de precios de varios proveedores",
            "4. Guarda en: documentos-pendientes/competencia-pricing/"
        ]
    },
    "5. PR Newswire GMCVB Article": {
        "url": "https://www.prnewswire.com/news-releases/greater-miami-convention--visitors-bureau-report-miami-dade-tourism-remains-robust-with-record-number-of-visitors-in-2024-302470723.html",
        "instrucciones": [
            "1. Guarda como PDF o captura completa",
            "2. Este es el comunicado oficial con los datos",
            "3. Guarda en: documentos-pendientes/turismo-2024/"
        ]
    }
}

print("ABRIENDO PÁGINAS EN EL NAVEGADOR...")
print("Por favor, sigue las instrucciones para cada sitio:")
print()

for titulo, info in urls.items():
    print(f"\n{titulo}")
    print("-" * 40)
    print(f"URL: {info['url']}")
    print("\nInstrucciones:")
    for instruccion in info["instrucciones"]:
        print(f"  {instruccion}")

    respuesta = input(f"\n¿Abrir {titulo}? (s/n): ")
    if respuesta.lower() == 's':
        webbrowser.open(info["url"])
        input("Presiona Enter cuando hayas terminado con este sitio...")

print("\n" + "=" * 60)
print("RESUMEN DE DATOS A VERIFICAR")
print("=" * 60)

verificaciones = """
✅ DATOS CONFIRMADOS (ya extraídos):
- Turismo 2024: 28M visitantes, $22B gastos
- Competencia: 543 proveedores 5★ en Thumbtack
- Precios: Desde $70 en Thumbtack
- Salario promedio: $17.55/hora (grupo ocupacional)

⚠️ PENDIENTE DE VERIFICAR:
- SOC 37-2012 específico para Miami (annual mean wage)
- PDF oficial del GMCVB 2024
- Capturas de pantalla de evidencia

📁 ESTRUCTURA DE CARPETAS CREADA:
documentos-pendientes/
├── turismo-2024/         (PDFs del GMCVB)
├── salarios-oews/        (Excel/CSV del BLS)
├── competencia-pricing/  (Capturas de Thumbtack)
└── datos-adicionales/    (Otros documentos)
"""

print(verificaciones)

print("\nScript completado. Revisa los archivos descargados.")
print("Los datos ya extraídos están en: REFERENCIAS_FUENTES.md")