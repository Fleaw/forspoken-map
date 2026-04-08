import {decodeData, encodeData, loadGeoJsonFeature} from "./utils.js";
import {getOverlayLayer, overlayNames} from "./layerFactory.js";
import {displayMessage, shareSelection} from "./forms.js";
import {addMouseListenerToLayers} from "./geoman.js";
import {addBookmarkMenu} from "./contextmenu.js";

export async function getShareUrl(map){
    const result = await shareSelection(map);
    
    return result ? await encodeData(result) : null;
}

export async function loadSharedData(map){
    const hashParams = new URLSearchParams(location.hash.slice(1));
    const data = hashParams.get("d");

    if (data) {
        const { ok, _ } = await displayMessage("Shared link", "Load layers from link ?");
        if (!ok){
            location.hash = "";
            return;
        }

        const sharedLayers = await decodeData(data);
        const layers = loadGeoJsonFeature(sharedLayers);

        const editLayer = getOverlayLayer(overlayNames.editLayer);
        
        layers.eachLayer(l => {
            l.bindPopup(l.feature?.properties?.text ?? "", {removable: false, editable: true});
            editLayer.addLayer(l);
            addBookmarkMenu(l, map);
        });
        
        addMouseListenerToLayers(layers);
    }
}