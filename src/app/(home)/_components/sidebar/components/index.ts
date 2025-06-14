/**
 * Sidebar component exports
 *
 * Architecture:
 * - SidebarContainer: Handles responsive behavior and state management
 * - Layout components: Handle content layout patterns
 * - MobileSidebarTrigger: Reusable trigger button
 * - SidebarLayout: High-level composer (main API)
 * - Convenience components: Pre-configured layouts for common patterns
 */

// Core components
export {
  AbsoluteCenteredLayout,
  CenteredLayout,
  FullWidthLayout,
} from "./layout-wrapper";
export { MobileSidebarTrigger } from "./mobile-sidebar-trigger";
export { SidebarContainer } from "./sidebar-container";

// Main API
export { SidebarLayout } from "./sidebar-layout";

// Types
export type {
  BaseComponentProps,
  LayoutProps,
  LayoutVariant,
  MobileBreakpoint,
  ResponsiveProps,
  SidebarBreakpoint,
  SidebarStateProps,
  SidebarVariant,
} from "../types";

// Legacy export for backwards compatibility
export { SidebarLayout as LegacySidebarLayout } from "./sidebar-layout";
