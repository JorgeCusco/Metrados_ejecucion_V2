# 📐 MOTORES DE CÁLCULO Y ECUACIONES MATEMÁTICAS

Este documento detalla el motor matemático del **Sistema de Gestión de Metrados (V5.0)**, el cual cuenta con bifurcación lógica según la naturaleza física del recurso medido (Cómputos métricos estándar versus Armaduras de acero).

---

## 1. Ecuación Volumétrica Estándar (Camino Estándar)

Se aplica a la gran mayoría de partidas del catálogo (ej. excavaciones, concretos, encofrados, pinturas, zócalos) que se miden en unidades como $m^3$, $m^2$, $m$, $und$ o $global$.

### La Ecuación Core:
$$\text{Parcial} = \text{Cantidad} \times \text{Largo} \times \text{Ancho} \times \text{Alto}$$
$$\text{Total} = \text{Parcial} \times \text{Veces}$$

### Regla de Seguridad Antivacios (Neutro Matemático):
En los formularios de registro de metrados tradicionales, si un usuario deja una celda vacía o nula, el sistema podría interpretar el valor como `0`, lo que causaría que el producto final de la multiplicación sea `0` (anulando toda la medición).

Para evitar esto, el motor matemático de la aplicación implementa una **Salvaguarda de Neutro Matemático**:
* Si alguna de las propiedades (`Cantidad`, `Largo`, `Ancho`, `Alto`, `Veces`) está vacía (`""`), es nula (`null`) o no está definida, **el motor le asigna invisiblemente el valor neutro `1`** al realizar el cálculo del Parcial o Total.
* *Ejemplo:* Si una medición de concreto en losa tiene Cantidad = 2, Largo = 4.50, Veces = 2, y deja Ancho y Alto vacíos, la ecuación se ejecuta como:
  $$\text{Parcial} = 2 \times 4.50 \times 1 \times 1 = 9.00$$
  $$\text{Total} = 9.00 \times 2 = 18.00$$

---

## 2. Ecuación Siderúrgica de Acero (Camino Acero `kg`)

Cuando el sistema detecta que la partida tiene como unidad de medida el **`kg`** (Fierro de Refuerzo o Acero Estructural), el motor de la interfaz se re-configura dinámicamente y activa la lógica siderúrgica:

```
¿Unidad === "kg"?
   ├── SÍ  --> Desmonta columna "Ancho" de la UI.
   │           Mapea cabecera "Largo" como "LONG. RECTO (R)"
   │           Mapea cabecera "Alto" como "GANCHO (G)"
   │           Exige seleccionar Diámetro (Matriz Nominal)
   └── NO  --> Muestra interfaz estándar (Cantidad | Largo | Ancho | Alto | Veces)
```

### La Ecuación Siderúrgica:
$$\text{Parcial} = (\text{Longitud Recto} + \text{Gancho}) \times \text{Cantidad} \times \text{Peso Nominal} (\Phi)$$
$$\text{Total} = \text{Parcial} \times \text{Veces}$$

---

## 3. Matriz Nominal de Diámetros y Pesos Teóricos

Cuando se activa el camino siderúrgico, la aplicación obliga a seleccionar el **Diámetro Nominal ($\Phi$)** del fierro a registrar. El sistema cruza este diámetro con una tabla interna indexada de pesos unitarios por metro lineal (según los estándares de fabricación de acero siderúrgico y las normas de control de calidad):

| Diámetro Nominal ($\Phi$) | Peso Nominal Teórico ($kg/m$) | Propósito Estructural |
| :---: | :---: | :--- |
| **$1/4"$** | **$0.250$** | Estribos pequeños, armaduras ligeras. |
| **$3/8"$** | **$0.560$** | Estribos estándar, viguetas, losas aligeradas. |
| **$1/2"$** | **$0.994$** | Refuerzo longitudinal en columnas y vigas de viviendas. |
| **$5/8"$** | **$1.552$** | Vigas principales, zapatas medianas, placas. |
| **$3/4"$** | **$2.235$** | Elementos de alta demanda sísmica (obras civiles grandes). |
| **$1"$** | **$3.973$** | Zapatas masivas, pilotes, grandes vigas de cimentación. |

### Ejemplo Funcional de Cálculo de Fierro:
Un metrador registra el acero longitudinal en una zapata:
* **Diámetro:** $5/8"$ (Peso nominal = $1.552\ kg/m$).
* **Cantidad de Varillas:** 12 varillas.
* **Longitud Tramo Recto:** 1.80 metros.
* **Gancho Doblado (Doble extremo):** 0.20 metros.
* **Número de Veces (Zapatas idénticas):** 3 zapatas.

**Ejecución del Motor Matemático:**
1. Suma de longitudes lineales de una varilla:
   $$1.80\ m + 0.20\ m = 2.00\ m\text{ (Longitud total de varilla)}$$
2. Multiplicación por la cantidad y el peso unitario del diámetro de $5/8"$:
   $$\text{Parcial} = 2.00\ m \times 12 \text{ varillas} \times 1.552\ kg/m = 37.248\ kg\text{ (Peso de una zapata)}$$
3. Multiplicación por el número de repeticiones (Veces):
   $$\text{Total} = 37.248\ kg \times 3 \text{ zapatas} = 111.74\ kg$$

> [!TIP]
> **Precisión Decimal en Ingeniería Civil:**
> Para garantizar que el presupuesto no presente discrepancias de céntimos en auditorías estatales del GORE Cusco, el sistema almacena todos los cálculos de cantidades, parciales y totales usando variables de alta precisión numérica (`NUMERIC` en base de datos PostgreSQL) y formatea la visualización en pantalla redondeando estrictamente a **dos decimales** (`Intl.NumberFormat` con formato de localización en español de Perú `es-PE`).
