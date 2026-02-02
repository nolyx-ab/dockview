import ReactDOM from 'react-dom/client';
import React from 'react';
import 'dockview/dist/styles/dockview.css';
import { DeclarativeApiExample } from './app.tsx';

const rootElement = document.getElementById('app');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<DeclarativeApiExample theme="dockview-theme-abyss" />);
}
