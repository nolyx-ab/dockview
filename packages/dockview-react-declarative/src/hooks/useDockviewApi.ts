import { useContext } from 'react';
import { DockviewApi } from 'dockview-core';
import { DockviewContext } from '../context';

/**
 * Hook to access the container-level DockviewApi
 *
 * @returns The DockviewApi instance for the container
 * @throws Error if used outside of a <Dockview> component
 * @throws Error if the API is not yet initialized
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const api = useDockviewApi();
 *
 *   const handleClick = () => {
 *     api.addPanel({ id: 'new-panel', component: 'default' });
 *   };
 *
 *   return <button onClick={handleClick}>Add Panel</button>;
 * }
 * ```
 */
export function useDockviewApi(): DockviewApi {
    const context = useContext(DockviewContext);

    if (!context) {
        throw new Error(
            'useDockviewApi must be used within a <Dockview> component'
        );
    }

    if (!context.api) {
        throw new Error('Dockview API is not yet initialized');
    }

    return context.api;
}
