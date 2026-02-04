import React from 'react';
import { SplitviewContext } from './context';
import {
    SplitviewPanelProps,
    SplitviewPanelDefinition,
    SplitviewPanelCallbacks,
} from './types';

/**
 * Creates a SplitviewPanelDefinition from SplitviewPanelProps
 */
function createPanelDefinition<P = Record<string, unknown>>(
    props: SplitviewPanelProps<P>
): SplitviewPanelDefinition<P> {
    const callbacks: SplitviewPanelCallbacks = {
        onDidFocus: props.onDidFocus,
        onDidBlur: props.onDidBlur,
        onDidChangeVisibility: props.onDidChangeVisibility,
    };

    return {
        id: props.id,
        content: props.children,
        params: props.params,
        index: props.index,
        size: props.size,
        minimumSize: props.minimumSize,
        maximumSize: props.maximumSize,
        snap: props.snap,
        priority: props.priority,
        callbacks,
    };
}

/**
 * A declarative panel component for use within a <Splitview> container.
 *
 * This component doesn't render anything directly. Instead, it registers
 * its definition with the parent Splitview component via context, and the
 * actual content is rendered via portals managed by the parent.
 *
 * @example
 * ```tsx
 * <Splitview orientation={Orientation.HORIZONTAL}>
 *   <SplitviewPanel id="panel1" size={200}>
 *     <div>Panel content</div>
 *   </SplitviewPanel>
 *   <SplitviewPanel id="panel2" minimumSize={100}>
 *     {({ api, containerApi, params }) => (
 *       <div>Panel with access to APIs</div>
 *     )}
 *   </SplitviewPanel>
 * </Splitview>
 * ```
 */
function SplitviewPanelComponent<P = Record<string, unknown>>(
    props: SplitviewPanelProps<P>
): null {
    const context = React.useContext(SplitviewContext);

    // Track whether this is the first render (for registration vs update)
    const isFirstRender = React.useRef(true);

    // Track previous props to detect changes
    const prevPropsRef = React.useRef<SplitviewPanelProps<P>>(props);

    if (context === null) {
        throw new Error(
            '<SplitviewPanel> must be used within a <Splitview> component. ' +
                'Make sure you are rendering <SplitviewPanel> as a child of <Splitview>.'
        );
    }

    const { registerPanel, unregisterPanel, updatePanel } = context;

    // Register on mount, unregister on unmount
    React.useEffect(() => {
        const definition = createPanelDefinition(props);
        registerPanel(definition as SplitviewPanelDefinition);

        return () => {
            unregisterPanel(props.id);
        };
        // Only run on mount/unmount - we handle updates separately
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle prop updates after initial registration
    React.useEffect(() => {
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
            registerPanel(definition as SplitviewPanelDefinition);
        } else {
            // Just update the existing panel
            const definition = createPanelDefinition(props);
            updatePanel(props.id, definition as Partial<SplitviewPanelDefinition>);
        }

        // Update the ref for next comparison
        prevPropsRef.current = props;
    });

    // This component doesn't render anything - content is rendered via portals
    return null;
}

SplitviewPanelComponent.displayName = 'SplitviewPanel';

/**
 * A declarative panel component for use within a <Splitview> container.
 *
 * @template P - The type of custom parameters passed to the panel
 */
export const SplitviewPanel = SplitviewPanelComponent as <
    P = Record<string, unknown>,
>(
    props: SplitviewPanelProps<P>
) => null;

// Preserve the displayName on the exported component
(SplitviewPanel as { displayName?: string }).displayName = 'SplitviewPanel';
