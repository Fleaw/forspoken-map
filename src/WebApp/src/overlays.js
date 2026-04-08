import 'leaflet.control.layers.tree';
import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";

import * as jsyaml from 'js-yaml';

import {createImage, defaultSvgOptions} from "./icons.js";
import {getOrCreateOverlayLayer} from "./layerFactory.js";

/**
 * @typedef {Object} OverlayLeafNode
 * @property {string} name
 * @property {string} label
 * @property {boolean} [cluster]
 * @property {boolean} [selected]
 *
 * @typedef {Object} OverlayTreeNode
 * @property {string} label
 * @property {boolean} [select_all]
 * @property {boolean} [collapsed]
 * @property {(OverlayTreeNode|OverlayLeafNode)[]} children
 */

async function loadOverlayYaml() {
    const yamlText = await fetch("./data/layerTree.yaml").then(r => r.text());
    return jsyaml.load(yamlText);
}

/**
 * Build a node for L.control.layers.tree from a YAML config node.
 * @param {OverlayTreeNode|OverlayLeafNode} node
 * @param {L.Map} map
 */
function buildTree(node, map) {
    if ("children" in node && node.children) {
        return {
            label: node.label,
            selectAllCheckbox: node.select_all || false,
            collapsed: node.collapsed || false,
            children: node.children.map((child) => buildTree(child, map))
        };
    }

    const layer = getOrCreateOverlayLayer(node.name, {searchable: true, isCluster: node.cluster});
    if (node.selected) layer.addTo(map);

    const icon = createImage(node.name, {
        className: 'entry-icon',
        src: {
            path: 'ui/icons/big/',
            iconMap: defaultSvgOptions.src.iconMap
        },
        xOffset: 0,
        yOffset: 0,
        width: 25,
        height: 25,
    });
    icon.innerHTML = node.label;
    const label = icon.outerHTML;

    return {label, layer};
}

export async function initOverlayTree(map) {
    const yamlTree = await loadOverlayYaml();
    const overlaysTree = Object.values(yamlTree).map((tree) => buildTree(/** @type {OverlayTreeNode} */ (tree), map));

    const control = L.control.layers.tree({}, overlaysTree, {collapsed: false});
    control._map = map;
    
    return control;
}
