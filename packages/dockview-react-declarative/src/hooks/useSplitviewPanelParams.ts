import React from 'react';
import { SplitviewPanelContext } from '../context';

/**
 * Hook to access the custom parameters passed to a splitview panel.
 *
 * This hook must be used within a component that is rendered as the content
 * of a `<SplitviewPanel>` component. It provides access to the `params` prop
 * passed to the panel.
 *
 * @returns The params object passed to the panel
 * @throws Error if used outside of a SplitviewPanel component
 *
 * @example
 * ```tsx
 * interface MyParams {
 *   title: string;
 *   data: number[];
 * }
 *
 * function MyPanelContent() {
 *   const params = useSplitviewPanelParams<MyParams>();
 *
 *   return (
 *     <div>
 *       <h1>{params.title}</h1>
 *       <ul>
 *         {params.data.map((item, i) => (
 *           <li key={i}>{item}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 *
 * function App() {
 *   return (
 *     <Splitview>
 *       <SplitviewPanel
 *         id="panel1"
 *         params={{ title: 'My Data', data: [1, 2, 3] }}
 *       >
 *         <MyPanelContent />
 *       </SplitviewPanel>
 *     </Splitview>
 *   );
 * }
 * ```
 */
export function useSplitviewPanelParams<
    P extends Record<string, unknown> = Record<string, unknown>
>(): P {
    const context = React.useContext(SplitviewPanelContext);

    if (!context) {
        throw new Error(
            'useSplitviewPanelParams must be used within a <SplitviewPanel> component. ' +
                'Make sure your component is rendered as a child of SplitviewPanel.'
        );
    }

    return context.params as P;
}
