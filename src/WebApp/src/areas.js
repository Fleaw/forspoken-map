import "leaflet-layergroup-conditional/leaflet.layergroup.conditional.js";
import "leaflet-easybutton";

import {getOverlayLayer, overlayNames} from "./layerFactory.js";
import {hasActiveGlobalMode} from "./geoman.js";

// Create a conditional layer group that manages layers based on zoom level
const conditional = L.layerGroup.conditional(null, {enabled: true});

export function enableConditional(enabled = true) {
    conditional.options.enabled = enabled;
    conditional.updateConditionalLayers(conditional._map.getZoom());
}

export function isConditionalEnabled() {
    return conditional.options.enabled;
}

export async function loadAreaLayers(map) {
    const data = await fetch('./data/areas.json').then(r => r.json());

    const mainAreaLayer = getOverlayLayer(overlayNames.mainAreaLayer);
    const subAreaLayer = getOverlayLayer(overlayNames.subAreaLayer);
    
    L.geoJSON(data, {
        pmIgnore: true,
        style: {
            weight: 2,
            opacity: 0,
            color: '#d268ff',
            fillOpacity: 0,
            fillColor: '#ffffff',
            className: 'area-polygon'
        },
        onEachFeature: function (feature, layer) {
            const isSubArea = feature.properties.mainAreaName !== undefined;
            
            if(isSubArea){
                subAreaLayer.addLayer(layer);
            }
            else {
                mainAreaLayer.addLayer(layer);
            }
            
            layer.options.pane = "tooltipPane";
            
            let fadeTimeout = null;

            layer.bindTooltip(
                feature.properties.areaName,
                {
                    direction: "center",
                    className: isSubArea ? "sub-area-label" : "main-area-label",
                    pane: "popupPane"
                }
            );

            layer.on("mouseover", function () {
                if (fadeTimeout) clearTimeout(fadeTimeout);

                layer.setStyle({
                    opacity: 1,
                    fillOpacity: 0.15
                });
                layer.openTooltip();

                fadeTimeout = setTimeout(() => {
                    layer.setStyle({ opacity: 0, fillOpacity: 0.0 });
                    layer.closeTooltip();
                }, 3000);
            });

            layer.on("mouseout", function () {
                layer.setStyle({
                    opacity: 0,
                    fillOpacity: 0
                });
                layer.closeTooltip();
            });
        }
    });

    function mainAreaDisplayCondition(zoom){
        return zoom <= 2.5 && conditional.options.enabled && !hasActiveGlobalMode(map);
    }
    
    function subAreaDisplayCondition(zoom){
        return zoom > 2.5 && zoom <= 3.5 && conditional.options.enabled && !hasActiveGlobalMode(map);
    }

    conditional.addConditionalLayer(mainAreaDisplayCondition, mainAreaLayer);
    conditional.addConditionalLayer(subAreaDisplayCondition, subAreaLayer);

    conditional.addTo(map);

    // Needed by search.js to get the area layers center
    getOverlayLayer(overlayNames.subAreaLayer).addTo(map);

    // Update conditional layers when Geoman global modes toggle, disabling layers during editing
    map.on('pm:globaldrawmodetoggled pm:globaleditmodetoggled pm:globaldragmodetoggled pm:globalremovalmodetoggled pm:globalrotatemodetoggled',
        (e) => {
            conditional.updateConditionalLayers(map.getZoom());
        });

    map.on('zoomend', () => {
        conditional.updateConditionalLayers(map.getZoom());
    });
}