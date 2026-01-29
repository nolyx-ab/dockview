import * as React from 'react';
import {
    DockviewApi,
    DockviewPanelApi,
    DockviewGroupPanelApi,
    DockviewGroupPanel,
    IDockviewPanel,
    DockviewOptions,
    DockviewPanelRenderer,
    Direction,
    SerializedDockview,
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
    IDockviewGroupPanel,
} from 'dockview-core';

/**
 * Tab location - either in the header or in the overflow dropdown
 */
export type TabLocation = 'header' | 'headerOverflow';

// =============================================================================
// Position Types
// =============================================================================

/**
 * Position relative to an existing panel
 */
export interface PanelPositionByPanel {
    /** The ID of the panel to position relative to */
    referencePanel: string;
    /** The direction relative to the reference panel */
    direction?: Direction;
    /** The index within the target group (only applicable for 'within' direction) */
    index?: number;
}

/**
 * Position relative to an existing group
 */
export interface PanelPositionByGroup {
    /** The ID of the group to position relative to */
    referenceGroup: string;
    /** The direction relative to the reference group */
    direction?: Direction;
    /** The index within the target group (only applicable for 'within' direction) */
    index?: number;
}

/**
 * Absolute position in the layout
 */
export interface PanelPositionAbsolute {
    /** The absolute direction for positioning */
    direction: Direction;
}

/**
 * Union type for all positioning options
 */
export type PanelPosition =
    | PanelPositionByPanel
    | PanelPositionByGroup
    | PanelPositionAbsolute;

// =============================================================================
// Floating Options
// =============================================================================

/**
 * Options for floating panels
 */
export interface FloatingOptions {
    /** X position of the floating panel */
    x?: number;
    /** Y position of the floating panel */
    y?: number;
    /** Width of the floating panel */
    width?: number;
    /** Height of the floating panel */
    height?: number;
}

// =============================================================================
// Panel Render Props
// =============================================================================

/**
 * Props passed to panel render functions
 */
export interface DockviewPanelRenderProps<P = Record<string, unknown>> {
    /** API for the individual panel */
    api: DockviewPanelApi;
    /** API for the dockview container */
    containerApi: DockviewApi;
    /** Custom parameters passed to the panel */
    params: P;
}

// =============================================================================
// Tab Props
// =============================================================================

/**
 * Props for custom tab components
 */
export interface DockviewPanelTabProps<P = Record<string, unknown>> {
    /** API for the individual panel */
    api: DockviewPanelApi;
    /** API for the dockview container */
    containerApi: DockviewApi;
    /** Custom parameters passed to the panel */
    params: P;
    /** Location of the tab ('header' or 'headerOverflow') */
    tabLocation: TabLocation;
}

// =============================================================================
// Watermark Props
// =============================================================================

/**
 * Props for watermark components
 */
export interface DockviewWatermarkProps {
    /** API for the dockview container */
    containerApi: DockviewApi;
    /** The group the watermark is displayed in (if any) */
    group?: IDockviewGroupPanel;
}

// =============================================================================
// Header Actions Props
// =============================================================================

/**
 * Props for header action components (left, right, and prefix)
 */
export interface DockviewHeaderActionsProps {
    /** API for the group panel */
    api: DockviewGroupPanelApi;
    /** API for the dockview container */
    containerApi: DockviewApi;
    /** List of panels in the group */
    panels: IDockviewPanel[];
    /** The currently active panel in the group */
    activePanel: IDockviewPanel | undefined;
    /** Whether the group is currently active */
    isGroupActive: boolean;
    /** The group panel object */
    group: DockviewGroupPanel;
}

// =============================================================================
// Panel Event Callbacks
// =============================================================================

/**
 * Event callbacks for individual panels
 */
export interface DockviewPanelCallbacks {
    /** Called when the panel receives focus */
    onDidFocus?: () => void;
    /** Called when the panel loses focus */
    onDidBlur?: () => void;
    /** Called when the panel's visibility changes */
    onDidChangeVisibility?: (isVisible: boolean) => void;
}

// =============================================================================
// Panel Props
// =============================================================================

/**
 * Props for the `<DockviewPanel>` component
 */
