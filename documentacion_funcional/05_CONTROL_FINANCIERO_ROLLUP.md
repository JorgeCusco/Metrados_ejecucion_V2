# 📊 CONTROL FÍSICO, FINANCIERO Y MULTIPLEXACIÓN

Este documento detalla el motor de seguimiento financiero, los algoritmos de acumulación recursiva (Roll-up) y la multiplexación de entornos entre Metrados de Obra y Liquidaciones del **Sistema de Gestión de Metrados (V5.0)**.

---

## 1. Vista de Control Financiero (Valorización)

La planilla cuenta con un switch que permite alternar la vista entre el modo **Cantidad** (control físico de obra) y el modo **Valorizado** (control monetario). Al activar el modo valorizado, se expanden las siguientes dimensiones financieras integradas en el Catálogo:

```
[ PU Actual ] ➔ [ Metrado Acumulado ] ➔ [ Metrado Programado ] ➔ [ Saldo Físico ] ➔ [ Saldo Monetario ] ➔ [ Valorizado Mes ] ➔ [ Costo Ejecutado ]
```

* **PU Actual (S/):** Precio Unitario pactado para la partida en el catálogo contractual.
* **Metrado Acumulado Anterior:** Sumatoria de las mediciones físicas aprobadas en periodos anteriores (antes de la fecha de inicio del control por sistema).
* **Metrado Programado:** Meta física total contractual (Línea Base).
* **Saldo Físico:** Diferencia matemática de la meta física versus el avance acumulado actual:
  $$\text{Saldo Físico} = \text{Metrado Programado} - (\text{Acumulado Anterior} + \text{Metrado Sistema})$$
* **Saldo Monetario (S/):** Valorización restante por ejecutar de la partida:
  $$\text{Saldo Monetario} = \text{Saldo Físico} \times \text{PU Actual}$$
* **Valorizado Mes (S/):** Monto económico facturado bruto correspondiente al avance exclusivo del período seleccionado en la pantalla:
  $$\text{Valorizado Mes} = \text{Metrado Registrado en Período} \times \text{PU Actual}$$
* **Costo Ejecutado (S/):** Valorización total acumulada histórica del item:
  $$\text{Costo Ejecutado} = (\text{Acumulado Anterior} + \text{Metrado Sistema}) \times \text{PU Actual}$$

---

## 2. Aritmética Fractal y Motor Roll-Up Zustand

Para calcular estos totales económicos en milisegundos directamente en la interfaz del navegador, el store de Zustand ejecuta un **Algoritmo de Acumulación Fractal en Dos Capas**:

```
[Metrados Atómicos en DB]
         │
         ▼  (Capa 1: O(N) Reductor HASH)
   [partidaTotals] (Ej: "OE.2.3.9.1" ➔ 450.50 m3)
         │
         ▼  (Capa 2: Roll-Up por Prefijos)
   [titleTotals] (Ej: "OE.2" absorbe a "OE.2.3.X.X" ➔ 8,450.00 m3)
```

### Capa 1: Totales de Partidas Hoja (`partidaTotals`)
El sistema barre en un solo bucle de alta velocidad $O(N)$ todos los metrados individuales filtrados. Crea un mapa indexado de claves donde asocia cada código de partida con la sumatoria de sus metrados en el período.
* *Resultado:* `{ "OE.2.3.9.1": 45.20, "OE.2.3.9.2": 110.00 }`

### Capa 2: Roll-Up Recursivo de Estructura (`titleTotals`)
Como las partidas jerárquicas tipo títulos estructurales (`OE.2 ESTRUCTURAS` o `OE.2.3 CONCRETO ARMADO`) no tienen metrados asociados directamente a ellas, el motor realiza una acumulación en cascada ascendente:
1. Recorre todas las claves de partidas calculadas en la primera capa.
2. Utiliza comparación de cadenas de texto (`String.startsWith`). Si el código de una partida hoja empieza con el prefijo del título (ej. `"OE.2.3.9.1"`.startsWith(`"OE.2.3"`)), su valor numérico se acumula al saldo del título.
3. Esto permite que los títulos padres e hijos muestren en pantalla de forma instantánea el costo o metrado consolidado que cuelga de todas sus ramas secundarias.

---

## 3. Multiplexación Metrados vs. Liquidaciones

Para evitar tener que desarrollar dos aplicaciones diferentes para el equipo de Campo (ingenieros residentes que miden avance diario) y el equipo de Liquidaciones (auditores que consolidan el cierre final), la aplicación utiliza una arquitectura de **Multiplexación de Entornos en Tiempo de Ejecución (Zustand Routing)**.

### Funcionamiento del Enrutador Invisible:
Cuando se inicia sesión, el sistema analiza el área del usuario en `ecosistema_usuarios`:

```
               [ ACCIÓN CRUD EN FRONTEND (Insert, Edit, Delete) ]
                                      │
                                      ▼
                        [ useMetradosStore Router ]
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼ (Área !== 'LIQUIDACIONES')              ▼ (Área === 'LIQUIDACIONES')
          [ Tabla: "metrados" ]                   [ Tabla: "metrados_liquidaciones" ]
          * Registro de avance diario             * Entorno aislado de auditoría
          * Con vinculación de cuadrillas         * Aprobación oficial final
```

### Ventajas de la Multiplexación:
1. **Aislamiento Total:** El equipo de Liquidaciones trabaja en su propia tabla física independiente, evitando alterar o borrar accidentalmente los metrados diarios ingresados por los residentes de obra.
2. **Cero Duplicación de Código:** Ambos equipos utilizan exactamente los mismos componentes visuales (`PlanillaMetrados`, `MetradosTable`, filtros). Las mejoras y optimizaciones del software se programan una sola vez y benefician a ambos entornos por igual, ahorrando el 50% de esfuerzo de desarrollo.
