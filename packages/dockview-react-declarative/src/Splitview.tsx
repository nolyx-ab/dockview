import React from 'react';
import {
    createSplitview,
    SplitviewApi,
    SplitviewOptions,
    SplitviewFrameworkOptions,
    PROPERTY_KEYS_SPLITVIEW,
    SerializedSplitview,
    SplitviewPanel as SplitviewPanelCore,
    PanelViewInitParameters,
    IFrameworkPart,
    DockviewIDisposable,
    Orientation,
    Parameters,
} from 'dockview-core';
import {
    SplitviewProps,
    SplitviewHandle,
    SplitviewPanelDefinition,
    SplitviewPanelRenderProps,
    isSplitviewRenderFunction,
} from './types';
import { SplitviewContext, SplitviewContextValue, SplitviewPanelContext } from './context';
import { PortalManager, usePortalStore, PortalStore } from './portals';
import { extractSplitviewPanelDefinitions, SplitviewPanelReconciler } from './reconciler';

// =============================================================================
// Empty Layout Helper
// =============================================================================

/**
 * Creates an empty serialized layout for use as a default value
 */
function createEmptyLayout(): SerializedSplitview {
    return {
        views: [],
        size: 0,
        orientation: Orientation.HORIZONTAL,
    };
}

// =============================================================================
// Declarative Framework Part for Splitview
// =============================================================================

/**
 * Framework part that handles rendering React content via portals
 */
class DeclarativeSplitviewPart implements IFrameworkPart {
    private disposed = false;
    private portalDisposable?: DockviewIDisposable;

    constructor(
        private readonly panelId: string,
        private readonly element: HTMLElement,
        private readonly portalStore: PortalStore,
        private readonly getPanelDefinition: (id: string) => SplitviewPanelDefinition | undefined,
        private readonly api: any, // SplitviewPanelApi
        private readonly containerApi: SplitviewApi,
        private currentParams: Parameters
    ) {
        this.renderContent();
    }

    update(params: Parameters): void {
        this.currentParams = params;
        this.renderContent();
    }

    private renderContent(): void {
        const definition = this.getPanelDefinition(this.panelId);
        if (!definition) {
            return;
        }

        // Build the render props
        const renderProps: SplitviewPanelRenderProps = {
            api: this.api,
            containerApi: this.containerApi,
            params: this.currentParams ?? {},
        };

        // Determine the content to render
        let content: React.ReactNode;
        if (isSplitviewRenderFunction(definition.content)) {
            content = definition.content(renderProps);
        } else {
            content = definition.content;
        }

        // Wrap content with SplitviewPanelContext provider
        const wrappedContent = React.createElement(
            SplitviewPanelContext.Provider,
            {
                value: {
                    api: this.api,
                    containerApi: this.containerApi,
                    params: this.currentParams ?? {},
                },
            },
            content
        );

        // Update or create the portal
        if (this.portalDisposable) {
            this.portalStore.updatePortal(this.panelId, wrappedContent);
        } else {
            this.portalDisposable = this.portalStore.addPortal(
                this.panelId,
                this.element,
                wrappedContent
            );
        }
    }

    dispose(): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        this.portalDisposable?.dispose();
    }
}

// =============================================================================
// Declarative Content Renderer for Splitview
// =============================================================================

/**
 * Content renderer that works with the declarative splitview panel system.
 * Extends SplitviewPanel to integrate with the splitview framework.
 */
class DeclarativeSplitviewContentRenderer extends SplitviewPanelCore {
    private containerApiRef?: SplitviewApi;

    constructor(
        id: string,
        componentName: string,
        private readonly portalStore: PortalStore,
        private readonly getPanelDefinition: (id: string) => SplitviewPanelDefinition | undefined
    ) {
        super(id, componentName);
    }

    protected getComponent(): IFrameworkPart {
        // Create the container API from the accessor
        const params = this._params as PanelViewInitParameters;
        this.containerApiRef = new SplitviewApi(params.accessor);

        return new DeclarativeSplitviewPart(
            this.id,
            this.element,
            this.portalStore,
            this.getPanelDefinition,
            this.api,
            this.containerApiRef,
            params.params ?? {}
        );
    }
}

