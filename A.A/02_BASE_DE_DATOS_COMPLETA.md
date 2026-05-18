# 🐬 02. BASE DE DATOS Y LÓGICA POSTGRES (SUPABASE)

La base de datos es el corazón inquebrantable de la aplicación. Para reconstruir el sistema, el esquema SQL debe ser estrictamente relacional y tipado.

## 🗄️ 1. DICCIONARIO DE TABLAS (SCHEMA PUBLIC)

### 1.1. `ecosistema_usuarios` (Tabla Central de Autenticación)
* **Objetivo:** Almacenar usuarios, contraseñas y permisos del ecosistema.
* **Campos clave:** `id` (UUID), `dni_username` (TEXT, ÚNICO), `password` (TEXT), `nombre_completo` (TEXT, ÚNICO), `area`, `cargo`, `especialidad` (FK a tabla `especialidad`), `roles_apps` (JSONB).
* **Lógica del JSONB:** `roles_apps` guarda un objeto como `{"metrados": "lector", "liquidaciones": "editor", "admin_presupuesto": true}`. También contiene la configuración global del candado en un usuario virtual con `dni_username = 'SISTEMA'`.

### 1.2. `catalogo_partidas` (Presupuesto Base Oficial)
* **Objetivo:** Es el árbol WBS inmaculado del presupuesto contractual de la obra.
* **Campos clave:** `id` (UUID), `codigo` (TEXT ej. OE.1.1), `descripcion` (TEXT), `unidad` (TEXT), `is_title` (BOOLEAN), `parent_id` (FK a su propio catálogo para formar árbol jerárquico), `proyecto_id` (FK a tabla `proyectos` Hosp o Cont), `tipo_metrado` (TEXT: 'ESTANDAR', 'ACERO', 'HVAC'), `pu_actual` (NUMERIC), `metrado_programado` (NUMERIC).
* **Campos Económicos:** `metrado_anterior_acumulado`, `valorizacion_anterior`, `acumulado_anterior_qty` (para calcular saldos).

### 1.3. `partidas_personalizadas` (Tabla PC)
* **Objetivo:** Aislar temporalmente actividades no previstas en el catálogo sin alterar el presupuesto inmaculado.
* **Campos clave:** `id` (UUID), `codigo` (TEXT ej. PC-ARQ-123), `descripcion`, `unidad`, `modificacion`, `precio_unitario` (NUMERIC), `metrado_programado`.

### 1.4. `metrados` y `metrados_liquidaciones` (Multiplexación)
* **Objetivo:** Tablas idénticas en estructura. `metrados` es usada por residentes de obra a diario. `metrados_liquidaciones` es un "sandbox" aislado usado por los auditores finales.
* **Campos clave:** `id` (UUID), `fecha` (DATE), `frente`, `bloque`, `nivel` (TEXT para ubicación física 3D), `partida_id` (FK a catálogo), `custom_partida_id` (FK a PC, uno de los dos debe ser nulo).
* **Métricas Volumétricas:** `cantidad`, `longitud_area` (Largo), `ancho_empalme` (Ancho), `altura_gancho` (Alto), `nro_veces` (Veces), `parcial`, `total` (NUMERIC).
* **Metadatos Desnormalizados:** `codigo_partida`, `descripcion_partida`, `unidad` (TEXT). Se guardan duplicados aquí por seguridad y tolerancia a fallos por si se borra el catálogo.
* **Auditoría:** `autor_usuario` (TEXT), `created_at` (TIMESTAMP).

### 1.5. `logs_maestro_presupuesto` (Auditoría Administrativa)
* **Objetivo:** Proteger el catálogo ante mutaciones fraudulentas.
* **Campos clave:** `fecha` (TIMESTAMP), `usuario_nombre`, `accion` (ADD, EDIT, DELETE), `codigo_partida`, `detalle`, `valor_anterior` (JSONB), `valor_nuevo` (JSONB).

---

## ⚡ 2. LOGICA AVANZADA (RPCS Y TRIGGERS)

### 2.1. RPC: Oficialización Atómica (`oficializar_partida_pc`)
Es un Procedimiento Almacenado de PostgreSQL escrito en PL/pgSQL que realiza 4 pasos en una transacción `All-or-Nothing`:
1. Toma el `id` de una PC.
2. Clona sus datos insertando un registro en `catalogo_partidas` devolviendo el nuevo UUID.
3. Actualiza toda la tabla `metrados`: `UPDATE metrados SET partida_id = NUEVO_UUID, custom_partida_id = NULL WHERE custom_partida_id = VIEJO_UUID`.
4. Elimina el registro de la tabla PC.
Si algo falla a la mitad (por desconexión o FK), el motor de base de datos hace un ROLLBACK automático evitando la corrupción.

### 2.2. Aislamiento por Perfiles (Frontend Routing a DB)
Si el campo `area` del usuario de sesión es `LIQUIDACIONES`, el Store de Zustand inyecta dinámicamente un string en todas las llamadas a Supabase: `supabase.from('metrados_liquidaciones')`. Si es `OBRAS`, inyecta `supabase.from('metrados')`. Esto reaprovecha el 100% de la UI visualizando bases distintas.

### 2.3. Tolerancia a Errores FK (Reintento Agresivo)
Si se borra el código `OE.1` del catálogo y el residente intenta guardar un metrado con esa FK, PostgreSQL tirará el error de restricción `23503`.
El Frontend intercepta este código de error exacto, limpia las llaves foráneas (`partida_id = null`, `custom_partida_id = null`) y guarda el metrado de todas formas valiédose de los campos desnormalizados (`codigo_partida`, `descripcion_partida`), salvaguardando las métricas diarias del trabajador.
