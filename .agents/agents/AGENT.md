# Agente de Desarrollo para ClipSync

## 🎯 Objetivo General
Desarrollar el proyecto **ClipSync**.

---

## 📝 Descripción general del proyecto
- **ClipSync** es una aplicación web que permite guardar, organizar y sincronizar notas en tiempo real entre diferentes dispositivos.
- El usuario puede utilizar esta aplicación como:
 1) extensión para navegadores
 2) aplicación web responsiva.
- No se requiere una cuenta de usuario para poder utilizar la aplicación ya que solo se utilizará el token.
- Su funcionalidad inicial es que el usuario pueda seleccionar texto de paginas web y se guardarán de manera automática dentro de la aplicación.
- Tendrá la posibilidad de desabilitar y habilitar esta extensión desde un botón flotante. (Si el boton presenta color, significa que está habilitado).
- Cuenta con clasificación por categorías.
- Los textos siempre se guardarán en la misma nota, siempre y cuando el link de la pagina web de donde proviene, no haya cambiado ya que también se clasifican por source (url). Si la url cambia, se creará una nueva nota, aunque pertenezcan a la misma categoría y al mismo usuario.


## 🛠️ Stack Tecnológico y Contexto
- **Frontend**: React + TypeScript + Vite
- **Backend / DB**: Supabase (Autenticación, Realtime, Base de datos)
- **Estilos**: TailwindCSS
- **Estado**: React Context (`notesContext.tsx`)

---

## 📋 Reglas y Buenas Prácticas

### 1. Código y Estructura
- Mantener tipado estricto en TypeScript sin utilizar `any`. EVITAR A TODA COSTA.
- Separar lógica de presentación y servicios (ej. `src/service/supabase.ts`).
- Asegurar que los nombres de variables, tipos y funciones sean explícitos.

### 2. Manejo de Estado y Datos
- Utilizar `notesContext.tsx` para el estado global de notas y sincronización.
- Manejar adecuadamente estados de carga (`loading`), errores, estados vacíos (`empty state`) y actualizaciones en tiempo real de Supabase.

### 3. Diseño y Experiencia de Usuario (UI/UX)
- Mantener una estética moderna, limpia y responsive.
- Evitar colores por defecto de los navegadores; usar paletas de colores bien integradas.
- Incluir feedback visual en interacciones del usuario (hover, botones deshabilitados, modales, loadings).
- Mantener la paleta de colores utilizadas hasta el momento. 

---

## ⛔ Restricciones (Lo que NO se debe hacer)
- NO modificar respuestas de Supabase sin validar los tipos.
- NO UTILIZAR COMPONENTES DE FRAMEWORK O LIBRERIAS NO SOLICITADAS.
- NO dejar `console.log` o código muerto tras completar una funcionalidad.
- NO cambiar la firma de métodos globales del contexto sin actualizar todos los archivos impactados.
- NO intervenir en otros archivos a los que no ha sido especificado o tengan relación con la tarea solicitada.
- Antes de finalizar una tarea, NO clasificarla como "done" o "terminada" hasta que pase exitosamente los tests.

---

## 🧪 Verificación y Comandos
- **Desarrollo local**: `npm run dev`
- **Build de producción**: `npm run build`
- **Linting**: `npm run lint`
- Realizar devoluciones de cambios que funcionaron, cambios que no y sus causas probables como feedback para cada verificación o trabajo siguiete.
- Devolver posibles mejoras a soluciones vagas.

---

## 📝 Instrucciones de Ejecución / Workflow
1. **Inspeccionar**: Leer los componentes relacionados antes de efectuar cambios.
2. **Implementar**: Modificar el código respetando la arquitectura y formalidad del proyecto.
3. **Validar**: Confirmar que no haya errores de compilación o runtime.

## Documentos Clasificados
- Pruebas unitarias e integración (`src/__test__/TEST-AGENT.md`). Requerido UNICAMENTE al realizar los test.

## Al inicio de la sesión
- Leer PROGRESS.md para saber el estado actual del proyecto.
- Continuar desde la sección "Siguientes pasos" de PROGRESS.md

## Al final de la sesión
- Actualizar PROGRESS.md
- Commit de todo el trabajo terminado.

