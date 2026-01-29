import { useContext } from 'react';
import { PanelContext } from '../context';

/**
 * Hook to access typed panel parameters
 *
 * @typeParam P - The type of the panel parameters
 * @returns The parameters passed to the current panel
 * @throws Error if used outside of a <DockviewPanel> component
 *
 * @example
 * ```tsx
 * interface MyPanelParams {
 *   documentId: string;
 *   readOnly: boolean;
 * }
 *
 * function MyPanelContent() {
 *   const params = usePanelParams<MyPanelParams>();
 *
 *   return (
 *     <div>
 *       <p>Document ID: {params.documentId}</p>
 *       <p>Read Only: {params.readOnly ? 'Yes' : 'No'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePanelParams<
    P extends Record<string, unknown> = Record<string, unknown>
>(): P {
    const context = useContext(PanelContext);

    if (!context) {
        throw new Error(
            'usePanelParams must be used within a <DockviewPanel> component'
        );
    }

    return context.params as P;
}
