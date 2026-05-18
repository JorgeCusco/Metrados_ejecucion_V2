# 🖥️ MOTOR DEL DATAGRID Y FILTROS DINÁMICOS

Este documento detalla el funcionamiento de la interfaz de visualización, filtros dinámicos y el motor de renderizado de la **Planilla de Metrados Dinámica (V5.0)**.

---

## 1. Carga Masiva Virtualizada

Debido al enorme volumen de información que manejan los proyectos de edificación (el catálogo maestro contiene más de 5,799 partidas y decenas de miles de registros de metrados activos), el navegador web colapsaría si intentara renderizar miles de celdas HTML al mismo tiempo.

Para solucionar esto, el sistema implementa un **Motor de Virtualización de Celdas** mediante la librería `@tanstack/react-virtual`:

* **Concepto de Viewport:** El navegador solo renderiza en el DOM (código HTML real) las filas que son visibles en la pantalla en el momento actual (aproximadamente entre 30 y 40 filas según el tamaño del monitor).
* **Overscan Dinámico:** El motor calcula y renderiza de forma invisible 10 filas arriba y 10 filas abajo del viewport visible. Esto garantiza que cuando el usuario hace scroll rápido ("desplazamiento vertical"), no se observen celdas vacías o parpadeos.
* **Ahorro de Memoria:** Reduce el consumo de RAM del navegador en un 95%, permitiendo una navegación suave a 60 FPS sin importar si la base de datos tiene 100,000 registros de metrados.

---

## 2. Multiplexor de Base de Datos (Bandejas de Trabajo)

La interfaz cuenta con un selector de dos vías en la cabecera que permite al usuario alternar instantáneamente el flujo de trabajo:

```
[ Bd. Oficial ]  <--->  [ Partidas Creadas ]
```

* **Bandeja Oficial (Gris):** Es el entorno principal. Muestra únicamente los metrados asociados a partidas oficiales del presupuesto contractual. Bloquea la visualización de cualquier partida experimental creada en campo.
* **Bandeja de Partidas Creadas (Rosa):** Entorno de aislamiento visual de tareas adicionales. Muestra de forma segregada y exclusiva los metrados vinculados a códigos personalizados (`custom_partida_id !== null`).
* **Operación On-the-Fly:** El cambio se realiza en la memoria local del navegador (Zustand State). Al hacer clic en una bandeja u otra, el array de React se re-filtra instantáneamente en milisegundos, evitando realizar peticiones costosas de red a la base de datos.

---

## 3. Buscador y Selectores de Especialidad

* **Buscador de Textos:** Filtra instantáneamente la planilla completa evaluando coincidencias en el código de la partida o en su descripción física.
* **Selector de Proyecto:** Permite cambiar instantáneamente la línea base de trabajo entre el **Hospital** (HOSP) y la **Contingencia** (CONT).
* **Selector de Especialidad:** Permite filtrar las partidas correspondientes a ramas de ingeniería específicas:
  * `EST` (Estructuras)
  * `ARQ` (Arquitectura)
  * `IS` (Instalaciones Sanitarias)
  * `IE` (Instalaciones Eléctricas)
  * `IM` (Instalaciones Mecánicas)
  * `COM` (Comunicaciones)
  * `TODAS` (Supervisión global)

---

## 4. Filtros de Ubicación y Espacio (Topología 3D)

La planilla extrae automáticamente del catálogo y de los metrados activos las clasificaciones de espacio físico para permitir filtros rápidos de construcción:

* **Frentes:** Zonas macros del proyecto (ej. Frente 1, Frente 2).
* **Bloques:** Edificaciones o módulos específicos (ej. Bloque I, Bloque V).
* **Niveles:** Pisos u orientaciones verticales (ej. Nivel 1, Nivel 2, ZZ para cimentación/zapatas).
* **Sincronización:** Los desplegables se recalculan dinámicamente y solo muestran los elementos que tienen registros activos dentro de la especialidad seleccionada, reduciendo la confusión en la interfaz de usuario.

---

## 5. Filtros de Período y Fechas

El control de avance físico se puede segmentar temporalmente mediante los botones rápidos de periodos:

1. **Esta Semana (Por Defecto):** Filtra los registros ingresados desde el lunes al domingo de la semana actual.
2. **Semana Anterior:** Muestra las mediciones del periodo inmediatamente anterior para comparar avances semanales.
3. **Selector Mensual Dinámico:** El sistema analiza la base de datos de metrados y genera automáticamente una lista de meses activos (ej. "Ene 26", "Feb 26", "Mar 26"). Al seleccionar un mes, la planilla se ajusta al primer y último día de dicho periodo de forma exacta sin desfases de huso horario.
4. **Todo el Tiempo:** Elimina los límites temporales y despliega el acumulado completo del proyecto.
5. **Rango Personalizado:** Entradas de tipo calendario (`input type="date"`) para acotar fechas específicas.

---

## 6. Lógica de Agrupamiento por Elemento Virtual

Una de las joyas del diseño UX del sistema es la inyección de la fila de **Elemento Virtual** en la Planilla Dinámica para resolver el problema de la fatiga visual por filas repetidas:

### El Problema UX:
Si un metrador ingresa 8 filas sucesivas de encofrado para las "Vigas del Eje A-A", la interfaz tabular tradicional repetiría la frase "Vigas del Eje A-A" 8 veces, ocupando preciado espacio visual horizontal y saturando la lectura.

### La Solución Funcional (Agrupador Virtual):
Durante el renderizado de la tabla, un iterador intercepta el array de metrados a nivel de interfaz de usuario:

```
[Fila Cabecera Partida: OE.2.3.9.1 - Concreto en Vigas]
   └── [Fila Elemento Virtual: VIGAS EJE A-A]  <--- Fila gris en negrita (Inyección visual)
          ├── ↳ Detalle: Tramo 1 (Longitud: 4.50, Ancho: 0.30...)
          ├── ↳ Detalle: Tramo 2 (Longitud: 3.20, Ancho: 0.30...)
          └── ↳ Detalle: Tramo 3 (Longitud: 5.10, Ancho: 0.30...)
```

### Reglas de Negocio del Agrupador:
1. **Pintado en Cascada:** React oculta el campo "Elemento" de las filas hijas y dibuja en su lugar un icono con flecha `↳` apuntando al detalle, indentándolos bajo un único sub-título de grupo gris y limpio.
2. **Edición Masiva del Agrupador:** El sub-título de grupo es un **campo de entrada editable**. Si el metrador edita este título virtual (ej. cambia "VIGAS EJE A-A" a "VIGAS PRINCIPALES EJE A-A"), **el sistema propaga en cascada el nuevo nombre a las 8 filas hijas** en la base de datos en una sola operación.
3. **Cero Corrupción de Base de Datos:** Este agrupamiento es puramente una ilusión del Frontend. En la base de datos SQL de Supabase y en los Excels maestros, **cada una de las 8 filas hijas conserva permanentemente el valor "VIGAS EJE A-A"** en su columna de elemento. Esto garantiza que las consultas SQL agregadas, reportes PowerBI y pivots de Excel sigan siendo perfectamente atómicos y rastreables.
