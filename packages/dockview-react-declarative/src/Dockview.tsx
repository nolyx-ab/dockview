import React from 'react';
import {
    createDockview,
    DockviewApi,
    DockviewComponentOptions,
    DockviewFrameworkOptions,
    DockviewGroupPanel,
    DockviewOptions,
    IHeaderActionsRenderer,
    IWatermarkRenderer,
    ITabRenderer,
    PROPERTY_KEYS_DOCKVIEW,
    SerializedDockview,
    IContentRenderer,
    GroupPanelPartInitParameters,
    TabPartInitParameters,
    WatermarkRendererInitParameters,
    IGroupHeaderProps,
    PanelUpdateEvent,
    DockviewEmitter,
    DockviewEvent,
    DockviewIDisposable,
    DockviewCompositeDisposable,
    DockviewMutableDisposable,
} from 'dockview-core';
import {
    DockviewProps,
    DockviewHandle,
    PanelDefinition,
    DockviewPanelRenderProps,
    isRenderFunction,
    DockviewHeaderActionsProps,
    DockviewWatermarkProps,
    DockviewPanelTabProps,
} from './types';
import { DockviewContext, DockviewContextValue, PanelContext } from './context';
import { PortalManager, usePortalStore, PortalStore } from './portals';
import { extractPanelDefinitions, PanelReconciler } from './reconciler';

// =============================================================================
// Empty Layout Helper
// =============================================================================

/**
 * Creates an empty serialized layout for use as a default value
 */
function createEmptyLayout(): SerializedDockview {
    return {
        grid: {
            root: { type: 'branch', data: [] },
            height: 0,
            width: 0,
            orientation: 'HORIZONTAL' as any,
        },
        panels: {},
    };
}

// =============================================================================
// Header Actions Renderer
// =============================================================================

/**
 * Renderer for header action components (left, right, prefix)
 * Tracks panel changes and updates the component accordingly
 */
class DeclarativeHeaderActionsRenderer implements IHeaderActionsRenderer {
    readonly element: HTMLElement;
    private disposed = false;
    private portalDisposable?: DockviewIDisposable;
    private readonly mutableDisposable = new DockviewMutableDisposable();
    private containerApi?: DockviewApi;

    constructor(
        private readonly component: React.ComponentType<DockviewHeaderActionsProps>,
        private readonly portalStore: PortalStore,
        private readonly group: DockviewGroupPanel
    ) {
        this.element = document.createElement('div');
        this.element.className = 'dv-react-part dv-header-actions';
        this.element.style.height = '100%';
        this.element.style.width = '100%';
    }

    init(params: IGroupHeaderProps): void {
        this.containerApi = params.containerApi;

        // Subscribe to panel and active state changes
        this.mutableDisposable.value = new DockviewCompositeDisposable(
            this.group.model.onDidAddPanel(() => this.updateContent()),
            this.group.model.onDidRemovePanel(() => this.updateContent()),
            this.group.model.onDidActivePanelChange(() => this.updateContent()),
            params.api.onDidActiveChange(() => this.updateContent())
        );

        this.renderContent();
    }

    private renderContent(): void {
        if (!this.containerApi) {
            return;
        }

        const props: DockviewHeaderActionsProps = {
            api: this.group.api,
            containerApi: this.containerApi,
            panels: this.group.panels,
            activePanel: this.group.activePanel ?? undefined,
            isGroupActive: this.group.isActive,
            group: this.group,
        };

        const content = React.createElement(this.component, props);

        if (this.portalDisposable) {
            this.portalStore.updatePortal(
                `header-actions-${this.group.id}-${this.component.name ?? 'action'}`,
                content
            );
        } else {
            this.portalDisposable = this.portalStore.addPortal(
                `header-actions-${this.group.id}-${this.component.name ?? 'action'}`,
                this.element,
                content
            );
        }
    }

    private updateContent(): void {
        this.renderContent();
    }

    dispose(): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        this.mutableDisposable.dispose();
        this.portalDisposable?.dispose();
    }
}

/**
 * Factory function to create header action component renderers
 */
function createHeaderActionsRenderer(
    component: React.ComponentType<DockviewHeaderActionsProps> | undefined,
    portalStore: PortalStore
): ((group: DockviewGroupPanel) => IHeaderActionsRenderer) | undefined {
    if (!component) {
        return undefined;
    }
    return (group: DockviewGroupPanel) => {
        return new DeclarativeHeaderActionsRenderer(component, portalStore, group);
    };
}

