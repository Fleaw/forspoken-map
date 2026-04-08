// This module integrates Leaflet-Geoman plugin for drawing and editing shapes on the map.
// It manages user interactions, shape creation, editing, tooltips, and saving bookmark edits.

import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import {getOverlayLayer, overlayNames} from "./layerFactory.js";
import {askForName, askSaveBookmarkEdits} from "./forms.js";
import {addContextMenuItem} from "./contextmenu.js";
import {bindCustomPopup, customIcon, geoJsonStyle} from "./utils.js";
import {createMarker} from "./marker.js";

const edits = []; // Tracks layers with unsaved edits

// Calculate polygon area using shoelace formula
export function getPolygonArea(latLngs) {
    let area = 0;
    const count = latLngs.length;
    for (let i = 0; i < count; i++) {
        const p1 = latLngs[i];
        const p2 = latLngs[(i + 1) % count];
        area += p1.lng * p2.lat - p2.lng * p1.lat;
    }

    area = Math.abs(area / 2);
    const isKm = area >= 1000000;
    return {
        area: (isKm ? area / 1000000 : area).toFixed(3),
        isKm
    };
}

export function getCircleArea(radius) {
    const area = Math.PI * radius * radius;
    const isKm = area >= 1000000;
    return {
        area: (isKm ? area / 1000000 : area).toFixed(3),
        isKm
    };
}

// Helper to get Geoman tool instance by mode and shape
function getGeomanTool(map, mode, shape) {
    if (!map?.pm) throw new Error("Geoman not initialized");

    const modeObj = map.pm[mode];
    if (!modeObj) throw new Error(`Unknown mode: ${mode}`);

    const tool = modeObj[shape];
    if (!tool) throw new Error(`Unknown shape: ${shape} for mode ${mode}`);

    return tool;
}

// Revert unsaved changes on layers
function revertChanges(map, layers) {
    layers.forEach(layer => {
        if(!layer._map){
            layer.off('click'); // Needed to clear the 'Remove layer' event
            getOverlayLayer(overlayNames.editLayer).addLayer(layer);
            
            // Unbind then re-bind the popup to add the 'click' event previously removed
            layer.unbindPopup();
            bindCustomPopup(layer);
        }
        else if((layer.feature.properties.angle ?? 0) !== (layer.pm._angle ?? 0)){
            layer.pm.rotateLayerToAngle(layer.feature.properties.angle ?? 0);
        }
        else {
            layer.feature.geometry.coordinates = layer.pm.originalGeoJson.geometry.coordinates;
            
            const geom = layer.pm.originalGeoJson.geometry;

            switch (geom.type) {
                case "Point": {
                    const [lng, lat] = geom.coordinates;
                    layer.setLatLng([lat, lng]);
                    break;
                }
                case "LineString": {
                    const latlngs = geom.coordinates.map(([lng, lat]) => [lat, lng]);
                    layer.setLatLngs(latlngs);
                    break;
                }
                case "Polygon": {
                    const latlngs = geom.coordinates.map(coords => L.GeoJSON.coordsToLatLngs(coords));
                    layer.setLatLngs(latlngs);
                    break;
                }
            }
        }
        
        if(layer._mRadius)
        {
            layer._mRadius = layer.feature.properties.radius || 0;
        }

        layer.redraw?.();
    });
}

// Generate tooltip content for polygon or rectangle
function polygonTooltipContent(layer, latlngs) {
    const { area, isKm } = getPolygonArea(Array.isArray(latlngs) ? latlngs.flat() : latlngs);
    return `
        <div>area: ${area} ${isKm ? 'km²' : 'm²'}</div>
        <div>center: ${area > 0 ? layer.getCenter().toString(3) : latlngs.toString(3)}</div>`;
}

// Generate tooltip content for circle
function circleTooltipContent(layer, latlngs) { 
    const { area, isKm } = getCircleArea(layer.getRadius());
    const { radius, metric } = layer.getRadius() >= 1000 ? 
        { radius: layer.getRadius() / 1000, metric: 'km' } : 
        { radius: layer.getRadius(), metric: 'm' }; 
    
    return `
        <div>radius: ${radius.toFixed(3)} ${metric}</div>
        <div>area: ${area} ${isKm ? 'km²' : 'm²'}</div>
        <div>center: ${latlngs.toString(3)}</div>`; 
}

