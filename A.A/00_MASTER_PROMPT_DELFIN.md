# 🐬 MASTER PROMPT: RECONSTRUCCIÓN DEL SISTEMA DE GESTIÓN Y CONTROL DE METRADOS (V5.0)

> **INSTRUCCIÓN PARA LA IA RECEPTORA (ESTILO DELFÍN 🐬):**
> Actúa como un Arquitecto de Software Senior y Especialista en Bases de Datos (PostgreSQL/Supabase) y Frontend (React/Zustand). Tu objetivo es leer, comprender a profundidad e interiorizar toda la documentación presente en este directorio `A.A` para **RECONSTRUIR EXACTAMENTE ESTE SISTEMA DESDE CERO** o evolucionarlo. No debes obviar ningún detalle técnico, regla de negocio, ni mecanismo de seguridad aquí descrito. La aplicación es de misión crítica para control presupuestal de obras civiles gubernamentales.

---

## 🌟 1. VISIÓN GENERAL Y PROPÓSITO DEL SISTEMA
El "Buscador de Metrados V5.0" es una plataforma web de alto rendimiento orientada a la ingeniería civil. Su propósito principal es permitir a ingenieros y auditores (liquidaciones) registrar, cuantificar y controlar el avance físico y financiero de obras públicas masivas (ej. hospitales) de forma colaborativa, segura y estructurada.

El sistema resuelve problemas críticos de obra:
1. **Pérdida de datos:** Usando sincronización en tiempo real y reintentos agresivos ante errores de base de datos.
2. **Latencia extrema:** Manejando catálogos de miles de partidas y cientos de miles de metrados usando virtualización de UI y motores de rollup matemático fractal en caché (Zustand).
3. **Corrupción de Presupuesto:** Aislamiento de tareas adicionales en "Partidas Creadas (PC)" y mecanismos de oficialización atómicos mediante transacciones SQL (RPC).
4. **Interferencia de Usuarios:** Sistemas de seguridad, roles, multiplexación de tablas ("obra" vs "liquidaciones") y candados temporales.

---

## 📂 2. ESTRUCTURA DE ESTA GUÍA DE RECONSTRUCCIÓN
Para entender y reconstruir el sistema, debes procesar los siguientes documentos de este directorio en orden:

* **[01_ARQUITECTURA_TECNOLOGICA.md](./01_ARQUITECTURA_TECNOLOGICA.md):** Define el Stack, librerías, y flujos de red.
* **[02_BASE_DE_DATOS_COMPLETA.md](./02_BASE_DE_DATOS_COMPLETA.md):** El corazón del sistema. Define todas las tablas, relaciones (Foreign Keys), RPCs y reglas.
* **[03_COMPONENTES_UX_UI.md](./03_COMPONENTES_UX_UI.md):** Define cómo funciona el DataGrid virtualizado, inyección de "Elementos Virtuales" y paneles modales.
* **[04_STORE_LOGICA_MATEMATICA.md](./04_STORE_LOGICA_MATEMATICA.md):** Define las ecuaciones de volumetría, acero (kg), y roll-ups en el store global.
* **[05_MEJORAS_FUTURAS.md](./05_MEJORAS_FUTURAS.md):** Áreas críticas de mejora para escalar la aplicación en la nueva versión.

---

## 🧠 3. CONCEPTO CENTRAL: "THE TRUTH IS IN THE DB, THE SPEED IS IN THE CLIENT"
La filosofía de diseño de este sistema es **"La verdad absoluta está en Postgres, pero la velocidad está en el navegador"**.
* **Base de datos:** Estrictamente tipada, relacional, con constraints (CHECK, FK), triggers y RPCs para lógica atómica.
* **Cliente:** Descarga toda la data en bruto usando paginación asíncrona, y usa el poder de cómputo del navegador (React + Zustand) para filtrar, sumar, agrupar y multiplexar en milisegundos, en lugar de pedir consultas agregadas (GROUP BY) al servidor por cada clic.