// =============================================================================
// Watermark Renderer
// =============================================================================

/**
 * Renderer for the watermark component
 */
class DeclarativeWatermarkRenderer implements IWatermarkRenderer {
    readonly element: HTMLElement;
    private disposed = false;
    private portalDisposable?: DockviewIDisposable;
    private groupId?: string;

    constructor(
        private readonly component: React.ComponentType<DockviewWatermarkProps>,
        private readonly portalStore: PortalStore
    ) {
        this.element = document.createElement('div');
        this.element.className = 'dv-react-part dv-watermark';
        this.element.style.height = '100%';
        this.element.style.width = '100%';
    }

    init(params: WatermarkRendererInitParameters): void {
        this.groupId = params.group?.id;

        const props: DockviewWatermarkProps = {
            containerApi: params.containerApi,
            group: params.group,
        };

        const content = React.createElement(this.component, props);
        this.portalDisposable = this.portalStore.addPortal(
            `watermark-${this.groupId ?? 'main'}`,
            this.element,
            content
        );
    }

    focus(): void {
        // noop
    }

    update(_params: PanelUpdateEvent): void {
        // Watermark doesn't need updates
    }

    layout(_width: number, _height: number): void {
        // noop
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
// Declarative Content Renderer
// =============================================================================

/**
 * Content renderer that works with the declarative panel system.
 * Renders panel content via React portals based on panel definitions.
 */
export class DeclarativeContentRenderer implements IContentRenderer {
    private readonly _element: HTMLElement;
    private disposed = false;
    private portalDisposable?: DockviewIDisposable;
    private panelApi?: GroupPanelPartInitParameters['api'];
    private containerApi?: GroupPanelPartInitParameters['containerApi'];
    private params?: Record<string, unknown>;

    private readonly _onDidFocus = new DockviewEmitter<void>();
    readonly onDidFocus: DockviewEvent<void> = this._onDidFocus.event;

    private readonly _onDidBlur = new DockviewEmitter<void>();
    readonly onDidBlur: DockviewEvent<void> = this._onDidBlur.event;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly portalStore: PortalStore,
        private readonly getPanelDefinition: (id: string) => PanelDefinition | undefined
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-react-part';
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    focus(): void {
        // Focus handling can be implemented if needed
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this.panelApi = parameters.api;
        this.containerApi = parameters.containerApi;
        this.params = parameters.params;
        this.renderContent();
    }

    update(event: PanelUpdateEvent): void {
        this.params = event.params;
        this.renderContent();
    }

    layout(_width: number, _height: number): void {
        // Layout is handled by CSS, no action needed
    }

    private renderContent(): void {
        if (!this.panelApi || !this.containerApi) {
            return;
        }

        const definition = this.getPanelDefinition(this.id);
        if (!definition) {
            return;
        }

        // Build the render props
        const renderProps: DockviewPanelRenderProps = {
            api: this.panelApi,
            containerApi: this.containerApi,
            params: this.params ?? {},
        };

        // Determine the content to render
        let content: React.ReactNode;
        if (isRenderFunction(definition.content)) {
            content = definition.content(renderProps);
        } else {
            content = definition.content;
        }

        // Wrap content with PanelContext provider
        const wrappedContent = React.createElement(
            PanelContext.Provider,
            {
                value: {
                    api: this.panelApi,
                    containerApi: this.containerApi,
                    params: this.params ?? {},
                },
            },
            content
        );

        // Update or create the portal
        if (this.portalDisposable) {
            this.portalStore.updatePortal(this.id, wrappedContent);
        } else {
            this.portalDisposable = this.portalStore.addPortal(
                this.id,
                this._element,
                wrappedContent
            );
        }
    }

    dispose(): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        this._onDidFocus.dispose();
        this._onDidBlur.dispose();
        this.portalDisposable?.dispose();
    }
}

// =============================================================================
// Tab Renderer
// =============================================================================

/**
 * Tab renderer for custom tab components
 */
class DeclarativeTabRenderer implements ITabRenderer {
    readonly element: HTMLElement;
    private disposed = false;
    private portalDisposable?: DockviewIDisposable;
    private currentParams?: TabPartInitParameters;

    constructor(
        private readonly id: string,
        private readonly component: React.ComponentType<DockviewPanelTabProps>,
        private readonly portalStore: PortalStore
    ) {
        this.element = document.createElement('div');
        this.element.className = 'dv-react-part dv-tab';
    }