export interface DockviewPanelProps<P = Record<string, unknown>>
    extends DockviewPanelCallbacks {
    /** Unique identifier for the panel */
    id: string;
    /** Title displayed in the tab */
    title?: string;
    /**
     * Panel content - either React nodes or a render function
     * that receives panel props
     */
    children:
        | React.ReactNode
        | ((props: DockviewPanelRenderProps<P>) => React.ReactNode);
    /** Custom parameters passed to the panel */
    params?: P;
    /** Position for the panel in the layout */
    position?: PanelPosition;
    /** Whether the panel should be floating, or floating options */
    floating?: boolean | FloatingOptions;
    /** Custom tab component for this panel */
    tabComponent?: React.ComponentType<DockviewPanelTabProps<P>>;
    /** The rendering mode for the panel */
    renderer?: DockviewPanelRenderer;
    /** If true, add the panel without making it active */
    inactive?: boolean;
    /** Minimum width constraint for the panel */
    minimumWidth?: number;
    /** Minimum height constraint for the panel */
    minimumHeight?: number;
    /** Maximum width constraint for the panel */
    maximumWidth?: number;
    /** Maximum height constraint for the panel */
    maximumHeight?: number;
    /** Initial width when the panel is first created */
    initialWidth?: number;
    /** Initial height when the panel is first created */
    initialHeight?: number;
}

// =============================================================================
// Panel Definition (Internal)
// =============================================================================

/**
 * Internal type representing an extracted panel definition
 * Used by the reconciler to track panel configurations
 */
export interface PanelDefinition<P = Record<string, unknown>> {
    /** Unique identifier for the panel */
    id: string;
    /** Title displayed in the tab */
    title?: string;
    /** The content to render (React node or render function) */
    content:
        | React.ReactNode
        | ((props: DockviewPanelRenderProps<P>) => React.ReactNode);
    /** Custom parameters passed to the panel */
    params?: P;
    /** Position for the panel in the layout */
    position?: PanelPosition;
    /** Whether the panel should be floating, or floating options */
    floating?: boolean | FloatingOptions;
    /** Custom tab component for this panel */
    tabComponent?: React.ComponentType<DockviewPanelTabProps<P>>;
    /** The rendering mode for the panel */
    renderer?: DockviewPanelRenderer;
    /** If true, add the panel without making it active */
    inactive?: boolean;
    /** Minimum width constraint for the panel */
    minimumWidth?: number;
    /** Minimum height constraint for the panel */
    minimumHeight?: number;
    /** Maximum width constraint for the panel */
    maximumWidth?: number;
    /** Maximum height constraint for the panel */
    maximumHeight?: number;
    /** Initial width when the panel is first created */
    initialWidth?: number;
    /** Initial height when the panel is first created */
    initialHeight?: number;
    /** Event callbacks for the panel */
    callbacks: DockviewPanelCallbacks;
}

// =============================================================================
// Dockview Event Callbacks
// =============================================================================

/**
 * Event callbacks for the Dockview container
 */
export interface DockviewEventCallbacks {
    /** Called when a drop event occurs */
    onDidDrop?: (event: DockviewDidDropEvent) => void;
    /** Called before a drop event occurs (can be cancelled) */
    onWillDrop?: (event: DockviewWillDropEvent) => void;
    /** Called before a drop overlay is shown (can be cancelled) */
    onWillShowOverlay?: (event: DockviewWillShowOverlayLocationEvent) => void;
    /** Called when a panel is added */
    onDidAddPanel?: (panel: IDockviewPanel) => void;
    /** Called when a panel is removed */
    onDidRemovePanel?: (panel: IDockviewPanel) => void;
    /** Called when the active panel changes */
    onDidActivePanelChange?: (panel: IDockviewPanel | undefined) => void;
    /** Called when a panel is moved */
    onDidMovePanel?: (event: MovePanelEvent) => void;
    /** Called when a group is added */
    onDidAddGroup?: (group: DockviewGroupPanel) => void;
    /** Called when a group is removed */
    onDidRemoveGroup?: (group: DockviewGroupPanel) => void;
    /** Called when the active group changes */
    onDidActiveGroupChange?: (group: DockviewGroupPanel | undefined) => void;
    /** Called when a group drag starts */
    onWillDragGroup?: (event: GroupDragEvent) => void;
    /** Called when a panel drag starts */
    onWillDragPanel?: (event: TabDragEvent) => void;
    /** Called when a drag event is not handled by dockview */
    onUnhandledDragOverEvent?: (event: DockviewDndOverlayEvent) => void;
    /** Called when the layout changes */
    onDidLayoutChange?: () => void;
    /** Called after layout is loaded from JSON */
    onDidLayoutFromJSON?: () => void;
    /** Called when a maximized group changes */
    onDidMaximizedGroupChange?: (event: DockviewMaximizedGroupChanged) => void;
    /** Called when a popout group size changes */
    onDidPopoutGroupSizeChange?: (event: PopoutGroupChangeSizeEvent) => void;
    /** Called when a popout group position changes */
    onDidPopoutGroupPositionChange?: (
        event: PopoutGroupChangePositionEvent
    ) => void;
    /** Called when opening a popout window fails */
    onDidOpenPopoutWindowFail?: () => void;
}

