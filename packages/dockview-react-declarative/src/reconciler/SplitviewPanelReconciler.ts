import { SplitviewApi, AddSplitviewComponentOptions } from 'dockview-core';
import { SplitviewPanelDefinition } from '../types';

interface SplitviewPanelDiff {
    added: SplitviewPanelDefinition[];
    removed: string[];
    updated: { id: string; changes: Partial<SplitviewPanelDefinition> }[];
}

export class SplitviewPanelReconciler {
    private previousDefinitions: Map<string, SplitviewPanelDefinition> = new Map();

    constructor(private readonly api: SplitviewApi) {}

    reconcile(newDefinitions: SplitviewPanelDefinition[]): void {
        const diff = this.computeDiff(newDefinitions);
        this.applyDiff(diff);
        this.updatePreviousDefinitions(newDefinitions);
    }

    private computeDiff(newDefinitions: SplitviewPanelDefinition[]): SplitviewPanelDiff {
        const currentIds = new Set(this.previousDefinitions.keys());
        const newIds = new Set(newDefinitions.map((d) => d.id));

        const added: SplitviewPanelDefinition[] = [];
        const removed: string[] = [];
        const updated: { id: string; changes: Partial<SplitviewPanelDefinition> }[] = [];

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

    private computeChanges(
        prev: SplitviewPanelDefinition,
        next: SplitviewPanelDefinition
    ): Partial<SplitviewPanelDefinition> {
        const changes: Partial<SplitviewPanelDefinition> = {};

        if (!shallowEqual(prev.params, next.params)) {
            changes.params = next.params;
        }

        // Content changes are handled via portal updates, not here

        return changes;
    }

    private applyDiff(diff: SplitviewPanelDiff): void {
        // 1. Remove panels first
        for (const id of diff.removed) {
            const panel = this.api.getPanel(id);
            if (panel) {
                this.api.removePanel(panel);
            }
        }

        // 2. Add new panels (in order based on index)
        // Sort by index if provided, otherwise maintain order
        const sortedAdded = [...diff.added].sort((a, b) => {
            if (a.index !== undefined && b.index !== undefined) {
                return a.index - b.index;
            }
            if (a.index !== undefined) return -1;
            if (b.index !== undefined) return 1;
            return 0;
        });

        for (const def of sortedAdded) {
            this.addPanel(def);
        }

        // 3. Update existing panels
        for (const { id, changes } of diff.updated) {
            this.updatePanel(id, changes);
        }
    }

    private addPanel(def: SplitviewPanelDefinition): void {
        const options: AddSplitviewComponentOptions = {
            id: def.id,
            component: '__declarative__',
            params: def.params,
            index: def.index,
            size: def.size,
            minimumSize: def.minimumSize,
            maximumSize: def.maximumSize,
            snap: def.snap,
            priority: def.priority,
        };

        this.api.addPanel(options);
    }

    private updatePanel(id: string, changes: Partial<SplitviewPanelDefinition>): void {
        const panel = this.api.getPanel(id);
        if (!panel) return;

        if ('params' in changes && changes.params !== undefined) {
            panel.api.updateParameters(changes.params);
        }
    }

    private updatePreviousDefinitions(definitions: SplitviewPanelDefinition[]): void {
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
