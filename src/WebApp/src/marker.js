import {askForCoordinates} from "./forms.js";
import L from "leaflet";
import {addContextMenuItem} from "./contextmenu.js";

export function createMarker(latLng, options = {}, existingMarker = null) {
    const marker = existingMarker ? existingMarker : L.marker(latLng, options);
    
    addContextMenuItem(marker, {
        text: "Edit coords",
        callback: (e) => editMarkerCoords(marker)
    });
    
    return marker;
}

function editMarkerCoords(marker){
    (async () => {
        const result = await askForCoordinates(marker._latlng);
        if (!result) return;

        marker.setLatLng(result);
        marker._map.bm.updateBookmarkGeoJson(marker.bookmarkId, marker.toGeoJSON());
    })();
}