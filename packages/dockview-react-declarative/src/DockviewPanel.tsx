import * as React from 'react';
import { useContext, useEffect, useRef } from 'react';
import { DockviewContext } from './context';
import {
    DockviewPanelProps,
    PanelDefinition,
    DockviewPanelCallbacks,
} from './types';

/**
 * Creates a PanelDefinition from DockviewPanelProps
 */
function createPanelDefinition<P = Record<string, unknown>>(
    props: DockviewPanelProps<P>
): PanelDefinition<P> {
    const callbacks: DockviewPanelCallbacks = {
        onDidFocus: props.onDidFocus,
        onDidBlur: props.onDidBlur,
        onDidChangeVisibility: props.onDidChangeVisibility,
    };

    return {
        id: props.id,
        title: props.title,
        content: props.children,
        params: props.params,
        position: props.position,
        floating: props.floating,
        tabComponent: props.tabComponent,
        renderer: props.renderer,
        inactive: props.inactive,
        minimumWidth: props.minimumWidth,
        minimumHeight: props.minimumHeight,
        maximumWidth: props.maximumWidth,
        maximumHeight: props.maximumHeight,
        initialWidth: props.initialWidth,
        initialHeight: props.initialHeight,
        callbacks,
    };
}

/**
 * A declarative panel component for use within a <Dockview> container.
 *
 * This component doesn't render anything directly. Instead, it registers
 * its definition with the parent Dockview component via context, and the
 * actual content is rendered via portals managed by the parent.
 *
 * @example
 * ```tsx
 * <Dockview>
 *   <DockviewPanel id="panel1" title="Panel 1">
 *     <div>Panel content</div>
 *   </DockviewPanel>
 *   <DockviewPanel id="panel2" title="Panel 2">
 *     {({ api, containerApi, params }) => (
 *       <div>Panel with access to APIs</div>
 *     )}
 *   </DockviewPanel>
 * </Dockview>
 * ```
 */
function DockviewPanelComponent<P = Record<string, unknown>>(
    props: DockviewPanelProps<P>
): null {
    const context = useContext(DockviewContext);

    // Track whether this is the first render (for registration vs update)
    const isFirstRender = useRef(true);

    // Track previous props to detect changes
    const prevPropsRef = useRef<DockviewPanelProps<P>>(props);

    if (context === null) {
        throw new Error(
            '<DockviewPanel> must be used within a <Dockview> component. ' +
                'Make sure you are rendering <DockviewPanel> as a child of <Dockview>.'
        );
    }

    const { registerPanel, unregisterPanel, updatePanel } = context;

    // Register on mount, unregister on unmount
    useEffect(() => {
        const definition = createPanelDefinition(props);
        registerPanel(definition as PanelDefinition);

        return () => {
            unregisterPanel(props.id);
        };
        // Only run on mount/unmount - we handle updates separately
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle prop updates after initial registration
    useEffect(() => {
        // Skip the first render since we handle registration above
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const prevProps = prevPropsRef.current;

        // Check if id changed - this requires unregister/register
        if (prevProps.id !== props.id) {
            // Unregister old panel and register new one
            unregisterPanel(prevProps.id);
            const definition = createPanelDefinition(props);
            registerPanel(definition as PanelDefinition);
        } else {
            // Just update the existing panel
            const definition = createPanelDefinition(props);
            updatePanel(props.id, definition as Partial<PanelDefinition>);
        }

        // Update the ref for next comparison
        prevPropsRef.current = props;
    });

    // This component doesn't render anything - content is rendered via portals
    return null;
}

DockviewPanelComponent.displayName = 'DockviewPanel';

/**
 * A declarative panel component for use within a <Dockview> container.
 *
 * @template P - The type of custom parameters passed to the panel
 */
export const DockviewPanel = DockviewPanelComponent as <
    P = Record<string, unknown>,
>(
    props: DockviewPanelProps<P>
) => null;

// Preserve the displayName on the exported component
(DockviewPanel as { displayName?: string }).displayName = 'DockviewPanel';
