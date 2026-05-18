# 🐬 04. STATE MANAGEMENT Y LÓGICA MATEMÁTICA EN CLIENTE

Este es el cerebro del "Buscador de Metrados V5.0". Debes recrear con extrema fidelidad la lógica de `Zustand`, ya que el 100% de los cálculos volumétricos y valorizaciones ocurren en la RAM del navegador del usuario.

## 🧮 1. LOS DOS CAMINOS DE LA ECUACIÓN DE METRADOS

Cuando un usuario registra las dimensiones, la UI invoca la función de cálculo antes de guardar en Base de Datos. Existe una bifurcación lógica estricta:

### 1.1. Camino Volumétrico Estándar ($m^3, m^2, und$)
Para partidas clásicas (concreto, pintura, excavación).
* **Problema del Vacío:** Un input vacío `""` o Nulo castigado a flotante devuelve `0`. Multiplicar por cero anularía todo.
* **Salvaguarda de Neutro:** El motor detecta campos vacíos/nulos en Cant, Largo, Ancho, Alto o Veces y les inyecta el valor matemático neutro `1`.
* **Fórmula:** `Parcial = (Cant || 1) * (Largo || 1) * (Ancho || 1) * (Alto || 1)`. `Total = Parcial * (Veces || 1)`.

### 1.2. Camino Siderúrgico de Acero ($kg$)
Para el fierro corrugado estructural. Requiere la Matriz Nominal del ACERO.
* **Mapeo Dimensional:** La UI fuerza el uso de un selector (ej. `5/8"`). Se extrae el Peso Nominal (ej. $1.552\ kg/m$).
* **Suma Lineal:** Se desmonta el Ancho. El Largo se toma como "Tramo Recto", el Alto como "Gancho Doblado".
* **Fórmula:** `Parcial = (Tramo Recto + Gancho) * Cantidad * PesoNominal`. `Total = Parcial * Veces`.

---

## ⚡ 2. CÁLCULO FRACTAL EN CASCADA (ROLL-UP)

Cuando el usuario quiere ver cuánto dinero va gastando el Bloque 1 de Estructuras, no se pregunta a la Base de Datos. Zustand lo calcula en vivo (0.01 ms).

### Fase 1: Hash Map Atómico O(N)
Se itera una sola vez todo el array de metrados filtrados actuales (ej. 5,000 registros de la semana).
Se genera un objeto diccionario (Hash Map) donde la llave es el código del nodo hoja (ej. `OE.1.1.1`) y el valor es la suma matemática de las cantidades.
* `partidaTotals["OE.1.1.1"] += metrado.total`
* `partidaValorizada["OE.1.1.1"] += (metrado.total * catalogoItem.pu_actual)`

### Fase 2: Reducción Recursiva Ascendente (WBS Hashing)
Las partidas tipo TÍTULO (ej. `OE.1 Obras Provisionales`) no tienen metrados directos.
El motor iterador recorre todas las claves del Hash anterior.
Si un código de hoja `empieza con` (String `startsWith`) el prefijo del código del Título actual, le cede sus puntos sumatorios.
* Ejemplo: `OE.1.1.1.2` transfiere valor a `OE.1.1.1`, a `OE.1.1` y a `OE.1`.
Esto asegura que las celdas grises oscuras (Títulos 0) tengan el totalizador millonario de todo el proyecto en tiempo real.

---

## 🚦 3. APLICACIÓN DE BANDERA `se_valoriza` EN CÁLCULO
Al realizar el Roll-up (Capa 2), el algoritmo evalúa la bandera booleana `se_valoriza` proveniente del catálogo.
* Si `se_valoriza === false`: El motor computa la cantidad (para el saldo físico), pero salta silenciosamente la multiplicación de la moneda (`+= 0`). De este modo el Roll-up jerárquico financiero no se infla con tareas exclusivas de control operativo en campo, manteniendo consistencia en las exportaciones contables.
