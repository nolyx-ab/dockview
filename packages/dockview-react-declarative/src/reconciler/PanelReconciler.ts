import { DockviewApi, AddPanelOptions } from 'dockview-core';
import { PanelDefinition } from '../types';
import { resolvePanelDependencies } from './dependencies';

interface PanelDiff {
  added: PanelDefinition[];
  removed: string[];
  updated: { id: string; changes: Partial<PanelDefinition> }[];
}

export class PanelReconciler {
  private previousDefinitions: Map<string, PanelDefinition> = new Map();

  constructor(private readonly api: DockviewApi) {}

  reconcile(newDefinitions: PanelDefinition[]): void {
    const diff = this.computeDiff(newDefinitions);
    this.applyDiff(diff);
    this.updatePreviousDefinitions(newDefinitions);
  }

  private computeDiff(newDefinitions: PanelDefinition[]): PanelDiff {
    const currentIds = new Set(this.previousDefinitions.keys());
    const newIds = new Set(newDefinitions.map(d => d.id));

    const added: PanelDefinition[] = [];
    const removed: string[] = [];
    const updated: { id: string; changes: Partial<PanelDefinition> }[] = [];

    // Find removed
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        removed.push(id);
      }
    }

    // Find added and updated
    for (const def of newDefinitions) {
      if (!currentIds.has(def.id)) {
        added.push(def);
      } else {
        const prev = this.previousDefinitions.get(def.id)!;
        const changes = this.computeChanges(prev, def);
        if (Object.keys(changes).length > 0) {
          updated.push({ id: def.id, changes });
        }
      }
    }

    return { added, removed, updated };
  }

  private computeChanges(prev: PanelDefinition, next: PanelDefinition): Partial<PanelDefinition> {
    const changes: Partial<PanelDefinition> = {};

    if (prev.title !== next.title) {
      changes.title = next.title;
    }

    if (!shallowEqual(prev.params, next.params)) {
      changes.params = next.params;
    }

    // Content changes are handled via portal updates, not here

    return changes;
  }

  private applyDiff(diff: PanelDiff): void {
    // 1. Remove panels first
    for (const id of diff.removed) {
      const panel = this.api.getPanel(id);
      if (panel) {
        this.api.removePanel(panel);
      }
    }

    // 2. Sort added panels by dependency
    const existingIds = new Set(this.api.panels.map(p => p.id));
    const sortedAdded = resolvePanelDependencies(diff.added, existingIds);

    // 3. Add new panels
    for (const def of sortedAdded) {
      this.addPanel(def);
    }

    // 4. Update existing panels
    for (const { id, changes } of diff.updated) {
      this.updatePanel(id, changes);
    }
  }

  private addPanel(def: PanelDefinition): void {
    const options: AddPanelOptions = {
      id: def.id,
      component: '__declarative__',
      title: def.title,
      params: def.params,
      position: def.position as any,
      floating: def.floating as any,
      renderer: def.renderer,
      inactive: def.inactive,
      initialWidth: def.initialWidth,
      initialHeight: def.initialHeight,
      minimumWidth: def.minimumWidth,
      minimumHeight: def.minimumHeight,
      maximumWidth: def.maximumWidth,
      maximumHeight: def.maximumHeight,
    };

    this.api.addPanel(options);
  }

  private updatePanel(id: string, changes: Partial<PanelDefinition>): void {
    const panel = this.api.getPanel(id);
    if (!panel) return;

    if ('title' in changes && changes.title !== undefined) {
      panel.api.setTitle(changes.title);
    }

    if ('params' in changes && changes.params !== undefined) {
      panel.api.updateParameters(changes.params);
    }
  }

  private updatePreviousDefinitions(definitions: PanelDefinition[]): void {
    this.previousDefinitions.clear();
    for (const def of definitions) {
      this.previousDefinitions.set(def.id, def);
    }
  }
}

function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
