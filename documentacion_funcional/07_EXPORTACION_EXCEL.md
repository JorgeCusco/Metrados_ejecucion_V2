# 📥 MOTOR DE EXPORTACIÓN A EXCEL

Este documento detalla el motor de exportación a hojas de cálculo Excel integrado en el **Sistema de Gestión de Metrados (V5.0)**, diseñado para generar reportes oficiales auditables listos para su presentación a entidades gubernamentales.

---

## 1. Generación Directa en Cliente (Vía Web)

Históricamente, la generación de reportes complejos en formato Excel requería scripts de servidor pesados (usando librerías Python como Pandas u OpenPyXL) que consumían gran ancho de banda y requerían enviar pesados payloads de red.

El sistema implementa una **Arquitectura de Generación Client-Side** mediante la integración de `exceljs` y `file-saver`:
* **Cero Carga en Servidor:** Toda la hoja de cálculo se ensambla, colorea, formatea y empaqueta directamente en la memoria RAM del navegador del usuario.
* **Descarga Instantánea:** Al hacer clic en exportar, el navegador genera el binario del archivo `.xlsx` y lo descarga al instante al disco local, sin latencias ni tiempos de espera.

---

## 2. Planilla Estructurada GORE Cusco (Estándar Oficial)

Las hojas de cálculo generadas no son simples tablas planas de datos; están diseñadas siguiendo estrictamente los manuales de presentación del **Gobierno Regional de Cusco** y las directrices de liquidación de obras públicas nacionales:

* **Cabecera Institucional:** Incluye títulos estructurados indicando el Proyecto, Especialidad del reporte, Autor que generó las mediciones y la fecha exacta de emisión.
* **Cabeceras de Columnas Formateadas:**
  * En **Modo Cantidad:** Columnas exactas de Item | Descripción | Unidad | Cantidad | Largo | Ancho | Alto | Veces | Parcial | Total.
  * En **Modo Financiero:** Muestra además columnas de PU Actual, Anterior Acumulado, Programado contractual, Saldo Físico, Saldo Monetario y Valorizado del Período en soles (S/).

---

## 3. Pintado Inteligente de Jerarquías (WBS Styling)

Para facilitar la lectura técnica rápida por parte de los supervisores de obra, el motor de exportación analiza la jerarquía WBS de cada fila y le aplica estilos de celda diferenciados de forma automática:

```
[OE.1 OBRAS PROVISIONALES] ───────► Nivel 0 (Cabecera Roja/Gris Oscuro - Negrita)
   [OE.1.1 Obras Provisionales] ──► Nivel 1 (Subcabecera Azul/Gris Claro - Negrita)
      [OE.1.1.1 Cartel de Obra] ──► Nivel 2 (Partida Hoja - Texto Normal)
         [↳ Cimientos - Eje A] ───► Nivel 3 (Metrado Atómico - Fila Fina Indentada)
```

### Reglas de Diseño del Pintado Jerárquico:

1. **Nivel Estructural Alto (Títulos de Primer Nivel - Ej. `OE.1`):**
   * **Fondo:** Color de acento institucional fuerte (azul marino oscuro o gris antracita).
   * **Texto:** Mayúsculas sostenidas, color blanco, tipografía en negrita.
   * **Bordes:** Bordes gruesos arriba y abajo.
2. **Nivel Estructural Medio (Subtítulos - Ej. `OE.1.1`):**
   * **Fondo:** Color pastel claro o gris suave.
   * **Texto:** Negrita, tamaño estándar, color gris oscuro.
3. **Partida Hoja (Items que reciben valorización - Ej. `OE.1.1.1`):**
   * **Texto:** Código resaltado en negrita, descripción con sangría de indentación según su nivel de WBS.
   * **Bordes:** Línea fina de división horizontal.
4. **Metrado Atómico (Las mediciones diarias - Ej. `↳ Cimientos`):**
   * **Fondo:** Blanco limpio sin relleno.
   * **Indentación Visual:** La celda de descripción añade sangría a la derecha y concatena el carácter de cascada `↳` al inicio del detalle.
   * **Alineación Numérica:** Formatea todas las columnas de dimensiones a dos decimales y alinea a la derecha.

---

## 4. Tipos de Exportación Soportados

El menú de la cabecera ofrece dos modalidades de descarga según el destinatario del reporte:

* **Exportar Oficial:** Genera una planilla depurada conteniendo la especialidad seleccionada, ideal para adjuntar como sustento físico de la valorización mensual del cuaderno de obra.
* **Exportar Master:** Descarga el consolidado global de todos los frentes y especialidades activos, permitiendo a los directores de obra realizar análisis de avance presupuestario cruzado de todo el proyecto en una sola pantalla.
