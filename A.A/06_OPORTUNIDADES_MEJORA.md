# 🐬 06. OPORTUNIDADES DE MEJORA E INNOVACIÓN TÉCNICA (SCALING)

Para la siguiente iteración, evolución o reconstrucción del sistema a partir de este Master Prompt, se han detectado campos para mejora a nivel de Base de Datos, Código y Operativa.

## 🚀 1. MEJORAS EN BASE DE DATOS Y SUPABASE

### 1.1. Caché Redis o Edge Functions para Catálogo
* **Problema Actual:** El catálogo maestro de partidas (~6,000 registros estáticos) se descarga completo en cada recarga usando la recursión Paginada `range()`. Cuesta ancho de banda inútil porque el WBS rara vez cambia en la semana.
* **Mejora Propuesta:** Usar Supabase Edge Functions con Redis Cache. Si el hash del WBS no mutó (basado en `updated_at`), el backend devuelve un HTTP 304 Not Modified, y Zustand carga el catálogo desde `IndexedDB` en 10 milisegundos en lugar de consumir red de la base de datos maestra.

### 1.2. Índices B-Tree Compuestos (Indexación)
* **Problema Actual:** Filtrar 50,000 metrados por (proyecto + especialidad + fechas) puede ralentizar la BD en el futuro.
* **Mejora Propuesta:** Crear índices multicampo explícitos en Postgres: `CREATE INDEX idx_metrados_busqueda ON metrados (proyecto, especialidad, fecha)`. Esto pasará la búsqueda full-scan a un escaneo de índice milisegundo.

### 1.3. Migración de "Elemento Virtual" a Entidad (Opcional)
* **Problema Actual:** Las cabeceras virtuales en el DataGrid se crean al vuelo inspeccionando que el campo `elemento` se repita. Editarlo masivamente requiere un barrido.
* **Mejora Propuesta:** Dependiendo de la complejidad de la nueva versión, evaluar si conviene crear una tabla intermedia de `Agrupadores` o continuar con la ilusión de frontend si el peso de la mutación lo permite.

---

## 💻 2. MEJORAS EN ARQUITECTURA FRONTEND

### 2.1. Web Workers para Roll-Up Fractales
* **Problema Actual:** Cuando hay 50,000 filas de metrados en un mes activo, el algoritmo O(N) Hash reductor para sacar los `partidaTotals` y la reducción $N^2$ string-matching de `titleTotals` en Zustand pueden bloquear el Main Thread del navegador causando caída de FPS (Jank).
* **Mejora Propuesta:** Extraer las funciones matemáticas pesadas de Zustand hacia un **Service Worker o Web Worker** (`worker.ts`). Enviar el payload bruto al worker y recibir el array totalizado de regreso en paralelo, garantizando UI de 120Hz sin bloqueos al mutar datos en tiempo real.

### 2.2. Migración del Motor de Reportes (ExcelJS a WebAssembly/Rust)
* **Problema Actual:** Construir el archivo Excel con `exceljs` es single-threaded y en archivos mastodónticos de toda la obra puede llegar a tomar 10+ segundos colapsando RAM en laptops de bajo rendimiento de obra.
* **Mejora Propuesta:** Integrar un micro-módulo de WebAssembly compilado desde Rust (ej. librerías de hojas de cálculo Rust-to-WASM) para ensamblar el `.xlsx` a velocidades nativas de C++.

---

## 📲 3. MEJORAS FUNCIONALES Y DE NEGOCIO

### 3.1. Sincronización Offline (PWA Local-First)
* **Problema:** En túneles, zapatas profundas o zonas remotas del Hospital no hay Wifi. Si el metrador guarda, la API fallará.
* **Mejora Propuesta:** Implementar RxDB o WatermelonDB para arquitectura "Local-First". El metrador guarda sus mediciones sin conexión. Todo se va a un buffer IndexedDB y un ServiceWorker lo sincroniza silenciosamente a Supabase en cuanto el teléfono recupera red 4G, con lógica de resolución de conflictos de tiempos (`updated_at` merges).

### 3.2. Versionado de Presupuesto Base
* **Problema:** El flag `se_valoriza` o cambios de PU sobreescriben la base histórica sin dejar instantáneas del estado general de la obra de mes a mes. Solo existen logs de eventos.
* **Mejora Propuesta:** Implementar Snapshots mensuales. Un botón que archive todo el catálogo actual como "Version_Cierre_Mayo" (clonación inmutable) de modo que la curva "S" PowerBI lea bases de datos estáticas por período para reportes históricos perfectos.
