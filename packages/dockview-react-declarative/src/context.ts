import React from 'react';
import { DockviewApi, DockviewPanelApi, SplitviewApi, SplitviewPanelApi } from 'dockview-core';
import { PanelDefinition, SplitviewPanelDefinition } from './types';

// =============================================================================
// Container-Level Context
// =============================================================================

/**
 * Context value for the Dockview container
 * Provides access to the API and panel registration functions
 */
export interface DockviewContextValue {
    /** The DockviewApi instance, or null if not yet initialized */
    api: DockviewApi | null;
    /** Register a new panel definition with the container */
    registerPanel: (definition: PanelDefinition) => void;
    /** Unregister a panel by its ID */
    unregisterPanel: (id: string) => void;
    /** Update an existing panel's definition */
    updatePanel: (id: string, changes: Partial<PanelDefinition>) => void;
}

/**
 * React context for the Dockview container
 * Provides access to the container-level API and panel management functions
 */
export const DockviewContext = React.createContext<DockviewContextValue | null>(null);

// =============================================================================
// Panel-Level Context
// =============================================================================

/**
 * Context value for individual panels
 * Provides access to panel-specific APIs and parameters
 */
export interface PanelContextValue<P = Record<string, unknown>> {
    /** API for the individual panel */
    api: DockviewPanelApi;
    /** API for the dockview container */
    containerApi: DockviewApi;
    /** Custom parameters passed to the panel */
    params: P;
}

/**
 * React context for individual panels
 * Provides access to the panel-level API and parameters
 */
export const PanelContext = React.createContext<PanelContextValue | null>(null);

// =============================================================================
// Splitview Container-Level Context
// =============================================================================

/**
 * Context value for the Splitview container
 * Provides access to the API and panel registration functions
 */
export interface SplitviewContextValue {
    /** The SplitviewApi instance, or null if not yet initialized */
    api: SplitviewApi | null;
    /** Register a new panel definition with the container */
    registerPanel: (definition: SplitviewPanelDefinition) => void;
    /** Unregister a panel by its ID */
    unregisterPanel: (id: string) => void;
    /** Update an existing panel's definition */
    updatePanel: (id: string, changes: Partial<SplitviewPanelDefinition>) => void;
}

/**
 * React context for the Splitview container
 * Provides access to the container-level API and panel management functions
 */
export const SplitviewContext = React.createContext<SplitviewContextValue | null>(null);

// =============================================================================
// Splitview Panel-Level Context
// =============================================================================

/**
 * Context value for individual splitview panels
 * Provides access to panel-specific APIs and parameters
 */
export interface SplitviewPanelContextValue<P = Record<string, unknown>> {
    /** API for the individual panel */
    api: SplitviewPanelApi;
    /** API for the splitview container */
    containerApi: SplitviewApi;
    /** Custom parameters passed to the panel */
    params: P;
}

/**
 * React context for individual splitview panels
 * Provides access to the panel-level API and parameters
 */
export const SplitviewPanelContext = React.createContext<SplitviewPanelContextValue | null>(null);
