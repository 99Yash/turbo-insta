# Sidebar Component Architecture

This directory contains a modular sidebar system with proper separation of concerns and reusable components.

## Architecture Overview

The sidebar system is composed of several focused components:

```
SidebarContainer (State & Responsive Logic)
├── AppSidebar (Sidebar Content)
└── Layout Components (Content Layout)
    ├── CenteredLayout
    ├── FullWidthLayout
    └── AbsoluteCenteredLayout
```

## Components

### Core Components

#### `SidebarContainer`

Handles sidebar state management and responsive behavior.

```tsx
<SidebarContainer
  breakpoint="xl" // or "sm"
  defaultOpen={true}
  onOpenChange={(open) => console.log("Sidebar:", open)}
>
  <AppSidebar />
  <YourContent />
</SidebarContainer>
```

#### `MobileSidebarTrigger`

Reusable trigger button for mobile sidebar.

```tsx
<MobileSidebarTrigger className="custom-styles">
  <CustomIcon /> {/* Optional custom content */}
</MobileSidebarTrigger>
```

#### Layout Components

Handle different content layout patterns:

- **`CenteredLayout`**: For feeds, posts (max-width constraint)
- **`FullWidthLayout`**: For profiles, dashboards
- **`AbsoluteCenteredLayout`**: For overlaying content (absolute positioning)

### High-Level API

#### `SidebarLayout`

The main component that composes everything together:

```tsx
<SidebarLayout
  layout="centered" // "full-width" | "absolute-centered"
  contentWidth="max-w-[470px]"
  sidebarBreakpoint="xl" // "sm"
  mobileBreakpoint="sm" // "md"
  defaultSidebarOpen={undefined} // auto-responsive
  showMobileTrigger={true}
  onSidebarChange={(open) => {}}
>
  {children}
</SidebarLayout>
```

#### Sidebar Variants

Control how the sidebar behaves:

```tsx
<SidebarLayout
  sidebarVariant="default" // Normal responsive behavior
  sidebarVariant="minimized" // Start minimized, good for content-focused pages
  sidebarVariant="persistent" // Always try to stay open when possible
>
  {children}
</SidebarLayout>
```

## Migration Guide

### Before (Complex API)

```tsx
// Old complex API with confusing props
<SidebarLayout variant="centered" width="w-[470px]" forceMinimized={false}>
  {children}
</SidebarLayout>
```

### After (Simple & Flexible API)

```tsx
// New flexible API - compose exactly what you need
<SidebarLayout
  layout="absolute-centered"
  contentWidth="w-[470px]"
  sidebarVariant="default"
>
  {children}
</SidebarLayout>

// Or for custom composition
<SidebarContainer breakpoint="sm" defaultOpen={false}>
  <AppSidebar />
  <CenteredLayout maxWidth="max-w-[600px]">
    {children}
  </CenteredLayout>
</SidebarContainer>
```

## Recommended Pattern

Keep sidebar state management at the parent level, but let each layout handle its own content:

### Parent Layout (Shared State)

```tsx
// src/app/(home)/layout.tsx
export default function HomeLayout({ children }) {
  return (
    <SidebarContainer breakpoint="xl">
      <AppSidebar />
      {children}
    </SidebarContainer>
  );
}
```

### Feed Page Layout

```tsx
// src/app/(home)/page.tsx
export default function HomePage() {
  return (
    <CenteredLayout maxWidth="max-w-[470px]">
      <div>Feed content</div>
    </CenteredLayout>
  );
}
```

### Profile Page Layout

```tsx
// src/app/(home)/[username]/layout.tsx
export default function ProfileLayout({ children }) {
  return (
    <FullWidthLayout>
      <div className="mx-auto max-w-[800px]">{children}</div>
    </FullWidthLayout>
  );
}
```

### Messages Layout

```tsx
// src/app/(home)/messages/layout.tsx
export default function MessagesLayout({ children }) {
  return (
    <FullWidthLayout showMobileTrigger={false}>{children}</FullWidthLayout>
  );
}

// src/app/(home)/messages/page.tsx
export default function MessagesPage() {
  return <div>Messages content</div>;
}
```

## Alternative Examples

### Custom Layout Composition

```tsx
function CustomPageLayout({ children }) {
  return (
    <SidebarContainer breakpoint="sm" defaultOpen={false}>
      <AppSidebar />
      <CenteredLayout
        maxWidth="max-w-[600px]"
        showMobileTrigger={true}
        mobileBreakpoint="md"
      >
        {children}
      </CenteredLayout>
    </SidebarContainer>
  );
}
```

### Custom Sidebar Implementation

```tsx
function CustomSidebar() {
  return (
    <SidebarContainer>
      {/* Your custom sidebar */}
      <Sidebar>
        <SidebarContent>Custom sidebar content</SidebarContent>
      </Sidebar>

      {/* Your layout */}
      <FullWidthLayout>Main content</FullWidthLayout>
    </SidebarContainer>
  );
}
```

## Benefits

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be composed in different ways
3. **Simple API**: Clear, intuitive props with good defaults
4. **Type Safety**: Full TypeScript support with clear interfaces
5. **Flexibility**: Easy to create custom layouts while reusing core logic
6. **Performance**: Smaller components that re-render less frequently

## Component Responsibility Matrix

| Component              | State | Layout | Responsive | Mobile UI |
| ---------------------- | ----- | ------ | ---------- | --------- |
| SidebarContainer       | ✅    | ❌     | ✅         | ❌        |
| Layout Components      | ❌    | ✅     | ✅         | ✅        |
| MobileSidebarTrigger   | ❌    | ❌     | ❌         | ✅        |
| SidebarLayout          | ❌    | ✅     | ✅         | ✅        |
| Convenience Components | ❌    | ✅     | ✅         | ✅        |
