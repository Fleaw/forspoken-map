import {renderBookmarkList} from "./bookmarkUI.js";
import {getOverlayLayer, overlayNames} from "./layerFactory.js";
import {bindCustomPopup, loadGeoJsonFeature} from "./utils.js";

/**
 * @typedef {Object} BookmarkGeoJson
 * @property {string} type
 * @property {{ name: string, shape: string, text?: string, radius?: number, angle?: number, visible?: boolean, rewards?: any[] }} properties
 *
 * @typedef {Object} BookmarkEntry
 * @property {string} id
 * @property {string} name
 * @property {string} shape
 * @property {boolean} visible
 * @property {BookmarkGeoJson} geojson
 */

/**
 * Manages bookmark state, persistence (localStorage) and corresponding Leaflet layers.
 */
const BookmarkManager = L.Class.extend({
    initialize: function(map, drawLayer) {
        this.map = map;
        this.drawLayer = drawLayer;
        this.bookmarks = this._getBookmarksFromStorage();
        this.layers = new Map();

        this._loadLayers();
        this._registerMapEvents();
    },

    // -----------------------------
    // Storage
    // -----------------------------
    _getBookmarksFromStorage: function() {
        const json = localStorage.getItem("bookmarks") || "[]";

        try {
            return JSON.parse(json);
        } catch (error) {
            return [];
        }
    },
    _saveBookmarksToStorage: function() {
        localStorage.setItem("bookmarks", JSON.stringify(this.bookmarks));
    },
    _loadLayers: function() {
        this.bookmarks.forEach(entry => {
            const layer = loadGeoJsonFeature(entry.geojson).getLayers()[0];

            layer.feature = entry.geojson;
            layer.bookmarkId = entry.id;

            bindCustomPopup(layer);
            
            this.layers.set(entry.id, layer);

            if (entry.visible) {
                this.drawLayer.addLayer(layer);
            }
        });
        
        this.map.on('bm:updated bm:renamed', (e) => {
            const layer = this.layers.get(e.id);
            layer.feature = e.entry.geojson;
        });
    },

    // -----------------------------
    // Event Wiring
    // -----------------------------
    _registerMapEvents: function() {
        this.map.on("bm:create", e => {
            this.addBookmark(e.layer, e.name);
        });

        this.map.on("bm:update", e => {
            this.updateBookmarkGeoJson(e.id, e.geojson);
        });

        this.map.on("bm:rename", e => {
            this.renameBookmark(e.id, e.newName);
        });

        this.map.on("bm:delete", e => {
            this.deleteBookmark(e.id);
        });

        this.map.on("bm:visibility", e => {
            this.setBookmarkVisibility(e.id, e.visible);
        });
    },

    _getEntry: function(id) {
        return this.bookmarks.find(b => b.id === id);
    },

    getBookmarkLayerById: function(id){
        return this.layers.get(id);
    },
    
    // -----------------------------
    // Bookmark CRUD
    // -----------------------------
    addBookmark: function(layer, name = "Untitled") {
        const id = crypto.randomUUID();
        
        const geojson = layer.toGeoJSON();
        geojson.properties.name = name;
        
        const entry = {
            id,
            name,
            geojson,
            visible: true
        };

        layer.feature = geojson;

        this.bookmarks.push(entry);
        this._saveBookmarksToStorage();

        this.layers.set(id, layer);
        layer.bookmarkId = id;
        this.drawLayer.addLayer(layer);

        renderBookmarkList(this.map);
        
        /** @type {{ id: string, entry: BookmarkEntry, layer: L.Layer }} */
        const payload = { id, entry, layer };
        this.map.fire("bm:created", payload);

        return entry;
    },

    updateBookmark: function(layer) {
        const id = layer.bookmarkId;
        const entry = this._getEntry(id);
        if (!entry) return;

        entry.geojson = L.extend(entry.geojson, layer.toGeoJSON());
        this._saveBookmarksToStorage();

        /** @type {{ id: string, entry: BookmarkEntry }} */
        const payload = { id, entry };
        this.map.fire("bm:updated", payload);
    },

    updateBookmarkGeoJson: function(id, newGeoJson) {
        const entry = this._getEntry(id);
        if (!entry) return;

        entry.geojson = L.extend(entry.geojson, newGeoJson);
        this._saveBookmarksToStorage();

        /** @type {{ id: string, entry: BookmarkEntry }} */
        const payload = { id, entry };
        this.map.fire("bm:updated", payload);
    },

    renameBookmark: function(id, newName) {
        const entry = this._getEntry(id);
        if (!entry) return;

        const previousName = entry.name;
        entry.name = newName;
        entry.geojson.properties.name = newName;
        this._saveBookmarksToStorage();

        /** @type {{ id: string, entry: BookmarkEntry, previousName: string }} */
        const payload = { id, entry, previousName };
        this.map.fire("bm:renamed", payload);
    },

    deleteBookmark: function(id) {
        const layer = this.layers.get(id);
        if (layer) this.drawLayer.removeLayer(layer);

        this.bookmarks = this.bookmarks.filter(b => b.id !== id);
        this._saveBookmarksToStorage();

        this.layers.delete(id);
        renderBookmarkList(this.map);

        /** @type {{ id: string }} */
        const payload = { id };
        this.map.fire("bm:deleted", payload);
    },

    deleteAllBookmarks: function() {
        this.bookmarks.forEach(entry => {
            const layer = this.layers.get(entry.id);
            if (layer) this.drawLayer.removeLayer(layer);
        });

        this.bookmarks = [];
        this._saveBookmarksToStorage();

        this.layers.clear();
        renderBookmarkList(this.map);

        this.map.fire("bm:deletedAll", {});
    },

    setBookmarkVisibility: function(id, state) {
        const entry = this._getEntry(id);
        const layer = this.layers.get(id);

        entry.visible = state;

        if (state) this.drawLayer.addLayer(layer);
        else this.drawLayer.removeLayer(layer);

        this._saveBookmarksToStorage();
        renderBookmarkList(this.map);

        /** @type {{ id: string, visible: boolean }} */
        const payload = { id, visible: state };
        this.map.fire("bm:visibilityToggled", payload);
    },

    toggleBookmarkVisibility: function(id) {
        const entry = this._getEntry(id);
        this.setBookmarkVisibility(id, !entry.visible);
    },

    isBookmarkLayer: function(layer) {
        return layer.bookmarkId !== undefined;
    }
});

/**
 * Initializes bookmark manager and attaches it as `map.bm`.
 * @param {L.Map} map
 */
export function initBookmarks(map) {
    map.bm = new BookmarkManager(map, getOverlayLayer(overlayNames.editLayer));
    return map.bm;
}

/**
 * Wire DOM popup-save events from `plugins/popupMod.js` into bookmark persistence.
 * Expects `map.bm` to exist.
 * @param {L.Map} map
 */
export function initBookmarkPopupPersistence(map) {
    document.addEventListener('savepopup', (e) => {
        const marker = e.detail.marker;
        const geoJson = marker.toGeoJSON();
        geoJson.properties.text = marker.getPopup().getContent();
        map.bm.updateBookmarkGeoJson(marker.bookmarkId, geoJson);
    });
}