import React, {
    createContext,
    useContext,
    useRef,
    useMemo,
    useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { DockviewIDisposable, DockviewDisposable } from 'dockview-core';

/**
 * Represents a single portal entry that maps React content to a DOM container.
 */
export interface PortalEntry {
    /** Unique identifier for this portal */
    id: string;
    /** The DOM element where React content will be rendered */
    container: HTMLElement;
    /** The React content to render */
    content: React.ReactNode;
    /** Unique key for React reconciliation */
    key: string;
}

/**
 * PortalStore manages portal state externally from React's render cycle.
 * It implements the useSyncExternalStore contract for React 18+ concurrent features.
 */
export class PortalStore {
    private portals: Map<string, PortalEntry> = new Map();
    private listeners = new Set<() => void>();
    private keyCounter = 0;

    /**
     * Subscribes a listener to be notified when portal state changes.
     * This follows the useSyncExternalStore subscribe signature.
     * @param listener - Callback to invoke when state changes
     * @returns Unsubscribe function
     */
    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    /**
     * Returns the current snapshot of portal state.
     * This follows the useSyncExternalStore getSnapshot signature.
     * @returns Immutable snapshot of current portals
     */
    getSnapshot = (): Map<string, PortalEntry> => {
        return this.portals;
    };

    /**
     * Returns the server snapshot for SSR.
     * Returns an empty map since portals are client-side only.
     * @returns Empty map for server rendering
     */
    getServerSnapshot = (): Map<string, PortalEntry> => {
        return new Map();
    };

    /**
     * Generates a unique key for portal React reconciliation.
     * @returns Unique portal key string
     */
    private generateKey(): string {
        return `dockview_portal_${(++this.keyCounter).toString()}`;
    }

    /**
     * Adds a new portal to the store.
     * @param id - Unique identifier for the portal
     * @param container - DOM element to render content into
     * @param content - React content to render
     * @returns Disposable that removes the portal when disposed
     */
    addPortal(
        id: string,
        container: HTMLElement,
        content: React.ReactNode
    ): DockviewIDisposable {
        const entry: PortalEntry = {
            id,
            container,
            content,
            key: this.generateKey(),
        };

        // Create new map to ensure immutable updates for React
        this.portals = new Map(this.portals);
        this.portals.set(id, entry);
        this.notify();

        let disposed = false;

        return DockviewDisposable.from(() => {
            if (disposed) {
                return;
            }
            disposed = true;
            this.removePortal(id);
        });
    }

    /**
     * Updates the content of an existing portal.
     * @param id - Identifier of the portal to update
     * @param content - New React content to render
     */
    updatePortal(id: string, content: React.ReactNode): void {
        const existing = this.portals.get(id);
        if (!existing) {
            return;
        }

        // Create new map with updated entry to ensure immutable updates
        this.portals = new Map(this.portals);
        this.portals.set(id, {
            ...existing,
            content,
        });
        this.notify();
    }

    /**
     * Removes a portal from the store.
     * @param id - Identifier of the portal to remove
     */
    removePortal(id: string): void {
        if (!this.portals.has(id)) {
            return;
        }

        // Create new map to ensure immutable updates
        this.portals = new Map(this.portals);
        this.portals.delete(id);
        this.notify();
    }

    /**
     * Notifies all subscribers that portal state has changed.
     */
    private notify(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }

    /**
     * Clears all portals from the store.
     */
    clear(): void {
        if (this.portals.size === 0) {
            return;
        }

        this.portals = new Map();
        this.notify();
    }

    /**
     * Returns the number of active portals.
     */
    get size(): number {
        return this.portals.size;
    }
}

/**
 * Context for providing the PortalStore to child components.
 */
const PortalStoreContext = createContext<PortalStore | null>(null);

/**
 * Hook to access the PortalStore from within the PortalManager tree.
 * @throws Error if used outside of PortalManager
 * @returns The PortalStore instance
 */
export function usePortalStore(): PortalStore {
    const store = useContext(PortalStoreContext);
    if (!store) {
        throw new Error('usePortalStore must be used within PortalManager');
    }
    return store;
}

/**
 * Internal component that renders all portals from the store.
 * Uses useSyncExternalStore for React 18+ concurrent mode compatibility.
 */
function PortalRenderer({ store }: { store: PortalStore }): JSX.Element {
    const portals = useSyncExternalStore(
        store.subscribe,
        store.getSnapshot,
        store.getServerSnapshot
    );

    const portalElements = useMemo(() => {
        const elements: React.ReactPortal[] = [];

        for (const entry of portals.values()) {
            elements.push(
                createPortal(entry.content, entry.container, entry.key)
            );
        }

        return elements;
    }, [portals]);

    return <>{portalElements}</>;
}

/**
 * Props for the PortalManager component.
 */
export interface PortalManagerProps {
    /** Child components that will have access to the portal store */
    children: React.ReactNode;
}

/**
 * PortalManager provides a context for managing React portals that render
 * into dockview-core's DOM containers. It handles the lifecycle of portals
 * and ensures proper cleanup when panels are disposed.
 *
 * Usage:
 * ```tsx
 * <PortalManager>
 *   <DockviewComponent ... />
 * </PortalManager>
 * ```
 *
 * Within child components, use `usePortalStore()` to access the store
 * and create portals that render into dockview-managed DOM elements.
 */
export function PortalManager({ children }: PortalManagerProps): JSX.Element {
    // Create store once and keep it stable across renders
    const storeRef = useRef<PortalStore | null>(null);

    if (storeRef.current === null) {
        storeRef.current = new PortalStore();
    }

    const store = storeRef.current;

    return (
        <PortalStoreContext.Provider value={store}>
            {children}
            <PortalRenderer store={store} />
        </PortalStoreContext.Provider>
    );
}