// Generate tooltip content for line
function lineTooltipContent(map, latlngs) { 
    let totalLength = 0; 
    for (let i = 1; i < latlngs.length; i++) { 
        totalLength += map.distance(latlngs[i - 1], latlngs[i]); 
    } 
    const { length, metric } = totalLength >= 1000 ? 
        { length: totalLength / 1000, metric: 'km' } : 
        { length: totalLength, metric: 'm' }; 
    
    return `<div>length: ${length.toFixed(3)} ${metric}</div>`;
}

function markerTooltipContent(layer, latlngs) {
    return `
        <div>coords: ${latlngs}</div>`;
}

// Show tooltip with area, radius, length info during drawing/editing
function showShapeTooltip(map, { layer, latlngs, shape }, isEditMode = false) {
    if (shape === 'CircleMarker') return; // No tooltip for CircleMarker
    
    const tool = getGeomanTool(map, 'Draw', shape);
    const tooltip = tool._hintMarker.getTooltip();

    let content = '';
    switch (shape) {
        case 'Rectangle':
        case 'Polygon':
            content = polygonTooltipContent(layer, latlngs);
            break;
        case 'Circle':
            content = circleTooltipContent(layer, latlngs);
            break;
        case 'Line':
            content = lineTooltipContent(map, latlngs);
            break;
        case 'Marker':
            content = markerTooltipContent(layer, latlngs);
            break;
    }

    tool._hintMarker.setTooltipContent(content);

    if (isEditMode) {
        tooltip.setLatLng(layer.getCenter?.() ?? latlngs);
        tooltip.addTo(map);
    }
}

function closeAllTooltips(map){
    map.pm.Draw.shapes.forEach(shape => {
        getGeomanTool(map, 'Draw', shape)._hintMarker.closeTooltip();
    });
}

// Listen for changes on a layer and show tooltip during editing
function listenForChange(map, onLayer, isEditMode = false){
    onLayer.on("pm:change", ({layer, latlngs, shape}) => {
        showShapeTooltip(map, {layer, latlngs, shape}, isEditMode);
    });
    
    if(onLayer.feature){
        onLayer.pm.originalGeoJson = onLayer.toGeoJSON();
    }
    
    onLayer.once('pm:update pm:rotatedisable pm:remove', ({layer, shape}) => {
        if((layer.pm._layerEdited || layer.pm._rotateEnabled || !layer._map)/* && layer.bookmarkId*/){
            closeAllTooltips(map);
            
            if(layer.pm._rotateEnabled){
                layer.feature.geometry.coordinates = layer.pm.originalGeoJson.geometry.coordinates;
            }
            edits.push(layer);
        }
        onLayer.off('pm:update pm:rotatedisable pm:remove');
    });
}

function cancelAllGlobalModes(map){
    if(map.pm.globalEditModeEnabled())
        map.pm.disableGlobalEditMode();
    if(map.pm.globalDragModeEnabled())
        map.pm.disableGlobalDragMode();
    if(map.pm.globalRotateModeEnabled())
        map.pm.disableGlobalRotateMode();
    if(map.pm.globalRemovalModeEnabled())
        map.pm.disableGlobalRemovalMode();
}

function getActiveGlobalMode(map){
    return (
        map.pm.globalEditModeEnabled() ? 'Edit' :
        map.pm.globalDragModeEnabled() ? 'Drag' :
        map.pm.globalRotateModeEnabled() ? 'Rotate' :
        map.pm.globalDrawModeEnabled() ? 'Draw' :
        map.pm.globalRemovalModeEnabled() ? 'Remove' :
        'None'
    );
}

export function hasActiveGlobalMode(map){
    return (
        map.pm.globalEditModeEnabled() ||
        map.pm.globalDragModeEnabled() ||
        map.pm.globalRotateModeEnabled() ||
        map.pm.globalDrawModeEnabled() ||
        map.pm.globalRemovalModeEnabled()
    );
}

// Add mouse event listeners to a layer for tooltip and selection
export function addMouseListenerToLayer(layer){
    layer.on('mouseover', (e) => {
        const map = layer._map;
        if(!map?.pm) return;
        if(!map.pm.globalDrawModeEnabled()){
            closeAllTooltips(map);
            showShapeTooltip(map, {
                layer: layer,
                latlngs: layer._latlng ?? layer._latlngs,
                shape: layer.feature.properties.shape
            }, true);
        }
    });

    layer.on('mouseout', (e) => {
        const map = layer._map;
        if(!map?.pm) return;
        if(!map.pm.globalDrawModeEnabled())
            closeAllTooltips(map);
    });
}