// =============================================================================
// Dockview Ready Event
// =============================================================================

/**
 * Event fired when the Dockview component is ready
 */
export interface DockviewReadyEvent {
    /** API for the dockview container */
    api: DockviewApi;
}

// =============================================================================
// Dockview Props
// =============================================================================

/**
 * Options from DockviewOptions that should be excluded from props
 * (framework-specific options that are handled differently)
 */
type ExcludedDockviewOptions = 'className';

/**
 * Props for the main `<Dockview>` container component
 */
export interface DockviewProps
    extends Omit<DockviewOptions, ExcludedDockviewOptions>,
        DockviewEventCallbacks {
    /** Child DockviewPanel elements */
    children: React.ReactNode;
    /** Called when the Dockview component is ready */
    onReady?: (event: DockviewReadyEvent) => void;
    /** CSS class name for the container */
    className?: string;
    /** Inline styles for the container */
    style?: React.CSSProperties;
    /** Default tab component for all panels */
    defaultTabComponent?: React.ComponentType<DockviewPanelTabProps>;
    /** Watermark component shown when there are no panels */
    watermarkComponent?: React.ComponentType<DockviewWatermarkProps>;
    /** Component for left header actions */
    leftHeaderActionsComponent?: React.ComponentType<DockviewHeaderActionsProps>;
    /** Component for right header actions */
    rightHeaderActionsComponent?: React.ComponentType<DockviewHeaderActionsProps>;
    /** Component for prefix header actions */
    prefixHeaderActionsComponent?: React.ComponentType<DockviewHeaderActionsProps>;
}

// =============================================================================
// Imperative Handle
// =============================================================================

/**
 * Imperative handle for the Dockview component (accessible via ref)
 */
export interface DockviewHandle {
    /**
     * Get the DockviewApi instance
     * @returns The API or null if not yet initialized
     */
    getApi(): DockviewApi | null;
    /**
     * Serialize the current layout to JSON
     * @returns The serialized layout
     */
    toJSON(): SerializedDockview;
    /**
     * Restore the layout from a serialized state
     * @param data - The serialized layout to restore
     */
    fromJSON(data: SerializedDockview): void;
    /**
     * Focus the dockview component
     */
    focus(): void;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if a position is relative to a panel
 */
export function isPanelPositionByPanel(
    position: PanelPosition
): position is PanelPositionByPanel {
    return 'referencePanel' in position;
}

/**
 * Type guard to check if a position is relative to a group
 */
export function isPanelPositionByGroup(
    position: PanelPosition
): position is PanelPositionByGroup {
    return 'referenceGroup' in position;
}

/**
 * Type guard to check if a position is absolute
 */
export function isPanelPositionAbsolute(
    position: PanelPosition
): position is PanelPositionAbsolute {
    return (
        !('referencePanel' in position) &&
        !('referenceGroup' in position) &&
        'direction' in position
    );
}

/**
 * Type guard to check if children is a render function
 */
export function isRenderFunction<P>(
    children:
        | React.ReactNode
        | ((props: DockviewPanelRenderProps<P>) => React.ReactNode)
): children is (props: DockviewPanelRenderProps<P>) => React.ReactNode {
    return typeof children === 'function';
}

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
} from 'dockview-core';
