import {createMarker} from "./marker.js";
import {addMouseListenerToLayer} from "./geoman.js";
import L from "leaflet";
import defaultMarkerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import {TYPE_TO_ICON} from "./icons.js";
import {cellSize} from "./map.js";

L.LatLng.prototype.toString = function(decimal = 6){
    return `${Number(this.lng.toFixed(decimal))}, ${Number(this.lat.toFixed(decimal))}`;
};

const initialCircleToGeoJson = L.Circle.prototype.toGeoJSON;
const initialRectangleToGeoJson = L.Rectangle.prototype.toGeoJSON;

L.Circle.include({
    toGeoJSON: function (precision) {
        const feature = initialCircleToGeoJson.call(this, precision);
        feature.properties.radius = this.getRadius();
        
        return feature;
    }
});

L.Rectangle.include({
    toGeoJSON: function (precision) {
        const feature = initialRectangleToGeoJson.call(this, precision);
        feature.properties.angle = this.pm._angle ?? 0
        
        return feature;
    }
});

export function valueToCell(value){
    return value / cellSize | 0;
}

export function latLngToCellString(latlng){
    return `${valueToCell(latlng.lng)}, ${valueToCell(latlng.lat)}`;
}

// -----------------------------
// Base64URL helpers
// -----------------------------
function toBase64Url(uint8) {
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function fromBase64Url(base64url) {
    // Convert Base64URL → Base64
    let base64 = base64url
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    // Pad to multiple of 4
    while (base64.length % 4 !== 0) {
        base64 += "=";
    }

    // Base64 → binary string
    const binary = atob(base64);

    // Binary string → Uint8Array
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function compress(uint8) {
    const cs = new CompressionStream("gzip");
    const writer = cs.writable.getWriter();
    writer.write(uint8);
    writer.close();
    return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}

async function decompress(uint8) {
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    writer.write(uint8);
    writer.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

// -----------------------------
// Encode (JSON → compressed → Base64URL)
// -----------------------------
export async function encodeData(data) {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);

    const compressed = await compress(bytes);
    return toBase64Url(compressed);
}

// -----------------------------
// Decode (Base64URL → compressed → JSON)
// -----------------------------
export async function decodeData(base64url) {
    const compressedBytes = fromBase64Url(base64url);

    const decompressedBytes = await decompress(compressedBytes);
    const json = new TextDecoder().decode(decompressedBytes);

    return JSON.parse(json);
}

export const customIcon = L.icon({
    iconUrl: './ui/marker.png',
    iconRetinaUrl: './ui/marker.png',
    shadowUrl: defaultMarkerShadowUrl,

    iconSize:    [25, 41],
    iconAnchor:  [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [0, -10],
    shadowSize:  [41, 41]
});

/**
 * Create Leaflet layers from GeoJSON used by bookmarks/share.
 * Note: Leaflet ignores return values from `onEachFeature`, so special-case layer replacement
 * is handled via a post-processing pass.
 *
 * @param {*} geoJson
 * @returns {L.GeoJSON}
 */
export function loadGeoJsonFeature(geoJson) {
    const geoJsonLayer = L.geoJSON(geoJson, {
        pointToLayer: (feature, latlng) => {
            if (feature.properties?.shape === "Circle") {
                return L.circle(latlng, {radius: feature.properties.radius});
            }

            const marker = createMarker(latlng, {draggable: false});
            marker.setIcon(customIcon);
            
            return marker;
        },
        onEachFeature: (feature, layer) => {
            layer.feature = feature;
            addMouseListenerToLayer(layer);
        },
        style: function (feature) {
            return geoJsonStyle;
        }
    });

    // Replace certain layers with better-suited Leaflet primitives
    const toAdd = [];
    const toRemove = [];

    geoJsonLayer.eachLayer((layer) => {
        const feature = layer.feature;
        const shape = feature?.properties?.shape;
        if (!shape) return;

        if (shape === "Rectangle") {
            // GeoJSON polygons become L.Polygon; convert to L.Rectangle so Geoman rotation works.
            const bounds = layer.getBounds();
            const rect = L.rectangle(bounds, layer.options);
            rect.feature = feature;

            if (feature.properties.angle) {
                // feature.geometry.coordinates are [lng, lat]
                const latlngs = feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
                rect.setLatLngs(latlngs);
                rect.pm?.setInitAngle?.(feature.properties.angle);
            }

            addMouseListenerToLayer(rect);

            toRemove.push(layer);
            toAdd.push(rect);
        }
    });

    toRemove.forEach((l) => geoJsonLayer.removeLayer(l));
    toAdd.forEach((l) => geoJsonLayer.addLayer(l));

    return geoJsonLayer;
}

export function bindCustomPopup(layer){
    layer.bindPopup(layer.feature?.properties?.text ?? "..." , {removable: false, editable: true});
}

export const geoJsonStyle = {
    color: "#ffb85c",
    fillColor: "#fff",
    fillOpacity: 0.1,
    weight: 2
}

export function getIconByType(type) {
    const iconName = TYPE_TO_ICON[type];

    const span = document.createElement('span');
    span.className = `mi mi-${iconName}`;

    return span;
}