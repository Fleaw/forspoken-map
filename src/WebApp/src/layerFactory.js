import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const baseLayers = {};
const overlayLayers = {};

/**
 * @typedef {Object} OverlayLayerOptions
 * @property {boolean} [pmIgnore]
 * @property {boolean} [searchable]
 * @property {boolean} [isCluster]
 */

/** @type {OverlayLayerOptions} */
const defaultLayerOptions = { pmIgnore: true, searchable: false, isCluster: false };

export const overlayNames = {
    editLayer: 'editlayer',
    mainAreaLayer: 'mainAreaLayer',
    subAreaLayer: 'subAreaLayer',
    gridLayer: 'gridlayer',
};

export function forEachOverlay(func){
    for(let name in overlayLayers){
        func(name, overlayLayers[name]);
    }
}

export function getOrCreateBaseLayer(name) {
    if (!baseLayers[name]) {
        baseLayers[name] = L.layerGroup();
    }
    return baseLayers[name];
}

export function createOverlayLayer(name, options = defaultLayerOptions) {
    const mergedOptions = { ...defaultLayerOptions, ...(options || {}) };

    overlayLayers[name] = mergedOptions.isCluster
        ? L.markerClusterGroup(mergedOptions)
        : L.geoJSON(null, mergedOptions);
    return overlayLayers[name];
}

export function getOverlayLayer(name) {
    return overlayLayers[name];
}

/**
 * @param {string} name
 * @param {OverlayLayerOptions} [options]
 */
export function getOrCreateOverlayLayer(name, options = defaultLayerOptions) {
    if (!overlayLayers[name]) {
        const mergedOptions = { ...defaultLayerOptions, ...(options || {}) };

        overlayLayers[name] = mergedOptions.isCluster
            ? L.markerClusterGroup(mergedOptions)
            : L.geoJSON(null, mergedOptions);
    }
    return overlayLayers[name];
}