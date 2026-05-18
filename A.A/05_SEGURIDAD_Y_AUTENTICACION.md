# 🐬 05. SEGURIDAD, AUTENTICACIÓN Y ROLES EN EL FRONTEND/BACKEND

Para la reconstrucción del sistema, la matriz de seguridad y reglas de acceso debe replicarse al pie de la letra, ya que es lo que garantiza que la información oficial no sea alterada.

## 🔐 1. ESTRATEGIA SINGLE SIGN-ON (SSO)
El sistema pertenece a un ecosistema más grande. El login consulta `ecosistema_usuarios` mediante `dni_username`.
La sesión NO se guarda en LocalStorage. Se inyecta en una cookie nombrada `gore_cusco_session`.
* En local: Funciona estándar.
* En Prod: El flag de dominio se fuerza a `.copgorecusco.com` (SSO entre subdominios). La expiración es a los 7 días.

## 🛡️ 2. MATRIZ DE RUTEO Y PERMISOS FUNCIONALES (ROLES)

El `useAuthStore` maneja funciones verificadoras que abren/cierran candados visuales y lógicos en la SPA.

### 2.1. Nivel Lector (Visita / Lector)
* `isReadOnlyMetrados() === true` (Detecta si el rol es 'lector' o el cargo dice 'VISITA' u 'OBSERVADOR').
* **Efecto UI:** Toda la tabla de metrados funciona solo en modo lectura. Los botones de agregar (`+`), Editar, Guardar, Eliminar y Oficializar (PC) se ocultan por completo de la pantalla.

### 2.2. Nivel Metrador (Restricción de Propiedad)
* Si el cargo contiene 'METRADOR', la función `canEditMetrado(autor_registro)` se evalúa en cada fila de la UI.
* **Efecto UI:** El usuario solo ve los botones de Lápiz y Basurero **únicamente en las filas donde su nombre coincida exactamente** con la firma del creador del metrado. Las demás filas quedan bloqueadas, impidiendo alterar el trabajo del metrador vecino.

### 2.3. Nivel Especialista / Supervisor
* Tienen libertad de crear/borrar dentro de su especialidad (Ej. Estructuras, Arquitectura).
* Si el rol es 'TODAS', 'MASTER', 'ADMIN' o 'SUPERVISOR', el selector visual de "Especialidad" se desbloquea, permitiéndoles saltar de rama en rama y auditar todos los frentes.

---

## 🚫 3. SISTEMA DE LOCKOUT TEMPORAL (EL CANDADO GLOBAL)

Un problema fatal en obra es que los metradores editen registros antiguos (meses cerrados contablemente) y arruinen las sumatorias declaradas de las valorizaciones previas enviadas al gobierno central.

### El Mecanismo:
1. Existe un usuario ficticio/virtual en la BD llamado `SISTEMA`.
2. El frontend de todos los usuarios hace un fetch global en silencio a este usuario leyendo su campo `roles_apps.metrados_lock`.
3. Contiene: `{ "activo": true, "fecha_cierre": "2026-03-31" }`.
4. Si la lógica del `canEditMetrado(autor, fecha_del_registro_en_evaluacion)` detecta que el registro tiene una fecha `<= 2026-03-31` y el Candado está "activo", devuelve FALSO.
5. **Consecuencia:** Es absolutamente imposible para un ingeniero modificar o eliminar ese metrado histórico. Queda congelado en el tiempo.
6. **Bypass Autorizado:** Excepción pura: Si `isAdminPresupuesto() === true` o `isGerencia() === true`, esta regla los ignora y les permite alterar el pasado por motivo de auditorías urgentes.

---

## 🎭 4. MULTIPLEXACIÓN DE DATOS (ÁREA LIQUIDACIONES)
Para ahorrar código (DRY), no se escribieron dos apps. Si `user.area === 'LIQUIDACIONES'` o `roles_apps.liquidaciones === 'editor'`, la app entera se pone una máscara.
* Las peticiones GET, POST, PATCH y DELETE que hace Zustand a Supabase dejan de ir a `metrados` y cambian su target endpoint a `metrados_liquidaciones`.
* Los ingenieros residentes no pueden ver ni tocar lo de los auditores, y viceversa, manteniendo los "Sandboxes" de trabajo herméticamente sellados usando el mismo UI.