export function addMouseListenerToLayers(parentLayer){
    parentLayer.eachLayer((layer) => {
        addMouseListenerToLayer(layer);
    });
}

// Initialize Geoman controls and event handlers
export function initGeoman(map){
    map.pm.addControls({
        cutPolygon: false,
        drawCircleMarker: false,
        drawText: false,
        
    });
    map.pm.setGlobalOptions({
        cursorMarker: false,
        layerGroup: getOverlayLayer(overlayNames.editLayer),
        exitModeOnEscape: true,
        finishOnEnter: true,
        markerStyle: { ...map.pm.getGlobalOptions().markerStyle,
            icon : customIcon
        },
        templineStyle: {
            color: '#d20bff',
            dashArray: '5,5',
        },
        hintlineStyle: {
            color: '#d20bff',
            dashArray: '5,5',
        }
    });
    
    map.pm.setPathOptions(geoJsonStyle);

    const actions = [
        {
            text: "Cancel",
            onClick: () => {
                map.pm._lastAction = 'cancel';
                cancelAllGlobalModes(map);
            },
            name: "custom-cancel"
        },
        {
            text: "Save",
            onClick: () => {
                map.pm._lastAction = 'save';
                cancelAllGlobalModes(map);
            },
            name: "save"
        },
    ];

    map.pm.Toolbar.changeActionsOfControl("editMode", actions);
    map.pm.Toolbar.changeActionsOfControl("dragMode", actions);
    map.pm.Toolbar.changeActionsOfControl("rotateMode", actions);
    map.pm.Toolbar.changeActionsOfControl("removalMode", actions);

    // Enable draw tools for all shapes initially, then disable drawing (initialize the hintmarker and tooltip)
    map.pm.Draw.shapes.forEach(shape => {
        map.pm.enableDraw(shape);
    });
    map.pm.disableDraw();

    // Handle global mode toggling events
    map.on('pm:globaldragmodetoggled pm:globaleditmodetoggled pm:globalrotatemodetoggled pm:globalremovalmodetoggled', async (e) => {
        if(e.enabled){
            map.pm._lastAction = undefined;
            map.pm._lastActiveMode = getActiveGlobalMode(map);
            
            L.PM.Utils.findLayers(map).forEach((layer) => {
                layer.closePopup();
                layer.unbindPopup();
                listenForChange(map, layer, true);
            });
        }
        else {
            L.PM.Utils.findLayers(map).forEach((layer) => {
                layer.off("pm:change mousedown mouseup");
                bindCustomPopup(layer);
            });

            closeAllTooltips(map);

            if(map.pm._lastAction === 'save'){
                if(edits.length > 0){
                    const result = await askSaveBookmarkEdits(edits, map.pm._lastActiveMode);
                    result.save.forEach((layer) => {
                        if(!layer._map){
                            map.bm.deleteBookmark(layer.bookmarkId);
                            layer.remove();
                            return;
                        }
                        map.bm.updateBookmark(layer);
                    });
                    
                    revertChanges(map, result.revert);
                }   
            }
            else {
                revertChanges(map, edits);
            }

            L.PM.Utils.findLayers(map).forEach((layer) => {
                layer.pm._layerEdited = false;
            });
            
            edits.length = 0;
        }
    });

    // Listen for new drawing start
    map.on("pm:drawstart", (e) => {
        listenForChange(map, e.workingLayer);
    });

    // Handle creation of new shapes
    map.on('pm:create', ({shape, layer}) => {
        layer.feature = layer.toGeoJSON();
        layer.feature.properties.shape = shape;

        if(shape === 'Marker'){
            createMarker(layer.getLatLng(), {}, layer);
        }
        bindCustomPopup(layer);
        
        addMouseListenerToLayer(layer);
        
        addContextMenuItem(layer, {separator: true});
        addContextMenuItem(layer, {
            text: "Add to Bookmarks",
            index: 99,
            callback: async () => {
                if(!map.bm.isBookmarkLayer(layer)){
                    const label = await askForName(`New ${layer.feature.properties.shape}`);
                    if(label){
                        map.bm.addBookmark(layer, label);
                        layer.removeContextMenuItemWithIndex(99);
                    }
                }
            }
        });
    });
}