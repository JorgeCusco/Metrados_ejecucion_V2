# 🐬 03. COMPONENTES Y LÓGICA DE INTERFAZ DE USUARIO (UX/UI)

El frontend no es solo un visualizador de datos; es una máquina de computación en el cliente. Para la reconstrucción, debes replicar la experiencia "Desktop-like" en la web.

## 🖥️ 1. EL CORAZÓN: DATAGRID VIRTUALIZADO

### 1.1. PlanillaMetrados y MetradosTable
Es el componente más pesado e importante de la aplicación (`src/components/MetradosTable.tsx`).
* **TanStack Virtual Engine:** Se le pasa un contenedor referenciado (`parentRef`) con una altura fija y desbordamiento (`overflow-y-auto`). La librería calcula el `virtualizer` (altura total = `filas * alto_fila_px`).
* **Renderizado Absoluto:** El array mapeado en pantalla no usa una tabla HTML clásica (`<table>`), usa divs con posicionamiento absoluto (`position: absolute; top: virtualRow.start + 'px'`). Esto crea la ilusión de scroll nativo sin colapsar el DOM.

### 1.2. Alternador de Columnas Reactivas (Físico vs Monetario)
Existen dos vistas base que desmontan columnas según el `toggle` en cabecera:
* **Vista Estándar:** Item, Descripción, Und, Cant, Largo, Ancho, Alto, Veces, Parcial, Total.
* **Vista Financiera:** Aparecen las columnas PU, Acum. Anterior, Meta Programada, Saldo Físico, Saldo S/, Valorizado Mes S/, Costo Ejecutado S/.

### 1.3. Mutación del DataGrid por Tipo de Metrado (Siderúrgico)
Si la unidad de la partida hoja es `kg` o el sistema lo detecta como acero:
* La columna "Ancho" desaparece usando condicionales booleanos en el render JSX (`!isAcero && <ColumnaAncho/>`).
* "Largo" se renombra a `Long(R)` (Longitud Recta).
* "Alto" se renombra a `Alto(G)` (Gancho).
* Un selector de `Diámetro Nominal` aparece de forma obligatoria en la fila del metrado atómico.

---

## 🎭 2. AGREGACIÓN VISUAL: ELEMENTOS VIRTUALES

Para evitar repetir textos infinitos (ej. "Encofrado Viga A" 20 veces) se usa una inyección en array.

### El Algoritmo de Cascada en Frontend:
1. El store descarga las filas reales planas: `[{ id: 1, elemento: 'Viga A' }, { id: 2, elemento: 'Viga A' }]`.
2. Un bucle `forEach` recorre los metrados de la partida hoja.
3. Si la propiedad `elemento` de la fila N es distinta a la de la fila N-1, se **inyecta un nuevo objeto falso (Cabecera Virtual)** en el array.
4. Las filas subsiguientes se renderizan con estilos diferentes (fondo blanco, línea muy delgada, y un carácter `↳` concatenado al principio del `detalle`) creando el efecto indentado de árbol.
5. Al editar la cabecera virtual en la UI, el sistema actualiza en un bucle map (en backend) el campo `elemento` de todas las hojas que colgaban de él.

---

## 🛠️ 3. PANELES MODALES Y HERRAMIENTAS

### 3.1. Gestión Partidas PC (Modal Aislado)
* **Objetivo:** Panel tipo Dashboard superpuesto (Z-index 500) donde se gestionan las partidas no oficiales.
* **Acciones CRUD:** Creación con prefijo automático `PC-ESP-RANDOM`. Permite Renombrar, Asignar PU o Eliminar.
* **Sincronización:** Botón mágico para ejecutar el RPC de Oficialización de Supabase (`oficializar_partida_pc`) hacia el catálogo. Muestra alertas de "Peligro" por irreversibilidad de la acción.

### 3.2. Panel Admin Presupuesto Master
* **Layout:** Entorno oculto protegido por ruta y boolean flag `user.es_administrador_presupuesto === true`.
* **Editor WBS:** Permite insertar sub-títulos y hojas libremente.
* **Valorización Selectiva (se_valoriza):** Switch verde/gris que marca si la fila contribuye en dinero (se valoriza) o solo controla físico, cambiando dinámicamente los Roll-ups de Zustand.
