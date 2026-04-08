import {crs, mapExtent} from "./map.js";

export function addMask(map) {
    const xMin = mapExtent[0];
    const xMax = mapExtent[2];
    const yMin = mapExtent[1];
    const mapWidth = xMax - xMin;

    const maskBounds = [
        crs.unproject(L.point(xMin, yMin)),
        crs.unproject(L.point(xMax, yMin + mapWidth))
    ];

    L.imageOverlay("./ui/mask.png", maskBounds, {
        pmIgnore: true,
        opacity: 1,
        interactive: false,
        pane: 'overlayPane',
        className: 'mask-overlay'
    }).addTo(map);
}