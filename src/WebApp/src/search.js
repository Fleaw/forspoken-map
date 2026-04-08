import 'leaflet-search';
import 'leaflet-search/dist/leaflet-search.src.css';

import {createSvgIconWithOverlay} from "./icons.js";
import {forEachOverlay, getOverlayLayer, overlayNames} from "./layerFactory.js";
import {getIconByType} from "./utils.js";

const searchData = [];
const searchGroup = L.layerGroup();

function bookmarkToSearchData(layer, feature) {
    const shape = feature.properties.shape;
    
    const icon = getIconByType(shape);
    icon.classList.add('search-bookmark-icon');
    
    const editLayer = getOverlayLayer(overlayNames.editLayer);

    return {
        loc: feature.geometry.type === 'Point' ? feature.geometry.coordinates : layer.getCenter(),
        title: feature.properties.name,
        icon: icon.outerHTML,
        type: 'bookmark',
        name: shape,
        layerId: editLayer.getLayerId(layer),
        rewards: feature.properties.rewards,
        layerGroup: editLayer,
        bookmarkId: layer.bookmarkId,
    };
}

function initSearchData(map) {
    searchData.length = 0;
    searchGroup.clearLayers();

    const areaIcon = '<span class="mi mi-landscape" style="font-size: 35px"></span>';
    
    forEachOverlay((name, group) => {
        group.eachLayer(layer => {
            if(!group.options.searchable)
                return;
            
            if(name === overlayNames.subAreaLayer){
                searchGroup.addLayer(layer);
                const searchGroupId = searchGroup.getLayerId(layer);
                searchData.push({
                    loc: layer.getCenter(),
                    title: layer.feature.properties.areaName,
                    icon: areaIcon,
                    type: 'area',
                    layerId: searchGroupId
                });
                return;
            }

            if(group === getOverlayLayer(overlayNames.editLayer)){
                searchGroup.addLayer(layer);
                const searchGroupId = searchGroup.getLayerId(layer);
                const data = bookmarkToSearchData(layer, layer.feature);
                data.layerId = searchGroupId;
                searchData.push(data);
                return;
            }
            
            const type = layer.feature.properties.type;

            const iconHtml = createSvgIconWithOverlay(type, layer.feature.properties.rewards?.[0]?.kind, {
                    icon: {
                        width: 40,
                        height: 40
                    },
                    overlay: {
                        width: 18,
                        height: 18
                    }
                }).outerHTML;

            searchGroup.addLayer(layer);
            const searchGroupId = searchGroup.getLayerId(layer);
            searchData.push({
                loc: layer.feature.geometry.type === 'Point' ? layer.feature.geometry.coordinates : layer.getCenter(),
                title: layer.feature.properties.name,
                icon: iconHtml,
                type: 'marker',
                name: type,
                layerId: searchGroupId,
                rewards: layer.feature.properties.rewards,
                layerGroup: group
            });
        });
    });
    
    searchData.sort((a, b) => a.title.localeCompare(b.title));
    
    map.on('bm:created', ({ id, entry, layer }) => {
        searchGroup.addLayer(layer);
        const searchGroupId = searchGroup.getLayerId(layer);
        const data = bookmarkToSearchData(layer, entry.geojson);
        data.layerId = searchGroupId;
        searchData.push(data);
    });

    map.on('bm:renamed', ({id, entry}) => {
        const index = searchData.findIndex(item => item.bookmarkId === id);
        if(index >= 0) {
            const layer = map.bm.getBookmarkLayerById(id);
            const newData = bookmarkToSearchData(layer, entry.geojson);
            newData.layerId = searchData[index].layerId;
            searchData.splice(index, 1, newData);
        }
    });

    map.on('bm:deleted', ({ id }) => {
        const index = searchData.findIndex(item => item.bookmarkId === id);
        if(index >= 0){
            searchGroup.removeLayer(searchData[index].layerId);
            searchData.splice(index, 1);
        }
    });
}

