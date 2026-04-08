import {getOverlayLayer, overlayNames} from "./layerFactory.js";
import {latLngToCellString} from "./utils.js";

export async function loadGraticule() {
    const graticule = await fetch("./data/graticule.json").then(r => r.json());

    const gridLayer = getOverlayLayer(overlayNames.gridLayer);

    const graticuleLayers = new L.GeoJSON(graticule, {
        style: function(feature){ 
            return {
                fillColor: "#ffffff",
                color: "#ffffff",
                weight: 1,
                opacity: 0.85,
                fillOpacity: 0,
                dashArray: "6"
            };
        },
        onEachFeature: function(feature, layer){
            layer.options.interactive = false;
            layer.options.pmIgnore = true;

            const center = layer.getBounds().getCenter();

            const text = latLngToCellString(center);

            L.marker(center, {
                icon: L.divIcon({
                    className: "graticule-label",
                    html: text,
                    iconSize: null
                }),
                interactive: false,
                pmIgnore: true
            }).addTo(gridLayer);
        }
    });

    gridLayer.addLayer(graticuleLayers);
}

