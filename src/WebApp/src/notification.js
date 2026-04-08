import 'leaflet-notifications/js/leaflet-notifications.min.js';
import 'leaflet-notifications/css/leaflet-notifications.min.css';

export const notification = L.control
    .notifications({
        timeout: 3000,
        position: 'bottomright',
        closable: true,
        dismissable: true
    }) ;

export function initNotifications(map){    
    notification.addTo(map);
}