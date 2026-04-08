import {askForName} from "./forms.js";

export function addBookmarkMenu(layer, map) {    
    const ctxMenu = {
        contextmenu: true,
        contextmenuInheritItems: true,
        contextmenuItems: [
            {
                separator: true
            },
            {
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
            }
        ]
    }

    layer.bindContextMenu(ctxMenu);
}

export function bindContextMenu(layer) {
    const ctxMenu = {
        contextmenu: true,
        contextmenuInheritItems: true,
        contextmenuItems: [
            
        ]
    }

    layer.bindContextMenu(ctxMenu);
}

export function addContextMenuItem(layer, menuItem) {
    if(!layer.options.contextmenu){
        bindContextMenu(layer, menuItem);
    }
    
    layer.options.contextmenuItems.push(menuItem);
}