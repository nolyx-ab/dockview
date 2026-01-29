import * as React from 'react';
import {
    DockviewEmitter,
    DockviewEvent,
    DockviewIDisposable,
    IContentRenderer,
    GroupPanelPartInitParameters,
    PanelUpdateEvent,
    DockviewPanelApi,
    DockviewApi,
} from 'dockview-core';
import { PortalStore } from '../portals';
import { PanelContext, PanelContextValue } from '../context';
import { PanelDefinition, DockviewPanelRenderProps, isRenderFunction } from '../types';

/**
 * DeclarativeContentRenderer bridges React content with dockview-core's DOM management.
 * It implements the IContentRenderer interface to render declarative panel content
 * using React portals.
 */
export class DeclarativeContentRenderer implements IContentRenderer {
    private readonly _element: HTMLElement;
    private portalDisposable: DockviewIDisposable | null = null;

    private readonly _onDidFocus = new DockviewEmitter<void>();
    readonly onDidFocus: DockviewEvent<void> = this._onDidFocus.event;

    private readonly _onDidBlur = new DockviewEmitter<void>();
    readonly onDidBlur: DockviewEvent<void> = this._onDidBlur.event;

    // Stored initialization parameters
    private api: DockviewPanelApi | null = null;
    private containerApi: DockviewApi | null = null;
    private params: Record<string, unknown> = {};

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        public readonly panelId: string,
        private readonly portalStore: PortalStore,
        private readonly getPanelDefinition: () => PanelDefinition | undefined,
        private readonly onParamsUpdate?: (params: Record<string, unknown>) => void
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-react-part';
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    /**
     * Initialize the renderer with panel parameters and create the React portal.
     */
    init(parameters: GroupPanelPartInitParameters): void {
        this.api = parameters.api;
        this.containerApi = parameters.containerApi;
        this.params = parameters.params ?? {};

        this.createPortal();
    }

    /**
     * Update panel parameters and refresh the portal content.
     */
    update(event: PanelUpdateEvent): void {
        // Merge new params with existing params
        this.params = {
            ...this.params,
            ...event.params,
        };

        // Notify external handler if provided
        if (this.onParamsUpdate) {
            this.onParamsUpdate(this.params);
        }

        // Update the portal content
        this.updatePortalContent();
    }

    /**
     * Focus the panel element.
     */
    focus(): void {
        this._element.focus();
    }

    /**
     * Handle layout changes (currently a no-op as React handles sizing).
     */
    layout(_width: number, _height: number): void {
        // React components handle their own sizing
    }

    /**
     * Clean up resources when the renderer is disposed.
     */
    dispose(): void {
        this._onDidFocus.dispose();
        this._onDidBlur.dispose();
        this.portalDisposable?.dispose();
        this.portalDisposable = null;
    }

    /**
     * Create the React portal for rendering panel content.
     */
    private createPortal(): void {
        const content = this.buildContent();
        if (content) {
            this.portalDisposable = this.portalStore.addPortal(
                this.panelId,
                this._element,
                content
            );
        }
    }

    /**
     * Update the existing portal with new content.
     */
    private updatePortalContent(): void {
        const content = this.buildContent();
        if (content) {
            this.portalStore.updatePortal(this.panelId, content);
        }
    }

    /**
     * Build the React content to render in the portal.
     * Wraps the content with PanelContext.Provider for API access.
     */
    private buildContent(): React.ReactNode {
        const definition = this.getPanelDefinition();
        if (!definition || !this.api || !this.containerApi) {
            return null;
        }

        const { content } = definition;

        // Build the render props for render functions
        const renderProps: DockviewPanelRenderProps = {
            api: this.api,
            containerApi: this.containerApi,
            params: this.params,
        };

        // Determine the actual content to render
        let renderedContent: React.ReactNode;
        if (isRenderFunction(content)) {
            // Content is a render function - call it with props
            renderedContent = content(renderProps);
        } else {
            // Content is a React node - render it directly
            renderedContent = content;
        }

        // Build the context value
        const contextValue: PanelContextValue = {
            api: this.api,
            containerApi: this.containerApi,
            params: this.params,
        };

        // Wrap content with PanelContext.Provider
        return React.createElement(
            PanelContext.Provider,
            { value: contextValue },
            renderedContent
        );
    }
}
