/**
 * Example demonstrating the declarative JSX-based API for dockview.
 *
 * This example shows how to use the new declarative API where panels
 * are defined as React children instead of using api.addPanel().
 */

import React, { useRef, useState } from 'react';
import {
    Dockview,
    DockviewPanel,
    DockviewHandle,
    DockviewReadyEvent,
    DockviewApi,
    usePanelApi,
    usePanelParams,
    DockviewPanelRenderProps,
    DockviewHeaderActionsProps,
} from 'dockview-react-declarative';
import 'dockview-core/dist/styles/dockview.css';

// =============================================================================
// Panel Components
// =============================================================================

/**
 * A simple panel component that uses hooks to access the panel API
 */
function SimplePanelWithHooks() {
    const api = usePanelApi();
    const params = usePanelParams<{ message?: string }>();

    return (
        <div
            style={{
                height: '100%',
                padding: '20px',
                background: 'var(--dv-group-view-background-color)',
            }}
        >
            <h3>Panel: {api.title}</h3>
            <p>{params?.message || 'No message provided'}</p>
            <button onClick={() => api.setTitle(`Updated ${Date.now()}`)}>
                Update Title
            </button>
        </div>
    );
}

/**
 * A panel component that receives props via render function
 */
function PanelWithRenderProps({
    api,
    containerApi,
    params,
}: DockviewPanelRenderProps<{ count: number }>) {
    return (
        <div
            style={{
                height: '100%',
                padding: '20px',
                background: 'var(--dv-group-view-background-color)',
            }}
        >
            <h3>Render Props Panel</h3>
            <p>Count: {params.count}</p>
            <p>Total panels: {containerApi.panels.length}</p>
            <button onClick={() => api.close()}>Close Panel</button>
        </div>
    );
}

/**
 * Header actions component
 */
function HeaderActions({ containerApi, isGroupActive }: DockviewHeaderActionsProps) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
            <span style={{ fontSize: '12px', color: isGroupActive ? 'lime' : 'gray' }}>
                {isGroupActive ? 'Active' : 'Inactive'}
            </span>
        </div>
    );
}

// =============================================================================
// Main App Component
// =============================================================================

export function DeclarativeApiExample(props: { theme?: string }) {
    const dockviewRef = useRef<DockviewHandle>(null);
    const [api, setApi] = useState<DockviewApi>();
    const [panelCount, setPanelCount] = useState(0);
    const [showFloating, setShowFloating] = useState(true);
    const [showConditional, setShowConditional] = useState(false);

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);
        console.log('Dockview ready!', event.api);
    };

    const addDynamicPanel = () => {
        // Using imperative API as an escape hatch
        const newCount = panelCount + 1;
        setPanelCount(newCount);
    };

    const saveLayout = () => {
        if (dockviewRef.current) {
            const layout = dockviewRef.current.toJSON();
            localStorage.setItem('declarative-layout', JSON.stringify(layout));
            console.log('Layout saved', layout);
        }
    };

    const loadLayout = () => {
        const saved = localStorage.getItem('declarative-layout');
        if (saved && dockviewRef.current) {
            dockviewRef.current.fromJSON(JSON.parse(saved));
            console.log('Layout loaded');
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            <div style={{ padding: '8px', display: 'flex', gap: '8px' }}>
                <button onClick={addDynamicPanel}>Add Panel</button>
                <button onClick={() => setShowFloating(!showFloating)}>
                    {showFloating ? 'Hide' : 'Show'} Floating
                </button>
                <button onClick={() => setShowConditional(!showConditional)}>
                    {showConditional ? 'Hide' : 'Show'} Conditional
                </button>
                <button onClick={saveLayout}>Save Layout</button>
                <button onClick={loadLayout}>Load Layout</button>
            </div>

            <div style={{ flexGrow: 1 }}>
                <Dockview
                    ref={dockviewRef}
                    onReady={onReady}
                    className={props.theme || 'dockview-theme-abyss'}
                    rightHeaderActionsComponent={HeaderActions}
                >
                    {/* Basic panel with children */}
                    <DockviewPanel id="panel1" title="Panel 1">
                        <SimplePanelWithHooks />
                    </DockviewPanel>

                    {/* Panel with custom params */}
                    <DockviewPanel
                        id="panel2"
                        title="Panel 2"
                        params={{ message: 'Hello from params!' }}
                        position={{ referencePanel: 'panel1', direction: 'right' }}
                    >
                        <SimplePanelWithHooks />
                    </DockviewPanel>

                    {/* Panel using render function */}
                    <DockviewPanel
                        id="panel3"
                        title="Render Props"
                        params={{ count: 42 }}
                        position={{ referencePanel: 'panel1', direction: 'below' }}
                    >
                        {(props) => <PanelWithRenderProps {...props} />}
                    </DockviewPanel>

                    {/* Conditionally rendered panel */}
                    {showConditional && (
                        <DockviewPanel
                            id="conditional"
                            title="Conditional Panel"
                            position={{ referencePanel: 'panel2' }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    padding: '20px',
                                    background: 'var(--dv-group-view-background-color)',
                                }}
                            >
                                <h3>Conditional Panel</h3>
                                <p>This panel appears/disappears based on state</p>
                            </div>
                        </DockviewPanel>
                    )}

                    {/* Floating panel */}
                    {showFloating && (
                        <DockviewPanel
                            id="floating1"
                            title="Floating Panel"
                            floating={{ x: 100, y: 100, width: 300, height: 200 }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    padding: '20px',
                                    background: 'var(--dv-group-view-background-color)',
                                }}
                            >
                                <h3>Floating Panel</h3>
                                <p>This is a floating panel!</p>
                            </div>
                        </DockviewPanel>
                    )}

                    {/* Dynamically generated panels */}
                    {Array.from({ length: panelCount }, (_, i) => (
                        <DockviewPanel
                            key={`dynamic-${i}`}
                            id={`dynamic-${i}`}
                            title={`Dynamic ${i + 1}`}
                            params={{ message: `Dynamic panel #${i + 1}` }}
                        >
                            <SimplePanelWithHooks />
                        </DockviewPanel>
                    ))}
                </Dockview>
            </div>
        </div>
    );
}

export default DeclarativeApiExample;
