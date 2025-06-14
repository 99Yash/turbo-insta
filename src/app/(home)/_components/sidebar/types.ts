/**
 * Shared type definitions for sidebar components
 */

export type SidebarBreakpoint = "xl" | "sm";
export type MobileBreakpoint = "sm" | "md";
export type LayoutVariant = "centered" | "full-width" | "absolute-centered";
export type SidebarVariant = "default" | "minimized" | "persistent";

export interface BaseComponentProps {
  children: React.ReactNode;
  className?: string;
}

export interface ResponsiveProps {
  /**
   * Breakpoint for responsive behavior
   */
  breakpoint?: SidebarBreakpoint;
  /**
   * Mobile breakpoint for layout changes
   */
  mobileBreakpoint?: MobileBreakpoint;
}

export interface SidebarStateProps {
  /**
   * Initial sidebar state
   */
  defaultOpen?: boolean;
  /**
   * Called when sidebar state changes
   */
  onOpenChange?: (open: boolean) => void;
}

export interface LayoutProps extends BaseComponentProps {
  /**
   * Show mobile trigger on mobile devices
   */
  showMobileTrigger?: boolean;
  /**
   * Mobile breakpoint for layout behavior
   */
  mobileBreakpoint?: MobileBreakpoint;
}
