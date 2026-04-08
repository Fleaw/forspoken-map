import {defineConfig} from "vite";
//import pluginPurgeCss from "vite-plugin-purgecss-updated-v5";

export default defineConfig(({mode}) => {
    const isDesktop = mode === "desktop";
    
    return {
        base: "./",
        define: {
            // This allows tree-shaking of Desktop.js in web builds
            __DESKTOP__: JSON.stringify(isDesktop)
        },
        build:{
            assetsInlineLimit: 0,
            rollupOptions: {
                output: {
                    manualChunks: {
                        leaflet: ['leaflet'],
                        geoman: ['@geoman-io/leaflet-geoman-free']
                    }
                }
            }
        },
        server: {
            host: true,
            port: 5173,
            strictPort: true,
            watch: {
                usePolling: true,
                interval: 100
            }
        },
        plugins: [
            // pluginPurgeCss({
            //     content: [
            //         "./index.html",
            //         "./src/**/*.{js,jsx,ts,tsx,vue,svelte,html}"
            //     ],
            //     rejected: true,
            //     rejectedCss: true,
            //     defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
            //     safelist: [
            //         // Material icons and custom icon fonts
            //         /^mi$/,
            //         /^mi-[a-z0-9_-]+$/,
            //         /^mi-(outlined|rounded|sharp)-[a-z0-9_]+$/,
            //         'material-symbols-rounded',
            //         'search-bookmark-icon',
            //
            //         // Leaflet sidepanel, notifications and layers tree plugin classes
            //         /^leaflet-sidepanel.*/,
            //         /^leaflet-notifications.*/,
            //         /^leaflet-layerstree.*/,
            //
            //         // Leaflet core
            //         /^leaflet-/,
            //         /^l-/,
            //
            //         // Sidebar plugin
            //         /^sidepanel/,
            //         /^sidepanel-/,
            //         /^tabs-/,
            //         /^sidebar/,
            //         /^sidebar-/,
            //
            //         // Layer tree plugin
            //         /^leaflet-control-layers/,
            //         /^leaflet-tree-/,
            //
            //         /^marker-cluster/,
            //         /^leaflet-oldie/,
            //
            //
            //         /^leaflet-animate/,
            //     ]
            // })
        ]
    }
});