import 'leaflet.sidepanel';
import 'leaflet.sidepanel/dist/leaflet.sidepanel.css';
import {$} from "jquery";

export function initSidebar(map, layerControl){
    const div = document.createElement('div');
    div.setAttribute('id', 'right-panel');
    div.setAttribute('class', 'sidepanel');
    div.setAttribute('aria-label', 'side panel');
    div.setAttribute('aria-hidden', 'false');
    
    div.innerHTML = `
    <div class="sidepanel-inner-wrapper">
        <nav class="sidepanel-tabs-wrapper" aria-label="sidepanel tab navigation">
          <ul class="sidepanel-tabs">
            <div class="sidepanel-tabs-center">
              <li class="sidepanel-tab">
                <a class="sidebar-tab-link" role="tab" data-tab-link="tab-1">
                  <span class="mi mi-stacks" title="Layers"></span>
                </a>
              </li>
              <li class="sidepanel-tab">
                <a class="sidebar-tab-link" role="tab" data-tab-link="tab-2">
                  <span class="mi mi-bookmark" title="Bookmarks"></span>
                </a>
              </li>
            </div>
            <li class="sidepanel-tabs-bottom">
              <a href="https://github.com/Fleaw/forspoken-map" target="_blank" rel="noopener noreferrer">
                <svg class="icon-github" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                       0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
                       -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2
                       -3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21
                       2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44
                       1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54
                       1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42
                       -3.58-8-8-8z"
                  />
                </svg>
              </a>
            </li>
          </ul>
        </nav>
        <div class="sidepanel-content-wrapper">
          <div class="sidepanel-content">
            <div id="sidepanel-layers-content" class="sidepanel-tab-content" data-tab-content="tab-1"></div>
            <div class="sidepanel-tab-content" data-tab-content="tab-2">
              <div id="bookmark-header">
                <span>Bookmarks</span>
                <div class="bookmark-header-actions">
                  <span id="bookmark-delete-all" class="mi mi-delete_sweep" style="font-size: 32px;"></span>
                </div>
              </div>
              <div id="bookmark-list"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="sidepanel-toggle-container">
        <button class="sidepanel-toggle-button" type="button" aria-label="toggle side panel"></button>
      </div>
    `;
    
    document.body.insertBefore(div, document.body.firstChild);
    
    const sidePanel = L.control.sidepanel('right-panel', {
        panelPosition: 'right',
        hasTabs: true,
        tabsPosition: 'right',
        pushControls: true,
        darkMode: false,
        startTab: 'tab-1',
    }).addTo(map);
    
    const container = layerControl.onAdd(map);
    
    const layerTreeParent = $("#sidepanel-layers-content");
    layerTreeParent.append(container);

    sidePanel.open();
}
