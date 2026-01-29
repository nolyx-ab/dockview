import React from 'react';
import { createRoot } from 'react-dom/client';
import 'dockview-core/dist/styles/dockview.css';
import { DeclarativeApiExample } from './app';

const rootElement = document.getElementById('root');

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <DeclarativeApiExample theme="dockview-theme-abyss" />
        </React.StrictMode>
    );
}
