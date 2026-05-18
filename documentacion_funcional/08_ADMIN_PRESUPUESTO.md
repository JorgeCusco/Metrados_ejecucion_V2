# 👑 PANEL DE ADMINISTRACIÓN Y AUDITORÍA

Este documento detalla el funcionamiento del módulo de **Administración Maestra del Presupuesto (Admin Maestro)** y los mecanismos de auditoría implementados para el control de cambios estructurales en el **Sistema de Gestión de Metrados (V5.0)**.

---

## 1. Perfil del Administrador del Presupuesto

Las herramientas de modificación estructural del presupuesto están estrictamente restringidas. Solo los usuarios con permisos avanzados pueden acceder al panel `/admin/presupuesto` de la cabecera:

* **Privilegios en Base de Datos:** Se controlan mediante el flag booleano `es_administrador_presupuesto = true` o la clave de rol `admin_presupuesto = true` en el JSONB de permisos del usuario.
* **Bypass de Candados:** Los administradores tienen autorización total para registrar o editar metrados en periodos históricos cerrados (candados globales de fecha), lo que permite realizar correcciones de liquidación autorizadas por la entidad.

---

## 2. Gestión Estructural del Catálogo

El panel maestro permite realizar modificaciones directas en la base de datos del catálogo del presupuesto en caliente:

* **Adición de Partidas Oficiales:** Permite inyectar nuevos códigos WBS en el catálogo del proyecto activo (Hospital o Contingencia), definiendo su código, descripción, unidad, tipo de metrado (Estándar, Acero, HVAC) y metrado programado original.
* **Edición de Metas Contractuales:** Permite actualizar el Precio Unitario (`pu_actual`) y la meta física contractual (`metrado_programado`) de cualquier partida, recalculando automáticamente en cascada los saldos pendientes y costos ejecutados.

---

## 3. Valorización Selectiva (`se_valoriza`)

Una de las grandes adiciones funcionales de las últimas versiones es el control de **Valorización Selectiva**:

### El Problema Operativo:
En ocasiones, la residencia de obra necesita cuantificar actividades operativas de control interno en campo (ej. pruebas hidráulicas parciales, movimiento temporal de tierras, o controles de SSOMA) que no se facturan directamente a la supervisión gubernamental (no tienen costo contractual directo).

### La Solución Funcional (Flag `se_valoriza`):
El panel del administrador cuenta con un control toggle para habilitar o deshabilitar la valorización de cada partida:

* **`se_valoriza = true` (Por Defecto - Emerald background):** La partida contribuye activamente a la valorización económica. Sus metros ejecutados se multiplican por su precio unitario e influyen en el **Valorizado Mes** y **Costo Ejecutado**.
* **`se_valoriza = false` (Grey/Amber background):** El item se utiliza exclusivamente para control de avance físico (unidades), pero su valor monetario es ignorado en todos los cálculos económicos y reportes de valorización.

---

## 4. Auditoría de Cambios Estructurales (`logs_maestro_presupuesto`)

Para evitar modificaciones desautorizadas o maliciosas en los catálogos del presupuesto, cada alteración realizada desde el panel de administración gatilla un **Log de Auditoría Automatizado** en Supabase:

### Estructura del Registro de Auditoría:
* **`fecha`:** Timestamp preciso del momento de la alteración.
* **`usuario_nombre`:** Nombre completo del administrador responsable del cambio.
* **`accion`:** Clasificación de la operación (ADD, EDIT, DELETE, MOVE).
* **`codigo_partida`:** Código WBS de la partida alterada.
* **`detalle`:** Descripción textual legible de la operación.
* **`valor_anterior` (JSONB):** Captura fotográfica completa del registro en su estado previo a la edición.
* **`valor_nuevo` (JSONB):** Estado resultante del registro post-edición.

```sql
-- Ejemplo de Registro de Log en Supabase
{
  "id": "7ac15b82-9f3b-4c28-98e1-56c9a3b74d94",
  "usuario_nombre": "Jorge Cusco",
  "accion": "EDIT",
  "codigo_partida": "OE.2.3.9.1",
  "valor_anterior": { "pu_actual": 450.00, "metrado_programado": 1200.00 },
  "valor_nuevo": { "pu_actual": 485.50, "metrado_programado": 1250.00 }
}
```

> [!IMPORTANT]
> **Seguridad y Transparencia:**
> Al almacenarse los estados anteriores y nuevos en formato **JSONB nativo** de PostgreSQL, el sistema cuenta con un rastro de auditoría irrefutable e histórico que permite revertir cambios accidentales y diagnosticar discrepancias en liquidaciones oficiales rápidamente.