    init(parameters: TabPartInitParameters): void {
        this.currentParams = parameters;

        const props: DockviewPanelTabProps = {
            api: parameters.api,
            containerApi: parameters.containerApi,
            params: parameters.params,
            tabLocation: parameters.tabLocation,
        };

        const content = React.createElement(this.component, props);
        this.portalDisposable = this.portalStore.addPortal(
            `tab-${this.id}`,
            this.element,
            content
        );
    }

    update(event: PanelUpdateEvent): void {
        if (!this.currentParams) {
            return;
        }

        this.currentParams.params = event.params;

        const props: DockviewPanelTabProps = {
            api: this.currentParams.api,
            containerApi: this.currentParams.containerApi,
            params: this.currentParams.params,
            tabLocation: this.currentParams.tabLocation,
        };

        const content = React.createElement(this.component, props);
        this.portalStore.updatePortal(`tab-${this.id}`, content);
    }

    focus(): void {
        // noop
    }

    layout(_width: number, _height: number): void {
        // noop
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
// Extract Core Options
// =============================================================================

/**
 * Extracts DockviewOptions from DockviewProps
 */
function extractCoreOptions(props: DockviewProps): DockviewOptions {
    const coreOptions = PROPERTY_KEYS_DOCKVIEW.reduce((obj, key) => {
        if (key in props) {
            obj[key] = (props as any)[key];
        }
        return obj;
    }, {} as Partial<DockviewComponentOptions>);

    return coreOptions as DockviewOptions;
}

// =============================================================================
// Inner Dockview Component
// =============================================================================

interface InnerDockviewProps extends DockviewProps {
    portalStore: PortalStore;
}

/**
 * Inner component that has access to the portal store via context
 */
const InnerDockview = React.forwardRef<DockviewHandle, InnerDockviewProps>(
    function InnerDockview(props, ref) {
        const { portalStore, children, className, style, onReady } = props;

        // Refs
        const containerRef = React.useRef<HTMLDivElement>(null);
        const apiRef = React.useRef<DockviewApi | null>(null);
        const reconcilerRef = React.useRef<PanelReconciler | null>(null);
        const panelDefinitionsRef = React.useRef<Map<string, PanelDefinition>>(new Map());
        const prevPropsRef = React.useRef<Partial<DockviewProps>>({});

        // State
        const [isReady, setIsReady] = React.useState(false);

        // Expose imperative handle
        React.useImperativeHandle(
            ref,
            () => ({
                getApi: () => apiRef.current,
                toJSON: () => apiRef.current?.toJSON() ?? createEmptyLayout(),
                fromJSON: (data: SerializedDockview) => apiRef.current?.fromJSON(data),
                focus: () => apiRef.current?.focus(),
            }),
            []
        );

        // Function to get panel definition by ID
        const getPanelDefinition = React.useCallback((id: string): PanelDefinition | undefined => {
            return panelDefinitionsRef.current.get(id);
        }, []);

        // Initialize dockview on mount
        React.useEffect(() => {
            if (!containerRef.current) {
                return;
            }

            // Create framework options
            const frameworkOptions: DockviewFrameworkOptions = {
                createComponent: (options) => {
                    return new DeclarativeContentRenderer(
                        options.id,
                        portalStore,
                        getPanelDefinition
                    );
                },
                createLeftHeaderActionComponent: createHeaderActionsRenderer(
                    props.leftHeaderActionsComponent,
                    portalStore
                ),
                createRightHeaderActionComponent: createHeaderActionsRenderer(
                    props.rightHeaderActionsComponent,
                    portalStore
                ),
                createPrefixHeaderActionComponent: createHeaderActionsRenderer(
                    props.prefixHeaderActionsComponent,
                    portalStore
                ),
                createWatermarkComponent: props.watermarkComponent
                    ? () => new DeclarativeWatermarkRenderer(props.watermarkComponent!, portalStore)
                    : undefined,
                createTabComponent: props.defaultTabComponent
                    ? (options) =>
                          new DeclarativeTabRenderer(
                              options.id,
                              props.defaultTabComponent!,
                              portalStore
                          )
                    : undefined,
                defaultTabComponent: props.defaultTabComponent ? '__declarative_tab__' : undefined,
            };

            // Create the dockview instance
            const api = createDockview(containerRef.current, {
                ...extractCoreOptions(props),
                ...frameworkOptions,
            });

            // Perform initial layout
            const { clientWidth, clientHeight } = containerRef.current;
            api.layout(clientWidth, clientHeight);

            // Store the API reference
            apiRef.current = api;

            // Create the reconciler
            reconcilerRef.current = new PanelReconciler(api);

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

            const changes: Partial<DockviewOptions> = {};

            PROPERTY_KEYS_DOCKVIEW.forEach((key) => {
                const propValue = (props as any)[key];
                if (key in props && propValue !== (prevPropsRef.current as any)[key]) {
                    (changes as any)[key] = propValue;
                }
            });

            if (Object.keys(changes).length > 0) {
                apiRef.current.updateOptions(changes);
            }

            prevPropsRef.current = props;
        }, PROPERTY_KEYS_DOCKVIEW.map((key) => (props as any)[key]));

        // Subscribe to onDidDrop events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidDrop((event) => {
                props.onDidDrop?.(event);
            });

            return () => disposable.dispose();
        }, [props.onDidDrop]);

