# Estándar de UI/UX - PadelSaaS (Edición Profesional Industrial)

Este documento define la nueva identidad visual del proyecto, alejándose de estéticas suaves y curvas para adoptar un enfoque **Industrial, Técnico y de Grado Empresarial**. El objetivo es transmitir precisión, eficiencia y seriedad.

## 1. Paleta de Colores (Bicromía Estricta)
Se mantiene la paleta de **Azul** y **Negro**, pero con aplicaciones más sólidas y menos degradados.

- **Negro Primario (`#000000` / `slate-950`)**: Estructura principal, marcos y texto de alta importancia.
- **Azul Técnico (`#003399` / `blue-800`)**: Acentos de precisión, estados activos y botones de acción.
- **Gris Industrial (`#F1F5F9` / `slate-100`)**: Fondos de sección y áreas de contenido.
- **Bordes (`#E2E8F0` / `slate-200`)**: Uso extensivo de líneas finas para separar secciones en lugar de sombras.

## 2. Geometría y Estructura (Sharp Design)
Se elimina el exceso de redondeo para proyectar una imagen de software robusto y preciso.

- **Bordes**: Redondeo mínimo (`rounded-none` o `rounded-sm` de máximo 2px-4px).
- **Contenedores**: En lugar de "tarjetas flotantes", usar secciones integradas con bordes sólidos. 
- **Sombras**: Eliminar sombras suaves. Usar bordes de 1px o sombras de bloque (estilo retro-tech) si es necesario.
- **Layout**: Cuadrícula estricta. Todo debe estar alineado a ejes verticales y horizontales claros.

## 3. Tipografía y Micro-Copy
- **Fuentes**: Inter (Sans-serif) con espaciado ajustado.
- **Jerarquía**: 
  - Títulos en `font-bold` (no necesariamente black) para una elegancia técnica.
  - Etiquetas: `uppercase`, `tracking-tighter` (más denso) o `tracking-widest` (muy espaciado) según el contexto.
  - Datos: Monoespaciados (opcional) para valores numéricos, reforzando el aspecto de "instrumento".

## 4. Componentes Revisitados
- **Buttons**: Rectangulares, con bordes definidos. Sin sombras.
- **Inputs**: Bordes completos de 1px, sin redondeo. Foco con color azul sólido.
- **Charts**: Líneas finas, sin áreas rellenas de degradados. Estética de osciloscopio o reporte técnico.
- **Tablas**: Estilo contable. Filas con bordes inferiores claros, sin bordes externos redondeados.

## 5. Reglas de Implementación
1. **No usar `rounded-3xl` ni `rounded-2xl`**. Máximo `rounded-md`.
2. **Priorizar bordes sobre sombras**.
3. **Contraste alto**: Blanco sobre Negro, Azul sobre Blanco.
4. **Espaciado Quirúrgico**: Menos "aire" innecesario, más densidad de datos organizada.

---
*Este estándar reemplaza al anterior y busca una imagen de software de misión crítica.*
