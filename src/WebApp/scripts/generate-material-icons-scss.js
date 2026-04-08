import fs from "fs";
import https from "https";
import path from "path";
import {TYPE_TO_ICON} from "../src/icons.js";

const ROOT = "src"; // folder to scan
const ICON_REGEX = /mi(?:-(outlined|rounded|sharp))?-([a-z0-9_]+)/gi;

function scanFiles(dir) {
    let files = [];

    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);

        if (stat.isDirectory()) {
            files = files.concat(scanFiles(full));
        } else if (/\.(html|js)$/.test(full)) {
            files.push(full);
        }
    }

    return files;
}

function extractIcons() {
    const files = scanFiles(ROOT);
    const icons = new Set();

    for (const file of files) {
        const content = fs.readFileSync(file, "utf8");

        let match;
        while ((match = ICON_REGEX.exec(content)) !== null) {
            const icon = match[2];
            icons.add(icon);
        }
    }

    for (const icon of Object.values(TYPE_TO_ICON)) {
        icons.add(icon);
    }
    
    // manually add icons
    icons.add("visibility");
    icons.add("visibility_off");

    return [...icons].sort();
}

const usedIcons = extractIcons();

// Generate SCSS
let scss = `// AUTO‑GENERATED — DO NOT EDIT

$material-icons: (
${usedIcons.map(i => `  "${i}"`).join(",\n")}
);

.mi {
  font-size: 24px;
  line-height: 1;
  display: inline-block;
  vertical-align: middle;
}

@mixin icon-class($variant, $icon, $family) {
  .mi-#{$variant}-#{$icon}::before {
    content: "#{$icon}";
    font-family: $family;
    font-variation-settings: 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
}

@each $icon in $material-icons {
  .mi-#{$icon}::before {
    content: "#{$icon}";
    font-family: "Material Symbols Rounded";
    font-variation-settings: 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }

  @include icon-class("outlined", $icon, "Material Symbols Outlined");
  @include icon-class("rounded",  $icon, "Material Symbols Rounded");
  @include icon-class("sharp",    $icon, "Material Symbols Sharp");
}
`;

fs.writeFileSync("src/styles/material-icons-wrapper.scss", scss);
console.log("Generated SCSS with used icons:", usedIcons.length);

const url = "https://fonts.google.com/metadata/icons?incomplete=true";

https.get(url, res => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
        data = data.replace(")]}'", "");
        const json = JSON.parse(data);

        const icons = json.icons.map(i => i.name);

        // Generate autocomplete CSS (for editor only)
        let css = "";

        for (const icon of icons) {
            css += `.mi-${icon}{}\n`;
            css += `.mi-outlined-${icon}{}\n`;
            css += `.mi-rounded-${icon}{}\n`;
            css += `.mi-sharp-${icon}{}\n`;
        }

        fs.writeFileSync("src/styles/material-icons-autocomplete.css", css);
        console.log("Generated CSS for autocomplete: src/styles/material-icons-autocomplete.css");
    });
});
