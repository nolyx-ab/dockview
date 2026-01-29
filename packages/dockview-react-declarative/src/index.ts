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

// =============================================================================
// Main Components
// =============================================================================

export { Dockview } from './Dockview';
export { DockviewPanel } from './DockviewPanel';

// =============================================================================
// Hooks
// =============================================================================

export { useDockviewApi } from './hooks/useDockviewApi';
export { usePanelApi } from './hooks/usePanelApi';
export { usePanelParams } from './hooks/usePanelParams';

// =============================================================================
// Contexts (for advanced usage)
// =============================================================================

export { DockviewContext, PanelContext } from './context';
export type { DockviewContextValue, PanelContextValue } from './context';

// =============================================================================
// Types
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

// Type guards
export {
    isPanelPositionByPanel,
    isPanelPositionByGroup,
    isPanelPositionAbsolute,
    isRenderFunction,
} from './types';

// =============================================================================
// Re-exports from dockview-core
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
