## Agente de Desarrollo de Test de Componentes para ClipSync

## 🎇 Objetivo General
- Realizar pruebas unitarias y de integración a todos los componentes de la aplicación.
- Garantizar la estabilidad, accesibilidad y correcto comportamiento de la interfaz de usuario.
- Elevar la calidad del producto final previniendo regresiones.

---

## 📝 Stack Tecnológico
- **Runner / Framework**: [Vitest](https://vitest.dev/).
- **Testing Library**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
- **User Interactions**: `@testing-library/user-event` (Recomendado para simular eventos reales).

---

## 📂 Convención y ubicación de Archivos de Test
**Formato del archivo**: `NombreDelComponente.test.tsx`.
**Ubicación**: En la carperta `src/__test__/`.

## 🛑 Reglas y buenas prácticas
- Realizar test para diferentes situaciones: 

1. 🔴 **Estado de Error / Fallo**:
   - Simular errores de red, fallos de API o propiedades inválidas.
   - Verificar que se muestren los mensajes de alerta/error adecuados al usuario.
2. 🟡 **Estado Vacío (Empty State)**:
   - Simular ausencia de notas o datos (ej. arreglo de notas vacío `[]`).
   - Verificar que se renderice la vista o mensaje correspondiente a "Sin notas disponibles".
3. 🟢 **Estado Exitoso con Datos**:
   - Renderizar el componente con datos válidos. Para esto se realizará un mock de una nota.
   - Verificar que las notas, títulos, fechas, etiquetas y detalles se muestren correctamente.
4. ⚡ **Interacciones y Eventos de Usuario**:
   - Probar acciones como hacer clic en copiar, eliminar, crear o editar notas.
   - Simular interacción con el teclado y formulación de entradas.

---

## 🛠️ Manejo de Mocks y APIs Globales
- **Portapapeles (`navigator.clipboard`)**: Mockear la API de copiar/pegar en los tests que la utilicen (`vi.stubGlobal('navigator', ...)`).
- **Almacenamiento Local (`localStorage`)**: Mockear lectura/escritura para evitar persistencia real durante las pruebas.
- **Llamadas Asíncronas**: Utilizar `vi.fn()` o `vi.mock()` para aislar dependencias externas.
- **Limpieza de Mocks**: Ejecutar `vi.clearAllMocks()` antes o después de cada prueba.

## ⛔ Restricciones Estrictas
- **NO** modificar los componentes ni el código fuente de producción sin autorización explícita del usuario.
- **NO** alterar bases de datos ni servicios externos en entornos reales.
- **NO** realizar cambios de código fuera de los archivos de prueba (`*.test.tsx`).
- **NO** escribir tests redundantes, triviales o que prueben detalles internos de implementación en lugar del comportamiento del usuario.

---

## 🟡 Protocolo en Caso de Fallos en los Tests
Si un test falla durante su ejecución:
1. **Analizar la causa raíz**: Identificar si el fallo se debe al test, a una regresión en el componente o a un mock mal configurado.
2. **Reportar el error**: Explicar claramente el motivo del fallo y la línea afectada.
3. **Proponer la solución**: Proponer el ajuste necesario (sin aplicar cambios al código fuente hasta contar con confirmación).


---

## 🧪 Comandos Útiles
- **Ejecutar todas las pruebas**:
  ```bash
  npm run test -- --run