import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css';

import {createDivIcon, createImage, defaultOverlayOptions} from "./icons.js";
import {getOrCreateOverlayLayer} from "./layerFactory.js";
import {showCoordinates} from "./forms.js";

export async function loadGeoJsonMarkers() {
    const markers = await fetch("./data/layers.json").then(r => r.json());
    markers.files.map(async (file) => await loadGeoJsonLayer(file.url))
}

async function loadGeoJsonLayer(url) {
    const data = await fetch(url).then(r => r.json());
    
    L.geoJSON(data, {
        pmIgnore: true,
        pointToLayer: (feature, latlng) => {
            const type = feature.properties.type;
            const rewards = feature.properties.rewards || [];
            const rewardOverlay = rewards.length ? rewards[0].kind : "";
            const icon = createDivIcon(type, rewardOverlay);
            const layer = getOrCreateOverlayLayer(type);
                
            const marker = L.marker(latlng, {
                pmIgnore: true,
                icon: icon,
                contextmenu: true,
                contextmenuInheritItems: false,
                contextmenuItems: [
                    {
                        text: "Get coordinates",
                        callback: async (e) => {
                            await showCoordinates(latlng, feature.properties.name);
                        }
                    },
                    {
                        text: "Hide All",
                        callback: async () => {
                            layer.remove();
                        }
                    }
                ]
            });
            
            let rewardList = '<ul>';
            rewards.forEach(reward => {
                if(!reward.id) return;
                const img = createImage(reward.kind, {
                    ...defaultOverlayOptions,
                    className: "entry-icon"
                });
                rewardList += `<li><a class="reward-item" href="https://forspoken.gamerescape.com/wiki/${reward.id}" target="_blank" rel="noopener noreferrer">${reward.id}</a>${img.outerHTML}</li>`;
            });
            rewardList += '</ul>';
            
            marker.bindPopup(`<div>${feature.properties.name}</div>${rewards.length > 0 ? rewardList : ''}`);
            layer.addLayer(marker);
            return marker;
        }
    });
}