import {getOverlayLayer, overlayNames} from "./layerFactory.js";
import {getShareUrl} from "./share.js";
import {notification} from "./notification.js";
import {enableConditional, isConditionalEnabled} from "./areas.js";

function toggleLayer(layer, map){
    if(map.hasLayer(layer)) {
        layer.remove();
    }
    else {
        layer.addTo(map);
    }
}

export function initButtons(map){
    const graticuleLayer = getOverlayLayer(overlayNames.gridLayer);
    const editLayer = getOverlayLayer(overlayNames.editLayer);
    
    // Areas button
    const toggleAreasLayerBtn = L.easyButton({
            states: [{
                stateName: 'area-enabled',
                icon:      '<span class="mi mi-bid_landscape" style="font-size: 25px"></span>',
                title:     'Disable areas',
                onClick: function(btn, map) {
                    enableConditional(false);
                    btn.state('area-disabled');
                }
            }, {
                stateName: 'area-disabled',
                icon:      '<span class="mi mi-bid_landscape_disabled" style="font-size: 25px"></span>',
                title:     'Enable areas',
                onClick: function(btn, map) {
                    enableConditional();
                    btn.state('area-enabled');
                }
            }]
        }
    );
    toggleAreasLayerBtn.state(isConditionalEnabled() ? 'area-enabled' : 'area-disabled');

    // Grid button
    const toggleGridLayerBtn = L.easyButton({
            states: [{
                stateName: 'grid-enabled',
                icon:      '<span class="mi mi-grid_on" style="font-size: 25px"></span>',
                title:     'Disable grid',
                onClick: function(btn, map) {
                    toggleLayer(graticuleLayer, map);
                    btn.state('grid-disabled');
                }
            }, {
                stateName: 'grid-disabled',
                icon:      '<span class="mi mi-grid_off" style="font-size: 25px"></span>',
                title:     'Enable grid',
                onClick: function(btn, map) {
                    toggleLayer(graticuleLayer, map);
                    btn.state('grid-enabled');
                }
            }]
        }
    );
    toggleGridLayerBtn.state(map.hasLayer(graticuleLayer) ? 'grid-enabled' : 'grid-disabled');
    
    const shareLayersBtn = L.easyButton({
        states: [{
            icon: '<span class="mi mi-share" style="font-size: 24px"></span>',
            title: 'Share layers',
            onClick: async function (btn, map) {
                const data = await getShareUrl(map);
                if(data === null){
                    notification.alert('Nothing to share.', '', {
                        position: 'topright',
                        timeout: 3000,
                        closable: true,
                        dismissable: false,
                        icon: 'mi mi-error',
                    });
                    return;
                }

                const link =`${window.location.origin}/#d=${data}`;

                navigator.clipboard.writeText(link).then(() => {
                    notification.info('Link copied to clipboard.', '', {
                        position: 'topright',
                        timeout: 3000,
                        closable: true,
                        dismissable: false,
                    });
                });
            }
        }]
    });

    // Edit button
    const toggleEditLayerBtn = L.easyButton({
            states: [{
                stateName: 'edit-enabled',
                icon:      '<span class="mi mi-edit_off"></span>',
                title:     'Disable editing',
                onClick: function(btn, map) {
                    toggleLayer(editLayer, map);
                    btn.state('edit-disabled');
                }
            }, {
                stateName: 'edit-disabled',
                icon:      '<span class="mi mi-edit"></span>',
                title:     'Enable editing',
                onClick: function(btn, map) {
                    toggleLayer(editLayer, map);
                    btn.state('edit-enabled');
                }
            }]
        }
    );
    toggleEditLayerBtn.state(map.hasLayer(editLayer) ? 'edit-disabled' : 'edit-enabled');
    
    const group = L.easyBar([
        shareLayersBtn,
        toggleEditLayerBtn,
        toggleAreasLayerBtn,
        toggleGridLayerBtn
    ], { position: 'bottomright' });

    editLayer.on('add remove', _ => {
        const isLayerVisible = map.hasLayer(editLayer);
        toggleEditLayerBtn.state(isLayerVisible ? 'edit-disabled' : 'edit-enabled');
        if(isLayerVisible){
            map.pm.addControls();
        }
        else {
            map.pm.removeControls();
        }
    });

    group.addTo(map);
}