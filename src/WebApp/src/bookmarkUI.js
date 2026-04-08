import {getOverlayLayer, overlayNames} from "./layerFactory.js";
import {getIconByType} from "./utils.js";

export function initBookmarkUI(map){
    renderBookmarkList(map);
}

export function renderBookmarkList(map) {
    if (!map) return;
    const container = document.getElementById("bookmark-list");
    container.innerHTML = "";

    map.bm.bookmarks.forEach(entry => {
        const div = document.createElement("div");
        div.className = "bookmark-item";
        
        div.innerHTML = `
            <div>${getIconByType(entry.geojson.properties.shape).outerHTML}</div>
            <span class="bookmark-name" data-id="${entry.id}">${entry.name}</span>
            <div class="bookmark-actions">
                <span class="mi mi-${entry.visible ? "visibility" : "visibility_off"}" data-action="toggle"style="font-variation-settings:
                    'FILL' 1,
                    'wght' 200,
                    'GRAD' 0,
                    'opsz' 24"
                ></span>
                <span class="mi mi-my_location" data-action="zoom"></span>
                <span class="mi mi-delete" data-action="delete"></span>
            </div>
        `;

        div.querySelector(".bookmark-name").onclick = (ev) => {
            const span = ev.target;
            const id = span.dataset.id;

            // Create an input to replace the span
            const input = document.createElement("input");
            input.type = "text";
            input.value = span.textContent;
            input.className = "bookmark-rename-input";

            // Replace span with input
            span.replaceWith(input);
            input.focus();
            input.select();

            // Save on blur or Enter
            const save = () => {
                const newName = input.value.trim() || `New ${entry.shape}`;
                map.bm.renameBookmark(id, newName);
                renderBookmarkList(map);
            };

            input.onblur = save;
            input.onkeydown = (e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") renderBookmarkList(map);
            };
        };

        div.querySelector("[data-action='toggle']").onclick = () => {
            map.bm.toggleBookmarkVisibility(entry.id);
            renderBookmarkList(map);
        };

        div.querySelector("[data-action='zoom']").onclick = () => {
            const layer = map.bm.getBookmarkLayerById(entry.id);
            
            getOverlayLayer(overlayNames.editLayer).addTo(map);
            
            if(entry.shape === 'Marker'){
                layer.openPopup();
                map.flyTo(layer._latlng, 6);
            }
            else {
                map.fitBounds(layer.getBounds());
            }
        };

        div.querySelector("[data-action='delete']").onclick = () => {
            if (!confirm(`Delete bookmark '${entry.name}' ?`)) return;
            
            map.bm.deleteBookmark(entry.id);
            renderBookmarkList(map);
        };

        container.appendChild(div);
    });

    document.getElementById("bookmark-delete-all").onclick = () => {
        if (!confirm("Delete all bookmarks ?")) return;

        map.bm.deleteAllBookmarks();
        renderBookmarkList(map);
    };
}