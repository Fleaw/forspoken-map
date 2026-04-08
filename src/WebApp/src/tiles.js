import * as pmtiles from "pmtiles";

import {getOrCreateBaseLayer} from "./layerFactory.js";
import {mapBounds, mapMaxZoom, mapMinZoom} from "./map.js";

export async function loadPmtilesLayers(map) {
    const baseLayers = await fetch("./data/pmtiles.json").then(r => r.json());

    baseLayers.layers.forEach(layer => {
        const group = getOrCreateBaseLayer(layer.name);

        layer.files.forEach(entry => {
            const p = new pmtiles.PMTiles(entry.file);
            const tileLayer = pmtiles.leafletRasterLayer(p, {
                minZoom: mapMinZoom,
                maxNativeZoom: mapMaxZoom,
                maxZoom: 10,
                noWrap: true,
                bounds: mapBounds,
                continuousWorld: false,
            });
            group.addLayer(tileLayer);
        });

        if (layer.selected) group.addTo(map);
    });
}