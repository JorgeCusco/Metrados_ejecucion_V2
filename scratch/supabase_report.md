# Análisis de Supabase a través de API REST

## Tabla: proyectos
*Total de filas estimadas: 2*

**Columnas Detectadas (3):**
- id
- codigo
- nombre

**Muestra de datos:**
```json
[
  {
    "id": "a0d14189-f8c5-40ff-9d90-975f22f4b6fd",
    "codigo": "HOSP",
    "nombre": "Proyecto Hospital"
  },
  {
    "id": "c530b04a-2710-4422-8df6-cfd130b6f54e",
    "codigo": "CONT",
    "nombre": "Proyecto Contingencia"
  }
]
```

## Tabla: catalogo_partidas
*Total de filas estimadas: 5947*

**Columnas Detectadas (21):**
- id
- codigo
- descripcion
- unidad
- jerarquia
- nivel_jerarquia
- is_title
- parent_id
- proyecto_id
- tipo_metrado
- modificacion
- precio_unitario
- cantidad_presupuesto
- acumulado_anterior_qty
- metrado_anterior_acumulado
- valorizacion_anterior
- pu_actual
- metrado_programado
- valorizacion_programada
- se_valoriza
- user_id

**Muestra de datos:**
```json
[
  {
    "id": "d20bd39b-7011-4b4c-9763-1ba5d0e6dee4",
    "codigo": "OE.1",
    "descripcion": "OBRAS PROVISIONALES, TRABAJOS PRELIMINARES, SEGURIDAD Y SALUD.",
    "unidad": "",
    "jerarquia": [],
    "nivel_jerarquia": 2,
    "is_title": true,
    "parent_id": null,
    "proyecto_id": "a0d14189-f8c5-40ff-9d90-975f22f4b6fd",
    "tipo_metrado": "ESTANDAR",
    "modificacion": "SM",
    "precio_unitario": null,
    "cantidad_presupuesto": 0,
    "acumulado_anterior_qty": 0,
    "metrado_anterior_acumulado": 0,
    "valorizacion_anterior": 0,
    "pu_actual": 0,
    "metrado_programado": 0,
    "valorizacion_programada": 0,
    "se_valoriza": true,
    "user_id": null
  },
  {
    "id": "11a51330-da25-4598-944d-62d5b0c850ed",
    "codigo": "OE.1.6.20",
    "descripcion": "Raspado de giganton para optencion de goma o recina",
    "unidad": "UND",
    "jerarquia": null,
    "nivel_jerarquia": null,
    "is_title": false,
    "parent_id": null,
    "proyecto_id": "a0d14189-f8c5-40ff-9d90-975f22f4b6fd",
    "tipo_metrado": "ESTANDAR",
    "modificacion": "PN7",
    "precio_unitario": 0,
    "cantidad_presupuesto": 90,
    "acumulado_anterior_qty": 0,
    "metrado_anterior_acumulado": 0,
    "valorizacion_anterior": 0,
    "pu_actual": 32.07,
    "metrado_programado": 0,
    "valorizacion_programada": 2886.3,
    "se_valoriza": true,
    "user_id": null
  }
]
```

## Tabla: personal
*Total de filas estimadas: 780*

**Columnas Detectadas (12):**
- id
- dni
- nombre_original
- nombre_formateado
- especialidad
- cuadrilla
- categoria
- sexo
- telefono
- condicion
- oficio
- fecha_ingreso

**Muestra de datos:**
```json
[
  {
    "id": "597333f8-fbd7-45ed-96da-9ec3699a62a8",
    "dni": "44721474",
    "nombre_original": "ZAMATA PUCYURA, BRAULIO",
    "nombre_formateado": "Braulio Zamata Pucyura",
    "especialidad": null,
    "cuadrilla": null,
    "categoria": "PEON II",
    "sexo": "M",
    "telefono": "975037039",
    "condicion": "OBRERO",
    "oficio": "GUARDIAN-GUARDIAN",
    "fecha_ingreso": "2024-02-01"
  },
  {
    "id": "38d726d5-fb1b-4eb7-859c-38579a8995c0",
    "dni": "42308104",
    "nombre_original": "YANA HUILLCA, EXALTACION",
    "nombre_formateado": "Exaltacion Yana Huillca",
    "especialidad": null,
    "cuadrilla": null,
    "categoria": "OPERARIO II",
    "sexo": "M",
    "telefono": "948109276",
    "condicion": "OBRERO",
    "oficio": "GASFITERIA-GASFITERIA",
    "fecha_ingreso": "2024-02-10"
  }
]
```

## Tabla: usuarios_ap
*Error: Could not find the table 'public.usuarios_ap' in the schema cache*

## Tabla: metrados_obrasprovisionales
*Error: Could not find the table 'public.metrados_obrasprovisionales' in the schema cache*

## Tabla: metrados_arquitectura
*Error: Could not find the table 'public.metrados_arquitectura' in the schema cache*

## Tabla: liquidaciones
*Error: Could not find the table 'public.liquidaciones' in the schema cache*

## Tabla: metrados
*Total de filas estimadas: 39904*

**Columnas Detectadas (35):**
- id
- fecha
- frente
- bloque
- nivel
- cuadrilla
- partida_id
- custom_partida_id
- elemento
- detalle
- diametro
- cantidad
- longitud_area
- ancho_empalme
- altura_gancho
- parcial
- nro_veces
- total
- hvac_item_id
- autor_usuario
- created_at
- proyecto
- codigo_partida
- descripcion_partida
- unidad
- hvac_factor
- hvac_item_type
- especialidad
- grado
- user_id
- plano_sist
- plano_num
- sin_plano
- obs_motivo
- obs_detalle

