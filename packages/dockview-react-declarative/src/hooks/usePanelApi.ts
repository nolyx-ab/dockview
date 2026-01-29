import { useContext } from 'react';
import { DockviewPanelApi } from 'dockview-core';
import { PanelContext } from '../context';

/**
 * Hook to access the panel-level DockviewPanelApi
 *
 * @returns The DockviewPanelApi instance for the current panel
 * @throws Error if used outside of a <DockviewPanel> component
 *
 * @example
 * ```tsx
 * function MyPanelContent() {
 *   const api = usePanelApi();
 *
 *   const handleClose = () => {
 *     api.close();
 *   };
 *
 *   return (
 *     <div>
 *       <h1>{api.title}</h1>
 *       <button onClick={handleClose}>Close Panel</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePanelApi(): DockviewPanelApi {
    const context = useContext(PanelContext);

    if (!context) {
        throw new Error(
            'usePanelApi must be used within a <DockviewPanel> component'
        );
    }

    return context.api;
}
