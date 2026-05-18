# 🛠️ MÓDULO DE PARTIDAS CREADAS EN CAMPO (PC)

Este documento detalla el funcionamiento del módulo de **Partidas Creadas (PC)**, un ecosistema diseñado para resolver la necesidad de registrar adicionales de obra o actividades no contempladas en el catálogo contractual, sin comprometer la integridad estructural del presupuesto original.

---

## 1. Aislamiento Lógico de Adicionales

En proyectos de construcción pública, el presupuesto oficial contractual es **inmaculado e inalterable** hasta la aprobación de un adicional oficial por resolución. Sin embargo, en el día a día del campo, surgen tareas imprevistas que se deben cuantificar y controlar de inmediato.

El sistema resuelve esto mediante un **Aislamiento Lógico Centralizado**:

```
                              [ TABLA UNIFICADA "METRADOS" ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [ Metrado Oficial ]                          [ Metrado Adicional (PC) ]
         `partida_id = OFFICIAL_UUID`                  `custom_partida_id = CUSTOM_UUID`
      `custom_partida_id = NULL`                        `partida_id = NULL`
```

### Características Funcionales:
* **Sin Fragmentación de Tablas:** Todas las mediciones (oficiales y PC) se guardan en la misma tabla física (`metrados`). Esto evita tener bases de datos fragmentadas.
* **Separación Reactiva:** El store de Zustand en el Frontend filtra en tiempo real los registros. Si el usuario está en la vista oficial, se ocultan los adicionales. Si activa el botón **Partidas Creadas**, la interfaz oculta lo oficial y visualiza de forma segregada únicamente los registros donde `custom_partida_id` no es nulo.

---

## 2. Nomenclatura Automática Inteligente

Para evitar que los metradores creen códigos caóticos (como "OE.99.99" o nombres vacíos), el sistema implementa una nomenclatura estricta y automática cuando se crea una partida PC:

1. **Lectura del Perfil:** El sistema lee la especialidad y siglas del usuario activo (ej. `ARQ` para arquitecto, `EST` para estructurista).
2. **Generación del Correlativo:** Asigna automáticamente el prefijo `PC`, seguido de la sigla de especialidad y un identificador aleatorio o correlativo numérico.
3. **Ejemplo de Código Generado:** `PC-EST-4819` (Partida Creada - Estructuras - Código Único).

---

## 3. Renombrado y Sincronización Masiva

Un problema común en obra es crear una partida provisional con un código y descripción genérica y, semanas después, recibir el código oficial aprobado. Modificar esto manualmente fila por fila sería una tarea titánica y propensa a errores.

El sistema implementa un **Motor de Sincronización en Cascada** para el renombrado:

```
[Usuario Edita Código de Partida PC en Modal]
   └── Muta "PC-ARQ-001" ➔ "OE.3.2.1.5"
          ├── 1. Actualiza tabla "partidas_personalizadas"
          └── 2. Actualiza en cascada TODAS las filas asociadas en la tabla "metrados"
                 (Actualiza "codigo_partida" y "descripcion_partida")
```

> [!IMPORTANT]
> Esta sincronización en cascada garantiza la integridad de los datos: todas las mediciones históricas registradas bajo la partida PC adoptan de forma instantánea y automática el nuevo código y descripción, evitando la existencia de registros desalineados u huérfanos.

---

## 4. Oficialización en Un Clic (RPC SQL)

La funcionalidad estrella del módulo de Partidas Creadas es la **Oficialización al Catálogo Contractual**. Cuando un trabajo adicional es formalmente aprobado por la supervisión, el administrador del presupuesto puede promover la partida al catálogo maestro oficial con un solo clic.

Esta operación se ejecuta en el servidor de base de datos de Supabase mediante un procedimiento almacenado (`oficializar_partida_pc`) ejecutado en una **transacción atómica hermética (All-or-Nothing)**:

### Paso a Paso del Procedimiento SQL:
1. **Promoción de Registro:** El motor lee los datos de la partida personalizada (`partidas_personalizadas`) y los inserta como una partida oficial en la tabla `catalogo_partidas` asociada al proyecto y con su respectivo código padre.
2. **Reasignación de Metrados:** Muta los metrados históricos. En todas las filas de la tabla `metrados` asociadas al ID provisional de la partida PC, actualiza el campo `partida_id` con el nuevo UUID oficial generado en el catálogo y setea a `NULL` el campo `custom_partida_id`.
3. **Cálculo de Línea Base:** Transfiere el total acumulado de metrados como `metrado_anterior_acumulado` e inyecta la valorización acumulada en el catálogo oficial.
4. **Limpieza Orgánica:** Elimina de forma segura la partida provisional de la tabla `partidas_personalizadas`.

> [!TIP]
> **Seguridad Transaccional:**
> Al ejecutarse dentro de una transacción única en Postgres, si algún paso del proceso falla (por ejemplo, pérdida de conexión a internet a mitad de la consulta), **toda la operación se revierte automáticamente** al estado original. Esto evita que ocurran fallos catastróficos como duplicar registros o dejar metrados huérfanos en el limbo.