// =============================================================================
// Extract Core Options
// =============================================================================

/**
 * Extracts SplitviewOptions from SplitviewProps
 */
function extractCoreOptions(props: SplitviewProps): SplitviewOptions {
    const coreOptions = PROPERTY_KEYS_SPLITVIEW.reduce((obj, key) => {
        if (key in props) {
            obj[key] = (props as any)[key];
        }
        return obj;
    }, {} as Partial<SplitviewOptions>);

    return coreOptions as SplitviewOptions;
}

// =============================================================================
// Inner Splitview Component
// =============================================================================

interface InnerSplitviewProps extends SplitviewProps {
    portalStore: PortalStore;
}

/**
 * Inner component that has access to the portal store via context
 */
const InnerSplitview = React.forwardRef<SplitviewHandle, InnerSplitviewProps>(
    function InnerSplitview(props, ref) {
        const { portalStore, children, className, style, onReady } = props;

        // Refs
        const containerRef = React.useRef<HTMLDivElement>(null);
        const apiRef = React.useRef<SplitviewApi | null>(null);
        const reconcilerRef = React.useRef<SplitviewPanelReconciler | null>(null);
        const panelDefinitionsRef = React.useRef<Map<string, SplitviewPanelDefinition>>(
            new Map()
        );
        const prevPropsRef = React.useRef<Partial<SplitviewProps>>({});

        // State
        const [isReady, setIsReady] = React.useState(false);

        // Expose imperative handle
        React.useImperativeHandle(
            ref,
            () => ({
                getApi: () => apiRef.current,
                toJSON: () => apiRef.current?.toJSON() ?? createEmptyLayout(),
                fromJSON: (data: SerializedSplitview) => apiRef.current?.fromJSON(data),
                focus: () => apiRef.current?.focus(),
            }),
            []
        );

        // Function to get panel definition by ID
        const getPanelDefinition = React.useCallback(
            (id: string): SplitviewPanelDefinition | undefined => {
                return panelDefinitionsRef.current.get(id);
            },
            []
        );

        // Initialize splitview on mount
        React.useEffect(() => {
            if (!containerRef.current) {
                return;
            }

            // Create framework options
            const frameworkOptions: SplitviewFrameworkOptions = {
                createComponent: (options) => {
                    return new DeclarativeSplitviewContentRenderer(
                        options.id,
                        options.name,
                        portalStore,
                        getPanelDefinition
                    );
                },
            };

            // Create the splitview instance
            const api = createSplitview(containerRef.current, {
                ...extractCoreOptions(props),
                ...frameworkOptions,
            });

            // Perform initial layout
            const { clientWidth, clientHeight } = containerRef.current;
            api.layout(clientWidth, clientHeight);

            // Store the API reference
            apiRef.current = api;

            // Create the reconciler
            reconcilerRef.current = new SplitviewPanelReconciler(api);

            // Mark as ready
            setIsReady(true);

            // Call onReady callback
            if (onReady) {
                onReady({ api });
            }

            // Cleanup on unmount
            return () => {
                apiRef.current = null;
                reconcilerRef.current = null;
                panelDefinitionsRef.current.clear();
                api.dispose();
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // Handle options updates
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const changes: Partial<SplitviewOptions> = {};

            PROPERTY_KEYS_SPLITVIEW.forEach((key) => {
                const propValue = (props as any)[key];
                if (key in props && propValue !== (prevPropsRef.current as any)[key]) {
                    (changes as any)[key] = propValue;
                }
            });

            if (Object.keys(changes).length > 0) {
                apiRef.current.updateOptions(changes);
            }

            prevPropsRef.current = props;
        }, PROPERTY_KEYS_SPLITVIEW.map((key) => (props as any)[key]));

        // Subscribe to onDidAddView events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidAddView((view) => {
                props.onDidAddView?.(view);
            });

            return () => disposable.dispose();
        }, [props.onDidAddView]);

        // Subscribe to onDidRemoveView events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidRemoveView((view) => {
                props.onDidRemoveView?.(view);
            });

            return () => disposable.dispose();
        }, [props.onDidRemoveView]);

        // Subscribe to onDidLayoutChange events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidLayoutChange(() => {
                props.onDidLayoutChange?.();
            });

            return () => disposable.dispose();
        }, [props.onDidLayoutChange]);

        // Subscribe to onDidLayoutFromJSON events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidLayoutFromJSON(() => {
                props.onDidLayoutFromJSON?.();
            });

            return () => disposable.dispose();
        }, [props.onDidLayoutFromJSON]);

        // Create context value
        const contextValue = React.useMemo<SplitviewContextValue>(
            () => ({
                api: apiRef.current,
                registerPanel: (definition: SplitviewPanelDefinition) => {
                    panelDefinitionsRef.current.set(definition.id, definition);
                },
                unregisterPanel: (id: string) => {
                    panelDefinitionsRef.current.delete(id);
                },
                updatePanel: (id: string, changes: Partial<SplitviewPanelDefinition>) => {
                    const existing = panelDefinitionsRef.current.get(id);
                    if (existing) {
                        panelDefinitionsRef.current.set(id, {
                            ...existing,
                            ...changes,
                        } as SplitviewPanelDefinition);
                    }
                },
            }),
            [isReady]
        );

        // Extract panel definitions from children and reconcile
        React.useEffect(() => {
            if (!isReady || !reconcilerRef.current) {
                return;
            }

            const panelDefinitions = extractSplitviewPanelDefinitions(children);

            // Store definitions for the content renderer to access
            for (const def of panelDefinitions) {
                panelDefinitionsRef.current.set(def.id, def);
            }

            // Reconcile panels
            reconcilerRef.current.reconcile(panelDefinitions);
        }, [children, isReady]);

        // Container styles
        const containerStyle: React.CSSProperties = React.useMemo(
            () => ({
                height: '100%',
                width: '100%',
                ...style,
            }),
            [style]
        );

        return (
            <SplitviewContext.Provider value={contextValue}>
                <div ref={containerRef} className={className} style={containerStyle} />
                {children}
            </SplitviewContext.Provider>
        );
    }
);

