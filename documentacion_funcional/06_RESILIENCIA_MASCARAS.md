# 🧬 RESILIENCIA DE DATOS Y TOLERANCIA A FALLOS

Este documento detalla los algoritmos avanzados de tolerancia a fallos, resiliencia y recuperación automática de datos implementados en el **Sistema de Gestión de Metrados (V5.0)**.

---

## 1. Motor de Carga Paginada Recursiva (Bypass Límite de 1,000 Filas)

Supabase impone un límite de seguridad estricto en su servidor REST que restringe las respuestas a un máximo de **1,000 registros por petición**. Esto evita que consultas pesadas saturen la base de datos, pero impide que aplicaciones con grandes volúmenes de datos carguen el catálogo completo de un solo golpe.

Para superar este límite físico de forma transparente, el store de Zustand implementa una **Paginación Dinámica Automática**:

```
[ fetchCatalogoMaestro / fetchMetrados ]
         │
         ├── 1. Lanza query: `.range(0, 999)`
         ├── 2. ¿Devolvió 1000 filas?
         │         ├── SÍ  ➔ Hay más páginas. Lanza `.range(1000, 1999)`
         │         └── NO  ➔ Última página alcanzada.
         └── 3. Consolida todas las páginas en un único array local.
```

### Comportamiento Funcional:
* El sistema realiza de forma autónoma llamadas encadenadas asíncronas en bloques de 1,000.
* Al finalizar el bucle, consolida toda la información en la memoria de la aplicación, permitiendo cargar y buscar sin problemas en catálogos de más de 5,799 partidas y listas de metrados de gran densidad sin requerir intervención del usuario.

---

## 2. Mecanismo de Reintento Agresivo (Tolerancia a Errores de FK)

En las bases de datos relacionales, las restricciones de llave foránea (Foreign Keys) garantizan que un metrado no se pueda guardar si no apunta a un UUID válido en el catálogo oficial. Si un administrador modifica o limpia el catálogo a mitad de la jornada laboral, el metrado de un obrero en campo podría rebotar con un error técnico catastrófico (`Constraint Error 23503`).

Para evitar la pérdida de información del trabajo diario de los ingenieros, el sistema implementa un **Plan de Contingencia de Reintento Agresivo**:

```
[Intento de Inserción de Metrado con UUID de Catálogo]
                         │
                         ├── Falla por Violación de FK (Error 23503)
                         ▼
     [Activar Mecanismo de Reintento Agresivo]
                         │
                         ├── 1. Remueve las referencias FK ("partida_id", "custom_partida_id")
                         ├── 2. Lanza reintento con datos denormalizados puros
                         ├── 3. Guarda el registro de forma segura en la base de datos
                         └── 4. Retorna éxito e informa al Frontend
```

### Valor Funcional:
* **Cero pérdida de información:** El metrado se guarda en el servidor de forma segura conservando su código de texto, descripción, fecha y mediciones, en lugar de bloquear el navegador o descartar el trabajo.
* **Resiliencia Operativa:** El metrador puede seguir trabajando sin interrupción aunque se estén realizando migraciones estructurales pesadas en el catálogo.

---

## 3. Algoritmo de Rescate de Huérfanos (Cabeceras Virtuales)

Cuando el catálogo es modificado de forma drástica, algunos metrados históricos guardados previamente pueden quedar "huérfanos" al apuntar a códigos de partidas que ya no existen en la lista activa de la especialidad seleccionada.

En lugar de ocultar estos registros (lo que falsearía el avance acumulado y crearía problemas contables), la tabla de metrados ejecuta en el Frontend un **Algoritmo de Rescate y Creación de Cabeceras Virtuales**:

1. **Escaneo de Coincidencias:** Durante el agrupamiento de jerarquías de la planilla, el sistema escanea todos los metrados activos y los compara contra el catálogo cargado.
2. **Identificación de Huérfanos:** Si detecta un metrado cuyo código no tiene un nodo hoja correspondiente en el catálogo, lo marca como "Huérfano".
3. **Inyección de Cabecera Virtual:** El motor visual crea e inyecta dinámicamente en el DataGrid una **Cabecera Virtual Temporal** para ese código faltante, asignándole el distintivo de "Entrada Manual / Sin Item (ET)".
4. **Renderizado Seguro:** React renderiza el metrado histórico anidado debajo de esta cabecera virtual, garantizando que el 100% de la producción del proyecto sea visible y auditable en todo momento.