        // Subscribe to onWillDrop events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onWillDrop((event) => {
                props.onWillDrop?.(event);
            });

            return () => disposable.dispose();
        }, [props.onWillDrop]);

        // Subscribe to onWillShowOverlay events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onWillShowOverlay((event) => {
                props.onWillShowOverlay?.(event);
            });

            return () => disposable.dispose();
        }, [props.onWillShowOverlay]);

        // Subscribe to onDidAddPanel events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidAddPanel((panel) => {
                props.onDidAddPanel?.(panel);
            });

            return () => disposable.dispose();
        }, [props.onDidAddPanel]);

        // Subscribe to onDidRemovePanel events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidRemovePanel((panel) => {
                props.onDidRemovePanel?.(panel);
            });

            return () => disposable.dispose();
        }, [props.onDidRemovePanel]);

        // Subscribe to onDidActivePanelChange events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidActivePanelChange((panel) => {
                props.onDidActivePanelChange?.(panel);
            });

            return () => disposable.dispose();
        }, [props.onDidActivePanelChange]);

        // Subscribe to onDidMovePanel events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidMovePanel((event) => {
                props.onDidMovePanel?.(event);
            });

            return () => disposable.dispose();
        }, [props.onDidMovePanel]);

        // Subscribe to onDidAddGroup events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidAddGroup((group) => {
                props.onDidAddGroup?.(group);
            });

            return () => disposable.dispose();
        }, [props.onDidAddGroup]);

        // Subscribe to onDidRemoveGroup events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidRemoveGroup((group) => {
                props.onDidRemoveGroup?.(group);
            });

            return () => disposable.dispose();
        }, [props.onDidRemoveGroup]);

        // Subscribe to onDidActiveGroupChange events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidActiveGroupChange((group) => {
                props.onDidActiveGroupChange?.(group);
            });

            return () => disposable.dispose();
        }, [props.onDidActiveGroupChange]);

        // Subscribe to onWillDragGroup events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onWillDragGroup((event) => {
                props.onWillDragGroup?.(event);
            });

            return () => disposable.dispose();
        }, [props.onWillDragGroup]);

        // Subscribe to onWillDragPanel events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onWillDragPanel((event) => {
                props.onWillDragPanel?.(event);
            });

            return () => disposable.dispose();
        }, [props.onWillDragPanel]);

        // Subscribe to onUnhandledDragOverEvent events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onUnhandledDragOverEvent((event) => {
                props.onUnhandledDragOverEvent?.(event);
            });

            return () => disposable.dispose();
        }, [props.onUnhandledDragOverEvent]);

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

        // Subscribe to onDidMaximizedGroupChange events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidMaximizedGroupChange((event) => {
                props.onDidMaximizedGroupChange?.(event);
            });

            return () => disposable.dispose();
        }, [props.onDidMaximizedGroupChange]);

        // Subscribe to onDidPopoutGroupSizeChange events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidPopoutGroupSizeChange((event) => {
                props.onDidPopoutGroupSizeChange?.(event);
            });

            return () => disposable.dispose();
        }, [props.onDidPopoutGroupSizeChange]);

        // Subscribe to onDidPopoutGroupPositionChange events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidPopoutGroupPositionChange((event) => {
                props.onDidPopoutGroupPositionChange?.(event);
            });

            return () => disposable.dispose();
        }, [props.onDidPopoutGroupPositionChange]);

        // Subscribe to onDidOpenPopoutWindowFail events
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            const disposable = apiRef.current.onDidOpenPopoutWindowFail(() => {
                props.onDidOpenPopoutWindowFail?.();
            });

            return () => disposable.dispose();
        }, [props.onDidOpenPopoutWindowFail]);

        // Update header action components when they change
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            apiRef.current.updateOptions({
                createRightHeaderActionComponent: createHeaderActionsRenderer(
                    props.rightHeaderActionsComponent,
                    portalStore
                ),
            });
        }, [props.rightHeaderActionsComponent, portalStore]);

        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            apiRef.current.updateOptions({
                createLeftHeaderActionComponent: createHeaderActionsRenderer(
                    props.leftHeaderActionsComponent,
                    portalStore
                ),
            });
        }, [props.leftHeaderActionsComponent, portalStore]);

        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            apiRef.current.updateOptions({
                createPrefixHeaderActionComponent: createHeaderActionsRenderer(
                    props.prefixHeaderActionsComponent,
                    portalStore
                ),
            });
        }, [props.prefixHeaderActionsComponent, portalStore]);

        // Update watermark component when it changes
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            apiRef.current.updateOptions({
                createWatermarkComponent: props.watermarkComponent
                    ? () =>
                          new DeclarativeWatermarkRenderer(
                              props.watermarkComponent!,
                              portalStore
                          )
                    : undefined,
            });
        }, [props.watermarkComponent, portalStore]);

        // Update default tab component when it changes
        React.useEffect(() => {
            if (!apiRef.current) {
                return;
            }

            apiRef.current.updateOptions({
                defaultTabComponent: props.defaultTabComponent
                    ? '__declarative_tab__'
                    : undefined,
                createTabComponent: props.defaultTabComponent
                    ? (options) =>
                          new DeclarativeTabRenderer(
                              options.id,
                              props.defaultTabComponent!,
                              portalStore
                          )
                    : undefined,
            });
        }, [props.defaultTabComponent, portalStore]);

        // Create context value
        const contextValue = React.useMemo<DockviewContextValue>(
            () => ({
                api: apiRef.current,
                registerPanel: (definition: PanelDefinition) => {
                    panelDefinitionsRef.current.set(definition.id, definition);
                },
                unregisterPanel: (id: string) => {
                    panelDefinitionsRef.current.delete(id);
                },
                updatePanel: (id: string, changes: Partial<PanelDefinition>) => {
                    const existing = panelDefinitionsRef.current.get(id);
                    if (existing) {
                        panelDefinitionsRef.current.set(id, {
                            ...existing,
                            ...changes,
                        } as PanelDefinition);
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

            const panelDefinitions = extractPanelDefinitions(children);

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
            <DockviewContext.Provider value={contextValue}>
                <div ref={containerRef} className={className} style={containerStyle} />
                {children}
            </DockviewContext.Provider>
        );
    }
);

// =============================================================================
// Main Dockview Component
// =============================================================================

/**
 * A declarative React component for creating dockview layouts.
 *
 * The Dockview component manages a dockview-core instance and provides a
 * declarative API for defining panels as React children.
 *
 * @example
 * ```tsx
 * import { Dockview, DockviewPanel } from 'dockview-react-declarative';
 *
 * function App() {
 *   return (
 *     <Dockview
 *       onReady={({ api }) => console.log('Dockview ready', api)}
 *       style={{ height: '100vh' }}
 *     >
 *       <DockviewPanel id="panel1" title="Panel 1">
 *         <div>Content for Panel 1</div>
 *       </DockviewPanel>
 *       <DockviewPanel id="panel2" title="Panel 2">
 *         {({ api, params }) => <div>Panel 2 with API access</div>}
 *       </DockviewPanel>
 *     </Dockview>
 *   );
 * }
 * ```
 */
export const Dockview = React.forwardRef<DockviewHandle, DockviewProps>(
    function Dockview(props, ref) {
        return (
            <PortalManager>
                <DockviewWithPortalStore {...props} ref={ref} />
            </PortalManager>
        );
    }
);

Dockview.displayName = 'Dockview';

/**
 * Internal component that retrieves the portal store from context
 */
const DockviewWithPortalStore = React.forwardRef<DockviewHandle, DockviewProps>(
    function DockviewWithPortalStore(props, ref) {
        const portalStore = usePortalStore();
        return <InnerDockview {...props} portalStore={portalStore} ref={ref} />;
    }
);
