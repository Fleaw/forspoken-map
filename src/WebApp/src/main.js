import './styles/main.scss';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-mouse-position';
import 'leaflet-mouse-position/src/L.Control.MousePosition.css';

import './plugins/popupMod.css';
import './plugins/popupMod.js';

import {initBookmarkPopupPersistence, initBookmarks} from './bookmarkManager.js';
import {createMap} from "./map.js";
import {valueToCell} from "./utils.js";
import {initIconMap} from "./icons.js";
import {loadPmtilesLayers} from "./tiles.js";
import {addMask} from "./mask.js";
import {initOverlayTree} from "./overlays.js";
import {initSidebar} from "./sidebar.js";
import {loadGeoJsonMarkers} from "./geojsonLayers.js";
import {loadAreaLayers} from "./areas.js";
import {initGeoman} from "./geoman.js";
import {initSearchControl} from "./search.js";
import {initBookmarkUI} from "./bookmarkUI.js";
import {loadGraticule} from "./graticule.js";
import {initButtons} from "./buttons.js";
import {createOverlayLayer, getOverlayLayer, overlayNames} from "./layerFactory.js";
import {loadSharedData} from "./share.js";
import {initNotifications} from "./notification.js";
import defaultMarkerIconUrl from "leaflet/dist/images/marker-icon.png";
import defaultMarkerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import defaultMarkerShadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet default marker icons
L.Icon.Default.imagePath = "";
L.Icon.Default.mergeOptions({
    iconUrl: defaultMarkerIconUrl,
    iconRetinaUrl: defaultMarkerIconRetinaUrl,
    shadowUrl: defaultMarkerShadowUrl,
});

/**
 * Configure core Leaflet controls that are independent of features.
 * @param {L.Map} map
 */
function initCoreControls(map) {
    L.control.mousePosition({
        lngFirst: true,
        wrapLng: false,
        lngFormatter: (lng) => lng.toFixed(3) + ' (' + valueToCell(lng) + ')',
        latFormatter: (lat) => lat.toFixed(3) + ' (' + valueToCell(lat) + ')'
    }).addTo(map);

    L.control.scale({imperial: false}).addTo(map);
}

/**
 * Initialize base map visuals: icons, tiles, mask, graticule and buttons.
 * @param {L.Map} map
 */
async function initBaseMap(map) {
    await loadPmtilesLayers(map);
    addMask(map);
    await loadGraticule();
    initButtons(map);
}

/**
 * Initialize overlay tree and overlay-backed data layers.
 * @param {L.Map} map
 * @returns {Promise<L.Control.Layers>}
 */
async function initOverlays(map) {
    await initIconMap();
    const layerControl = await initOverlayTree(map);
    await loadGeoJsonMarkers();
    await loadAreaLayers(map);

    // Ensure edit layer exists and is visible so editing/bookmarks work.
    getOverlayLayer(overlayNames.editLayer).addTo(map);

    return layerControl;
}

/**
 * Initialize UI features that sit on top of the map (sidebar, bookmarks, search, notifications).
 * @param {L.Map} map
 * @param {L.Control.Layers} layerControl
 */
function initUI(map, layerControl) {
    initSidebar(map, layerControl);
    initBookmarkUI(map);
    initNotifications(map);
}

function createNamedLayers(){
    createOverlayLayer(overlayNames.subAreaLayer, { searchable: true });
    createOverlayLayer(overlayNames.mainAreaLayer);
    createOverlayLayer(overlayNames.editLayer, { searchable: true });
    createOverlayLayer(overlayNames.gridLayer);
}

const map = createMap();

createNamedLayers();
initBookmarks(map);

initCoreControls(map);

(async () => {
    const layerControl = await initOverlays(map);
    await initBaseMap(map);
    initUI(map, layerControl);

    initGeoman(map);
    initBookmarkPopupPersistence(map);
    
    initSearchControl(map);

    await loadSharedData(map);
})();
