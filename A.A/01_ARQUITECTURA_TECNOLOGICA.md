# 🐬 01. ARQUITECTURA TECNOLÓGICA Y STACK

Este documento define las bases tecnológicas exactas sobre las que se sostiene la aplicación. Para reconstruir el sistema de forma idéntica o superior, debes utilizar este stack o equivalentes modernos que cumplan la misma función.

## 🏗️ 1. STACK PRINCIPAL

### 1.1. Backend / Database as a Service (BaaS)
* **Proveedor:** Supabase.
* **Base de Datos:** PostgreSQL 15+.
* **Por qué:** Permite autenticación integrada, APIs REST (PostgREST) auto-generadas a partir de las tablas, RPCs (Stored Procedures) y Row Level Security (RLS) nativa.

### 1.2. Frontend Framework
* **Core:** React 18+ (con TypeScript).
* **Bundler:** Vite (reemplazando Create React App por velocidad).
* **Estilizado:** Tailwind CSS (con utilidades directas en línea para consistencia de clases `bg-slate-50`, `text-blue-600`, etc.) y Lucide React (Iconos).
* **Por qué:** Se necesita un tipado estricto para las estructuras de ingeniería complejas (WBS) y compilación ultrarrápida.

### 1.3. State Management (El Cerebro)
* **Librería:** Zustand.
* **Módulos:** `useAuthStore.ts` (manejo de sesiones, SSO, permisos) y `useMetradosStore.ts` (almacenamiento de catálogo, cálculos matemáticos masivos, filtros).
* **Por qué:** Evita el "prop-drilling" y los re-renders innecesarios de Context API. Almacena en memoria RAM todo el presupuesto (10MB+) sin colapsar la UI.

### 1.4. Manejo de UI de Alto Rendimiento
* **Virtualización:** `@tanstack/react-virtual` (TanStack Virtual).
* **Por qué:** La tabla de metrados puede tener más de 10,000 registros mostrándose a la vez. Renderizar 10,000 celdas HTML `<tr>` bloquearía el hilo principal del navegador. TanStack Virtual solo renderiza el "Viewport" (las 30 filas que los ojos ven en pantalla).

### 1.5. Exportación y Reportes
* **Librería:** `exceljs` y `file-saver`.
* **Por qué:** La exportación DEBE ocurrir "Client-Side". El navegador construye el Excel binario con los estilos exactos de la entidad gubernamental (fondos, fuentes, anchos de columna) sin sobrecargar el backend.

---

## 📡 2. PATRONES DE ARQUITECTURA Y RED

### 2.1. Paginación Asíncrona Recursiva (Bypass 1000 Filas)
Supabase limita las respuestas a 1,000 registros para evitar latencia. El sistema implementa un algoritmo de recursión de promesas: pide del 0-999, luego 1000-1999, etc., hasta que `data.length < 1000`. Luego une todos los arrays y guarda en Zustand.

### 2.2. Aislamiento por Multiplexación Reactiva (Store)
No se usan rutas de URL (React Router) complejas para diferenciar vistas. Todo es Single Page Application (SPA).
Cuando el usuario presiona "Partidas Creadas", el store simplemente re-calcula un `useMemo` filtrando la memoria de `metrados` donde `custom_partida_id` no sea nulo. Cero latencia, cero red.

### 2.3. Single Sign-On (SSO) con Cookies de Dominio
Dado que es un ecosistema, el login no usa `localStorage` local, usa `js-cookie`.
Se genera una cookie `gore_cusco_session` con `domain: '.copgorecusco.com'`. Esto permite que si el usuario abre otra app de la suite en otro subdominio, ya esté logueado automáticamente.