// =============================================================================
// Main Splitview Component
// =============================================================================

/**
 * A declarative React component for creating splitview layouts.
 *
 * The Splitview component manages a splitview-core instance and provides a
 * declarative API for defining panels as React children.
 *
 * @example
 * ```tsx
 * import { Splitview, SplitviewPanel, Orientation } from 'dockview-react-declarative';
 *
 * function App() {
 *   return (
 *     <Splitview
 *       orientation={Orientation.HORIZONTAL}
 *       onReady={({ api }) => console.log('Splitview ready', api)}
 *       style={{ height: '100vh' }}
 *     >
 *       <SplitviewPanel id="panel1" size={200}>
 *         <div>Content for Panel 1</div>
 *       </SplitviewPanel>
 *       <SplitviewPanel id="panel2" minimumSize={100}>
 *         {({ api, params }) => <div>Panel 2 with API access</div>}
 *       </SplitviewPanel>
 *     </Splitview>
 *   );
 * }
 * ```
 */
export const Splitview = React.forwardRef<SplitviewHandle, SplitviewProps>(
    function Splitview(props, ref) {
        return (
            <PortalManager>
                <SplitviewWithPortalStore {...props} ref={ref} />
            </PortalManager>
        );
    }
);

Splitview.displayName = 'Splitview';

/**
 * Internal component that retrieves the portal store from context
 */
const SplitviewWithPortalStore = React.forwardRef<SplitviewHandle, SplitviewProps>(
    function SplitviewWithPortalStore(props, ref) {
        const portalStore = usePortalStore();
        return <InnerSplitview {...props} portalStore={portalStore} ref={ref} />;
    }
);
