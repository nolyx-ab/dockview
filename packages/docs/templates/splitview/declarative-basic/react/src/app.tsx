import {
    Splitview,
    SplitviewPanel,
    SplitviewReadyEvent,
    Orientation,
    useSplitviewPanelApi,
} from 'dockview-react-declarative';
import React from 'react';

const PanelContent = () => {
    const api = useSplitviewPanelApi();
    return (
        <div style={{ padding: '10px', color: 'white', background: '#1e1e1e' }}>
            Panel {api.id}
        </div>
    );
};

export default () => {
    const onReady = (event: SplitviewReadyEvent) => {
        console.log('Splitview ready', event.api);
    };

    return (
        <Splitview
            className={'dockview-theme-abyss'}
            orientation={Orientation.HORIZONTAL}
            onReady={onReady}
        >
            <SplitviewPanel id="panel_1" size={200}>
                <PanelContent />
            </SplitviewPanel>
            <SplitviewPanel id="panel_2" size={300}>
                <PanelContent />
            </SplitviewPanel>
            <SplitviewPanel id="panel_3" size={200}>
                <PanelContent />
            </SplitviewPanel>
        </Splitview>
    );
};