export function initSearchControl(map){
    initSearchData(map);

    getOverlayLayer(overlayNames.subAreaLayer).remove();

    L.Control.Search.prototype._handleArrowSelect = function(velocity) {

        var searchTips = this._tooltip.hasChildNodes() ? this._tooltip.childNodes : [];

        for (let i=0; i<searchTips.length; i++) {
            L.DomUtil.removeClass(searchTips[i], 'search-tip-select');
        }

        if ((velocity == 1 ) && (this._tooltip.currentSelection >= (searchTips.length - 1))) {// If at end of list.
            L.DomUtil.addClass(searchTips[this._tooltip.currentSelection], 'search-tip-select');
        }
        else if ((velocity == -1 ) && (this._tooltip.currentSelection <= 0)) { // Going back up to the search box.
            this._tooltip.currentSelection = -1;
        }
        else if (this._tooltip.style.display != 'none') {
            this._tooltip.currentSelection += velocity;

            L.DomUtil.addClass(searchTips[this._tooltip.currentSelection], 'search-tip-select');

            this._input.value = searchTips[this._tooltip.currentSelection].textContent;

            // scroll:
            var tipOffsetTop = searchTips[this._tooltip.currentSelection].offsetTop;

            if (tipOffsetTop + searchTips[this._tooltip.currentSelection].clientHeight >= this._tooltip.scrollTop + this._tooltip.clientHeight) {
                this._tooltip.scrollTop = tipOffsetTop - this._tooltip.clientHeight + searchTips[this._tooltip.currentSelection].clientHeight;
            }
            else if (tipOffsetTop <= this._tooltip.scrollTop) {
                this._tooltip.scrollTop = tipOffsetTop;
            }
        }
    };
    
    const searchControl = new L.Control.Search({
        sourceData: localData,
        formatData: formatData,
        filterData: filterData,
        moveToLocation: (e) => {},
        initial: false,
        buildTip: customTip,
        markerLocation:true,
        autoCollapse: true,
        marker: false,
        position: 'topright'
    }).addTo(map);

    searchControl.on('search:locationfound', location =>{
        const found = searchData.find((item) => {
            return L.latLng(item.loc).equals(L.latLng(location.latlng.coords));
        });
        const layer = searchGroup.getLayer(found.layerId);

        if(found){
            switch(found.type){
                case 'area':
                {
                    map.fitBounds(layer.getBounds(), {maxZoom: 3});
                    layer.fire('mouseover');
                    break;
                }
                case 'marker':
                {
                    found.layerGroup.addTo(map);
                    map.flyTo(layer.getLatLng(), 6, {duration: 0.8});
                    break;
                }
                case 'bookmark':
                {
                    if(layer.feature.geometry.type === 'Point'){
                        map.flyTo(layer.getLatLng(), 6, {duration: 0.8});
                    }
                    else {
                        map.fitBounds(layer.getBounds());
                    }

                    map.bm.setBookmarkVisibility(layer.bookmarkId, true);
                    
                    break;
                }
            }
        }
    });

    function formatData(data)
    {
        const self = this,
            propName = this.options.propertyName,
            propLoc = this.options.propertyLoc,
            jsonret = {};
        
        for (let i in data) {
            const loc = L.latLng(self._getPath(data[i],propLoc));
            const properties = data[i].rewards?.reduce((acc, value) => `${value.kind.toLowerCase()} ${value.id?.toLowerCase() ?? ""} `, "");
            const key = JSON.stringify({name: self._getPath(data[i],propName),index: i});
            jsonret[key]= { coords: loc, properties: properties };
        }
        
        return jsonret;
    }
    
    function filterData(text, records)
    {
        const frecords = {};

        text = text.replace(/[.*+?^${}()|[\]\\]/g, '');
        //sanitize remove all special characters

        if(text==='') {
            return [];
        }

        const init = this.options.initial ? '^' : '';
        const icase = !this.options.casesensitive ? 'i' : undefined;

        const regSearch = new RegExp(init + text, icase);

        for (const [key, value] of Object.entries(records)) 
        {
            const json = JSON.parse(key);
            if( regSearch.test(json.name) || value.properties?.includes(text.toLowerCase())) {
                frecords[key]= value;
            }
        }

        return frecords;
    }
}

function localData(text, callResponse)
{
    callResponse(searchData);
    return {};
}

function customTip(json,val) {
    const key = JSON.parse(json);
    const found = searchData.at(key.index);
    return found ? `<span>${key.name}${found.icon}</span>` : 'No data';
}