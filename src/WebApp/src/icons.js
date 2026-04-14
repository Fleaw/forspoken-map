import merge from 'lodash.merge';

let iconBigMap = {};
let iconSmallMap = {};

export const TYPE_TO_ICON = {
    Circle: "circle",
    Polygon: "pentagon",
    Line: "polyline",
    Marker: "location_on",
    Rectangle: "rectangle"
};

const defaultImageSourceOptions = {
    path: 'ui/icons/',
    iconMap: {},
    ext: 'png',
};

const defaultImageOptions = {
    className: '',
    alt: '',
    width: 50,
    height: 50,
    src: defaultImageSourceOptions
};

export const defaultOverlayOptions = defaultOr(defaultImageOptions, {
    className: 'icon-overlay',
    src: defaultOr(defaultImageSourceOptions, {
        path: 'ui/icons/small/',
    }),
    width: 22,
    height: 22,
    xOffset: 5,
    yOffset: 5
});

export const defaultSvgOptions = defaultOr(defaultImageOptions, {
    svgClassName: 'icon-svg',
    className: 'icon-base',
    src: defaultOr(defaultImageSourceOptions, {
        path: 'ui/icons/big/'
    }),
    width: 50,
    height: 50,
});

const defaultIconWithOverlayOptions = {
    icon: defaultSvgOptions,
    overlay: defaultOverlayOptions
};

function defaultOr(defaultOptions, options) {
    return merge({}, defaultOptions, options);
}

export async function initIconMap() {
    iconBigMap = await fetch("./data/icons-big.json").then(r => r.json());
    iconSmallMap = await fetch("./data/icons-small.json").then(r => r.json());

    defaultSvgOptions.src.iconMap = iconBigMap;
    defaultOverlayOptions.src.iconMap = iconSmallMap;
}

export function createImage(imageName, options = {}) {
    options = defaultOr(defaultImageOptions, options);

    const image = document.createElement('image');

    let src = imageName;
    if(options.src.path) {
        let iconName = imageName;
        if(options.src.iconMap){
            iconName = options.src.iconMap[imageName];
            if (!iconName) return image;
        }
        src = `${options.src.path}${iconName}.${options.src.ext}`;
    }
    
    image.className = options.className;
    image.setAttribute('src', src);
    image.setAttribute('width', options.width);
    image.setAttribute('height', options.height);
    if(options.xOffset)
        image.setAttribute('x', options.xOffset);
    if(options.yOffset)
        image.setAttribute('y', options.yOffset);
    
    image.setAttribute('alt', options.alt ?? imageName);
    
    return image;
}

export function createSvgIconFromImage(imageName, options = {}) {
    options = defaultOr(defaultSvgOptions, options);
    
    const svg = document.createElement('svg');
    const image = createImage(imageName, options);
    
    const srcValue = image.getAttribute('src');
    image.setAttribute('href', srcValue);
    image.removeAttribute('src');
    
    svg.className = options.svgClassName;
    svg.setAttribute('width', options.width);
    svg.setAttribute('height', options.height);
    
    svg.appendChild(image);
    
    return svg;
}

export function createSvgIconWithOverlay(imageName, overlayName, options = {}){
    options = defaultOr(defaultIconWithOverlayOptions, options);

    const svg = createSvgIconFromImage(imageName, options.icon);
    
    if(overlayName){
        const overlay = createImage(overlayName, options.overlay);
        if(overlay.hasAttribute('src')){
            const srcValue = overlay.getAttribute('src');
            overlay.setAttribute('href', srcValue);
            overlay.removeAttribute('src');
        }

        svg.appendChild(overlay);
    }
    
    return svg;
}

export function createDivIcon(imageName, overlayName, className = '', options = {}) {
    options = defaultOr(defaultIconWithOverlayOptions, options);
    const svg = createSvgIconWithOverlay(imageName, overlayName, options);
    return L.divIcon({ html: svg.outerHTML, className: className, iconSize: [options.icon.width, options.icon.width] });
}