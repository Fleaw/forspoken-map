import {showModal} from "./modal.js";
import {mapExtent} from "./map.js";
import {getOverlayLayer, overlayNames} from "./layerFactory.js";
import {getIconByType} from "./utils.js";

export async function askForCoordinates(latlng = {}) {
    const html = `
    <h2 style="margin: 5px">Enter Coordinates</h2>

    <label>X</label>
    <input type="number" id="coord-lng" min="${mapExtent[0]}" max="${mapExtent[2]}" step="0.0001" value="${latlng.lng ?? ""}">
    
    <label>Z</label>
    <input type="number" id="coord-lat" min="${mapExtent[1]}" max="${mapExtent[3]}" step="0.0001" value="${latlng.lat ?? ""}">
    `;

    const { ok, modal } = await showModal(html);
    if (!ok) return null;

    const lat = parseFloat(modal.querySelector("#coord-lat").value);
    const lng = parseFloat(modal.querySelector("#coord-lng").value);

    return { lat, lng };
}

export async function askSaveBookmarkEdits(edits, mode) {
    const result = {save: [], revert: []};
    
    let list = "<ul style='list-style-type: none; padding-left: 20px'>";

    const bookmarks = edits.filter(layer => layer.bookmarkId);
    
    // Ask to save only the bookmarks
    if(bookmarks.length === 0) {
        result.save = bookmarks;
        return result;
    }

    bookmarks.forEach((layer, index) => {        
        const icon = getIconByType(layer.feature.properties.shape);
        list += `
        <li class="list-item" data-key="${index}">
            ${icon.outerHTML}
            <label>${layer.feature.properties.name}</label>
            <input class="list-item-checkbox toggle" type="checkbox" checked/>
        </li>`;
    });
    
    list += "</ul>";
    
    const html = `
    <h2 style="margin: 5px">${mode} bookmarks ?</h2>
    ${list}
    `;

    const { ok, modal } = await showModal(html);
    
    const items = modal.querySelectorAll("ul li");
    
    items.forEach((item) => {
        const key = item.dataset.key;
        const checked = item.querySelector("input[type=checkbox]").checked;

        const layer = edits.at(key);
        if(checked && ok){
            result.save.push(layer);
        }
        else{
            result.revert.push(layer);
        }
    });
    
    return result;
}

export async function shareSelection(map) {
    let list = "<ul style='list-style-type: none; padding-left: 20px'>";

    const editLayer = getOverlayLayer(overlayNames.editLayer);
    const layers = editLayer.getLayers();
    if(layers.length === 0)
        return null;

    layers.forEach((layer, index) => {
        const icon = getIconByType(layer.feature.properties.shape);
        list += `
        <li class="list-item" data-key="${index}">
            ${icon.outerHTML}
            <label>${layer.feature.properties.name ?? layer.feature.properties.shape}</label>
            <input class="list-item-checkbox toggle" type="checkbox" checked/>
        </li>`;
    });

    list += "</ul>";

    const html = `
    <h2 style="margin: 5px">Share ?</h2>
    ${list}
    `;
    
    document.body.addEventListener("mouseover", (e) => {
        const li = e.target.closest("li.list-item");
        if (!li) return;

        const index = li.dataset.key;
        const layer = layers.at(index);

        if(layer.feature.geometry.type === 'Point'){
            map.flyTo(layer.getLatLng(), 6, {duration: 0.8});
        }
        else {
            map.flyToBounds(layer.getBounds());
        }

        //layer.setStyle?.({ weight: 4, color: "#ff5151" });
    });

    // document.body.addEventListener("mouseout", (e) => {
    //     const li = e.target.closest("li.list-item");
    //     if (!li) return;
    //
    //     const index = li.dataset.key;
    //     const layer = layers.at(index);
    //
    //     //layer.setStyle?.(layer.options.style);
    // });

    const { ok, modal } = await showModal(html);

    const items = modal.querySelectorAll("ul li");

    const lg = L.layerGroup();
    
    items.forEach((item) => {
        const layer = layers.at(item.dataset.key);
        const checked = item.querySelector("input[type=checkbox]").checked;

        if(checked && ok){
            lg.addLayer(layer);
        }
    });

    return lg.getLayers().length > 0 ? lg.toGeoJSON() : null;
}

export async function showCoordinates(latlng, name = '') {
    const formattedLng = Number(latlng.lng.toFixed(6));
    const formattedLat = Number(latlng.lat.toFixed(6));
    
    const html = `
    <h2 style="margin: 5px">${name ? name : 'Coordinates'}</h2>
    <div style="margin: 5px; line-height: 2em;">
        <div class="copy-coords" title="Click to copy" data-copy="${formattedLng}">x: ${formattedLng}</div>
        <div class="copy-coords" title="Click to copy" data-copy="${formattedLat}">z: ${formattedLat}</div>
        <div class="copy-coords" title="Click to copy" data-copy="${latlng.toString(6)}">${latlng.toString(6)}</div>
    </div>
    `;

    document.addEventListener("click", e => {
        const el = e.target.closest(".copy-coords");
        if (!el) return;

        const text = el.dataset.copy;

        navigator.clipboard.writeText(text).then(() => {
            el.classList.add("copied");
            setTimeout(() => el.classList.remove("copied"), 800);
        });
    });

    await showModal(html, null, null);
}

export async function askForName(defaults = "") {
    const html = `
    <h2 style="margin: 5px">Create bookmark ?</h2>

    <input id="focus" class="label" value="${defaults}">
    `;

    const { ok, modal } = await showModal(html);
    if (!ok) return null;

    return modal.querySelector(".label").value;
}

export async function displayMessage(title, message, cancelBtn = 'Cancel', okButton = 'OK') {
    const html = `
    <h2 style="margin: 5px">${title}</h2>

    <div>${message}</div>
    `;

    return showModal(html, cancelBtn, okButton);
}