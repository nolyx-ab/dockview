import { PanelDefinition } from '../types';

/**
 * Resolve panel dependencies and return panels in correct add order.
 * Panels that reference other panels must be added after their references.
 */
export function resolvePanelDependencies(
  panels: PanelDefinition[],
  existingPanelIds: Set<string>
): PanelDefinition[] {
  // Build dependency graph
  // Use Kahn's algorithm for topological sort
  // Handle circular dependencies by falling back to default positioning

  const toAdd = new Map(panels.map(p => [p.id, p]));
  const added = new Set<string>(existingPanelIds);
  const result: PanelDefinition[] = [];
  const pending = new Set(toAdd.keys());

  const maxIterations = panels.length * 2;
  let iterations = 0;

  while (pending.size > 0 && iterations < maxIterations) {
    iterations++;

    for (const id of Array.from(pending)) {
      const def = toAdd.get(id)!;
      if (canAddPanel(def, added)) {
        result.push(def);
        added.add(id);
        pending.delete(id);
      }
    }
  }

  // Handle unresolvable dependencies
  if (pending.size > 0) {
    console.warn('Dockview: Some panels have unresolvable dependencies:', Array.from(pending));
    for (const id of pending) {
      const def = { ...toAdd.get(id)!, position: undefined };
      result.push(def);
    }
  }

  return result;
}

function canAddPanel(def: PanelDefinition, existingIds: Set<string>): boolean {
  if (!def.position) return true;

  if ('referencePanel' in def.position) {
    return existingIds.has(def.position.referencePanel);
  }

  // Group references and absolute positions have no panel dependencies
  return true;
}
