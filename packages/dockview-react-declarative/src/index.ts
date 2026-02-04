/**
 * dockview-react-declarative
 *
 * A declarative JSX-based API for dockview layout manager.
 *
 * @example
 * ```tsx
 * import { Dockview, DockviewPanel, usePanelApi } from 'dockview-react-declarative';
 *
 * function MyPanel() {
 *   const api = usePanelApi();
 *   return <div>Panel content</div>;
 * }
 *
 * function App() {
 *   return (
 *     <Dockview>
 *       <DockviewPanel id="panel1" title="Panel 1">
 *         <MyPanel />
 *       </DockviewPanel>
 *       <DockviewPanel id="panel2" title="Panel 2" floating>
 *         <MyPanel />
 *       </DockviewPanel>
 *     </Dockview>
 *   );
 * }
 * ```
 */

export * from 'dockview-core';

// =============================================================================
// Main Components - Dockview
// =============================================================================

export { Dockview } from './Dockview';
export { DockviewPanel } from './DockviewPanel';

// =============================================================================
// Main Components - Splitview
// =============================================================================

export { Splitview } from './Splitview';
export { SplitviewPanel } from './SplitviewPanel';

// =============================================================================
// Hooks - Dockview
// =============================================================================

export { useDockviewApi } from './hooks/useDockviewApi';
export { usePanelApi } from './hooks/usePanelApi';
export { usePanelParams } from './hooks/usePanelParams';

// =============================================================================
// Hooks - Splitview
// =============================================================================

export { useSplitviewApi } from './hooks/useSplitviewApi';
export { useSplitviewPanelApi } from './hooks/useSplitviewPanelApi';
export { useSplitviewPanelParams } from './hooks/useSplitviewPanelParams';

// =============================================================================
// Contexts (for advanced usage)
// =============================================================================

export { DockviewContext, PanelContext, SplitviewContext, SplitviewPanelContext } from './context';
export type { DockviewContextValue, PanelContextValue, SplitviewContextValue, SplitviewPanelContextValue } from './context';

// =============================================================================
// Types - Dockview
// =============================================================================

export type {
    // Component Props
    DockviewProps,
    DockviewPanelProps,
    DockviewHandle,
    // Render Props
    DockviewPanelRenderProps,
    DockviewPanelTabProps,
    DockviewWatermarkProps,
    DockviewHeaderActionsProps,
    // Position Types
    PanelPosition,
    PanelPositionByPanel,
    PanelPositionByGroup,
    PanelPositionAbsolute,
    // Floating Options
    FloatingOptions,
    // Events
    DockviewReadyEvent,
    DockviewEventCallbacks,
    DockviewPanelCallbacks,
    // Internal (for advanced usage)
    PanelDefinition,
} from './types';

// Type guards - Dockview
export {
    isPanelPositionByPanel,
    isPanelPositionByGroup,
    isPanelPositionAbsolute,
    isRenderFunction,
} from './types';

// =============================================================================
// Types - Splitview
// =============================================================================

export type {
    // Component Props
    SplitviewProps,
    SplitviewPanelProps,
    SplitviewHandle,
    // Render Props
    SplitviewPanelRenderProps,
    // Events
    SplitviewReadyEvent,
    SplitviewEventCallbacks,
    SplitviewPanelCallbacks,
    // Internal (for advanced usage)
    SplitviewPanelDefinition,
} from './types';

// Type guards - Splitview
export { isSplitviewRenderFunction } from './types';

// =============================================================================
// Re-exports from dockview-core - Dockview
// =============================================================================

export {
    // APIs
    DockviewApi,
    DockviewPanelApi,
    DockviewGroupPanelApi,
    // Panels and Groups
    DockviewGroupPanel,
    IDockviewPanel,
    IDockviewGroupPanel,
    // Options
    DockviewOptions,
    DockviewPanelRenderer,
    // Direction
    Direction,
    // Serialization
    SerializedDockview,
    // Events
    DockviewDidDropEvent,
    DockviewWillDropEvent,
    DockviewDndOverlayEvent,
    DockviewWillShowOverlayLocationEvent,
    TabDragEvent,
    GroupDragEvent,
    MovePanelEvent,
    DockviewMaximizedGroupChanged,
    PopoutGroupChangeSizeEvent,
    PopoutGroupChangePositionEvent,
} from './types';

// =============================================================================
// Re-exports from dockview-core - Splitview
// =============================================================================

export {
    // APIs
    SplitviewApi,
    SplitviewPanelApi,
    // Panels
    ISplitviewPanel,
    // Options
    SplitviewOptions,
    // Orientation
    Orientation,
    LayoutPriority,
    // Serialization
    SerializedSplitview,
    // Events
    IView,
} from './types';
