import React from 'react';
import {
    PanelDefinition,
    DockviewPanelProps,
    SplitviewPanelDefinition,
    SplitviewPanelProps,
} from '../types';

/**
 * Extract panel definitions from React children.
 * Only processes DockviewPanel components.
 */
export function extractPanelDefinitions(children: React.ReactNode): PanelDefinition[] {
  const definitions: PanelDefinition[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    // Check if it's a DockviewPanel by checking displayName or type
    if (isDockviewPanelElement(child)) {
      const props = child.props as DockviewPanelProps;
      definitions.push({
        id: props.id,
        title: props.title,
        content: props.children,
        params: props.params,
        position: props.position,
        floating: props.floating,
        tabComponent: props.tabComponent,
        renderer: props.renderer,
        minimumWidth: props.minimumWidth,
        minimumHeight: props.minimumHeight,
        maximumWidth: props.maximumWidth,
        maximumHeight: props.maximumHeight,
        initialWidth: props.initialWidth,
        initialHeight: props.initialHeight,
        inactive: props.inactive,
        callbacks: {
          onDidFocus: props.onDidFocus,
          onDidBlur: props.onDidBlur,
          onDidChangeVisibility: props.onDidChangeVisibility,
        },
      });
    } else if (child.props && 'children' in child.props) {
      // Handle React.Fragment and other wrappers
      definitions.push(...extractPanelDefinitions(child.props.children));
    }
  });

  return definitions;
}

function isDockviewPanelElement(element: React.ReactElement): boolean {
  // Check by displayName
  const type = element.type as any;
  return type?.displayName === 'DockviewPanel' || type?.name === 'DockviewPanel';
}

/**
 * Extract splitview panel definitions from React children.
 * Only processes SplitviewPanel components.
 */
export function extractSplitviewPanelDefinitions(
    children: React.ReactNode
): SplitviewPanelDefinition[] {
    const definitions: SplitviewPanelDefinition[] = [];

    React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;

        // Check if it's a SplitviewPanel by checking displayName or type
        if (isSplitviewPanelElement(child)) {
            const props = child.props as SplitviewPanelProps;
            definitions.push({
                id: props.id,
                content: props.children,
                params: props.params,
                index: props.index,
                size: props.size,
                minimumSize: props.minimumSize,
                maximumSize: props.maximumSize,
                snap: props.snap,
                priority: props.priority,
                callbacks: {
                    onDidFocus: props.onDidFocus,
                    onDidBlur: props.onDidBlur,
                    onDidChangeVisibility: props.onDidChangeVisibility,
                },
            });
        } else if (child.props && 'children' in child.props) {
            // Handle React.Fragment and other wrappers
            definitions.push(...extractSplitviewPanelDefinitions(child.props.children));
        }
    });

    return definitions;
}

function isSplitviewPanelElement(element: React.ReactElement): boolean {
    // Check by displayName
    const type = element.type as any;
    return type?.displayName === 'SplitviewPanel' || type?.name === 'SplitviewPanel';
}
