# Component Library

Esta biblioteca de componentes proporciona elementos reutilizables con estilos profesionales para el CMS.

## Componentes Disponibles

### SearchBar
Barra de búsqueda con icono de lupa, transición de borde al enfocarse, y fondo blanco.

```tsx
import SearchBar from '@/components/SearchBar';

<SearchBar 
  placeholder="Search..."
  onSearch={(query) => console.log(query)}
/>
```

### Checkbox & FilterGroup
Checkboxes con estilo azul claro y filtros agrupados.

```tsx
import { Checkbox, FilterGroup } from '@/components/Checkbox';

<FilterGroup title="Categorías">
  <Checkbox label="Tecnología" />
  <Checkbox label="Diseño" />
</FilterGroup>
```

### Card & NewsCard
Tarjetas para contenido con sombras, bordes redondeados y transiciones en hover.

```tsx
import { Card, NewsCard } from '@/components/Card';

<Card
  title="Título"
  description="Descripción"
  image="/path/to/image.jpg"
  href="/link"
/>

<NewsCard
  title="Noticia"
  description="Contenido"
  date="2024-01-15"
/>
```

### Typography Components
Componentes de tipografía profesional con fuente sans-serif.

```tsx
import { Heading, HighlightedText, BodyText } from '@/components/Typography';

<Heading level={2}>Título</Heading>
<HighlightedText>Texto destacado</HighlightedText>
<BodyText>Texto normal</BodyText>
```

### Logo
Componente de logo escalable con fondo transparente.

```tsx
import Logo from '@/components/Logo';

<Logo 
  src="/logo.svg" 
  alt="Logo"
  width={150}
  height={50}
  href="/"
/>
```

## Estilos

Todos los componentes siguen el siguiente esquema de diseño:

- **Colores**: Azul oscuro (#1e3a8a) para texto destacado, gris para secundario
- **Bordes**: Sutiles, redondeados
- **Sombras**: Ligeras con efecto en hover
- **Tipografía**: Sans-serif (Roboto/Open Sans)
- **Transiciones**: Suaves para interacciones
- **Espaciado**: Margins verticales generosos

## Uso en el CMS

Los componentes están optimizados para:
- Mejor experiencia visual
- Consistencia de diseño
- Accesibilidad
- Responsividad móvil
