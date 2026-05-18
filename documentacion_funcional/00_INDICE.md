# 📚 ÍNDICE DE LA DOCUMENTACIÓN FUNCIONAL
## Sistema de Gestión y Control de Metrados (V5.0)

Este directorio contiene la descripción detallada, exhaustiva y estructurada de **toda la funcionalidad** del Sistema de Control de Metrados. Cada documento está diseñado con un enfoque funcional y técnico para comprender cómo opera el software, sus reglas de negocio, motores de cálculo y arquitectura de datos en Supabase y React.

---

## 🗺️ Mapa de la Documentación

Haz clic en los enlaces de cada sección para acceder a la descripción detallada de su funcionalidad:

### 👤 [01. Control de Acceso, SSO y Seguridad](./01_CONTROL_ACCESO_SEGURIDAD.md)
* **Autenticación Centralizada:** Gestión de usuarios mediante la tabla `ecosistema_usuarios`.
* **Single Sign-On (SSO):** Sesiones unificadas persistentes por cookies con dominio compartido en producción (`.copgorecusco.com`).
* **Matriz de Roles y Privilegios:** Roles de Lector, Editor, Administrador de Presupuesto y Gerencia.
* **Seguridad y Aislamiento por Especialidad:** Bloqueo de visualización según la especialidad del usuario.
* **Candado de Bloqueo Temporal (Cierre Mensual):** Cierre de periodos históricos configurable desde el panel del sistema.
* **Control de Autoría:** Permisos de edición individualizados para Metradores.

### 🖥️ [02. Motor del DataGrid y Filtros Dinámicos](./02_MOTOR_DATAGRID_FILTROS.md)
* **Carga Masiva Virtualizada:** Visualización fluida de miles de registros mediante `@tanstack/react-virtual`.
* **Multiplexor de Base de Datos:** Selector de vista entre "Bandeja de Entrada Oficial" y "Partidas Creadas (PC)".
* **Buscador y Selector de Especialidad:** Barra de búsqueda en tiempo real e interactiva.
* **Filtros de Ubicación y Espacio:** Desplegables de Frente, Bloque y Nivel sincronizados.
* **Filtros de Período y Fechas:** Rápido de semana actual, semana anterior, por meses activos o por rangos personalizados.
* **Lógica de Agrupamiento por Elemento Virtual:** Agrupación visual en cascada (`↳ elemento`) que no corrompe la atomicidad de la base de datos.

### 📐 [03. Motores de Cálculo y Ecuaciones Matemáticas](./03_CALCULOS_MATEMATICOS_ECUACIONES.md)
* **Ecuación Volumétrica Estándar:** Multiplicación de 5 dimensiones físicas con valor neutro de vacíos (`1`).
* **Ecuación Siderúrgica de Acero (`kg`):** Redimensionamiento dinámico de la UI (ocultamiento de columna Ancho) y mapeo semántico (Longitud Recto, Alto Gancho).
* **Matriz Nominal de Diámetros:** Mapeo de pesos teóricos por metro lineal ($1/4"$, $3/8"$, $1/2"$, $5/8"$, $3/4"$, $1"$).

### 🛠️ [04. Módulo de Partidas Creadas en Campo (PC)](./04_GESTION_PARTIDAS_PC.md)
* **Aislamiento Lógico de Adicionales:** Registro en la tabla principal `metrados` sin contaminar el presupuesto contractual inmaculado.
* **Nomenclatura Automática Inteligente:** Generación de códigos correlativos `PC-[ESP]-[NUM]` para evitar desorden.
* **Renombrado y Sincronización Masiva:** Edición de códigos y descripciones que actualiza en cascada todos los metrados históricos.
* **Oficialización en Un Clic (RPC SQL):** Promoción de partida PC al catálogo oficial, reasignación automática de metrados e inyección en el Presupuesto Contractual en una única transacción de base de datos.

### 📊 [05. Control Físico, Financiero y Multiplexación](./05_CONTROL_FINANCIERO_ROLLUP.md)
* **Vista de Control Financiero (Valorización):** Columnas extendidas de PU Actual, Anterior Acumulado, Programado, Saldos Físicos/Monetarios y Valorizado del Período.
* **Aritmética Fractal y Roll-Up Zustand:** Hashing reactivo ultrarrápido $O(N)$ para sumas acumuladas de hojas y rollup recursivo hacia títulos superiores (`is_title = true`).
* **Multiplexación Metrados vs. Liquidaciones:** Enrutamiento CRUD invisible y automático a `metrados` o `metrados_liquidaciones` basado en el perfil de usuario.

### 🧬 [06. Resiliencia de Datos y Tolerancia a Fallos](./06_RESILIENCIA_MASCARAS.md)
* **Motor de Carga Paginada Recursiva:** Algoritmo que realiza peticiones sucesivas para superar el límite físico de 1,000 filas de Supabase.
* **Mecanismo de Reintento Agresivo (V8.1):** Captura de error de Foreign Key (`23503`) y fallback para guardar metrados sin referencia física en catálogo, evitando la pérdida de información en obra.
* **Algoritmo de Rescate de Huérfanos:** Generación de cabeceras virtuales dinámicas para metrados cuyos códigos oficiales fueron eliminados del catálogo.

### 📥 [07. Motor de Exportación a Excel](./07_EXPORTACION_EXCEL.md)
* **Generación en Cliente con ExcelJS:** Exportación instantánea y estructurada directamente en el navegador.
* **Planilla Estructurada de Metrados:** Formateo idéntico al estándar gubernamental, aplicando los estilos oficiales del Gobierno Regional de Cusco.
* **Pintado de Jerarquías:** Coloreado y formateo automático de 4 niveles estructurales (Títulos, Subtítulos, Partidas Hoja y Metrados).

### 👑 [08. Panel de Administración y Auditoría](./08_ADMIN_PRESUPUESTO.md)
* **Gestión Estructural del Presupuesto:** Permisos avanzados para Administradores del Presupuesto.
* **Auditoría de Cambios Masivos:** Tabla de registro de historial `logs_maestro_presupuesto` con tracking en formato JSONB.
* **Valorización Selectiva (`se_valoriza`):** Flag para ocultar o incluir partidas operativas en los cálculos monetarios.

---

> [!NOTE]
> Esta documentación describe el sistema correspondiente a la versión **V5.0 (Mayo 2026)**. Para cualquier modificación o mantenimiento del sistema, consulte el archivo [MASTER_CONTEXT.md](../MASTER_CONTEXT.md) ubicado en la raíz del proyecto.
