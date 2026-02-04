import React from 'react';
import { SplitviewApi } from 'dockview-core';
import { SplitviewContext } from '../context';

/**
 * Hook to access the SplitviewApi from within a Splitview component tree.
 *
 * This hook must be used within a component that is a descendant of a `<Splitview>` component.
 * It provides access to the SplitviewApi for programmatic control of the splitview.
 *
 * @returns The SplitviewApi instance
 * @throws Error if used outside of a Splitview component or if API is not initialized
 *
 * @example
 * ```tsx
 * function MyPanel() {
 *   const api = useSplitviewApi();
 *
 *   const addPanel = () => {
 *     api.addPanel({
 *       id: 'new-panel',
 *       component: '__declarative__',
 *     });
 *   };
 *
 *   return <button onClick={addPanel}>Add Panel</button>;
 * }
 * ```
 */
export function useSplitviewApi(): SplitviewApi {
    const context = React.useContext(SplitviewContext);

    if (!context) {
        throw new Error(
            'useSplitviewApi must be used within a <Splitview> component. ' +
                'Make sure your component is wrapped in a Splitview.'
        );
    }

    if (!context.api) {
        throw new Error(
            'Splitview API is not yet initialized. ' +
                'This usually means the hook is being called during the initial render ' +
                'before the Splitview component has fully mounted.'
        );
    }

    return context.api;
}
