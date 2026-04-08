import L from 'leaflet';

import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css';

import {showCoordinates} from "./forms.js";

export const cellSize = 512;
const minXCell = 36;
const minYCell = 38;
const columnCount = 62;
const rowCount = 60;

export const mapExtent = [minXCell * cellSize, minYCell * cellSize, columnCount * cellSize, rowCount * cellSize];
export const mapMinZoom = 2;
export const mapMaxZoom = 8;
export const mapMaxResolution = 0.250;
export const mapMinResolution = Math.pow(2, mapMaxZoom) * mapMaxResolution;

export const crs = L.CRS.Simple;
crs.transformation = new L.Transformation(1, -mapExtent[0], 1, -mapExtent[1]);

crs.scale = zoom => Math.pow(2, zoom) / mapMinResolution;
crs.zoom = scale => Math.log(scale * mapMinResolution) / Math.LN2;

export const mapBounds = [
    crs.unproject(L.point(mapExtent[0], mapExtent[1])),
    crs.unproject(L.point(mapExtent[2], mapExtent[3]))
];

export function createMap() {
    const map = L.map("map", {
        minZoom: mapMinZoom,
        zoom: mapMinZoom,
        crs: crs,
        center: [0, 0],
        noWrap: true,
        closePopupOnClick: false,
        contextmenu: true,
        contextmenuItems: [
            {
                text: "Get cursor coords",
                callback: async (e) => {
                    await showCoordinates(e.latlng);
                }
            }
        ],
        attributionControl: false,
        zoomSnap: 0,
        zoomDelta: 2,
        pmIgnore: false,
    });

    map.setMaxBounds(mapBounds);

    return map;
}