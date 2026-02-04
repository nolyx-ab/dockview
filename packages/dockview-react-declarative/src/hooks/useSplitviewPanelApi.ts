import React from 'react';
import { SplitviewPanelApi } from 'dockview-core';
import { SplitviewPanelContext } from '../context';

/**
 * Hook to access the SplitviewPanelApi from within a splitview panel.
 *
 * This hook must be used within a component that is rendered as the content
 * of a `<SplitviewPanel>` component. It provides access to the panel's API
 * for controlling the individual panel.
 *
 * @returns The SplitviewPanelApi instance
 * @throws Error if used outside of a SplitviewPanel component
 *
 * @example
 * ```tsx
 * function MyPanelContent() {
 *   const panelApi = useSplitviewPanelApi();
 *
 *   const resize = () => {
 *     panelApi.setSize({ size: 200 });
 *   };
 *
 *   return <button onClick={resize}>Resize to 200px</button>;
 * }
 *
 * function App() {
 *   return (
 *     <Splitview>
 *       <SplitviewPanel id="panel1">
 *         <MyPanelContent />
 *       </SplitviewPanel>
 *     </Splitview>
 *   );
 * }
 * ```
 */
export function useSplitviewPanelApi(): SplitviewPanelApi {
    const context = React.useContext(SplitviewPanelContext);

    if (!context) {
        throw new Error(
            'useSplitviewPanelApi must be used within a <SplitviewPanel> component. ' +
                'Make sure your component is rendered as a child of SplitviewPanel.'
        );
    }

    return context.api;
}
