# Forspoken Interactive Map

[![Deploy](https://github.com/Fleaw/forspoken-map/actions/workflows/deploy.yml/badge.svg)](https://github.com/Fleaw/forspoken-map/actions/workflows/deploy.yml)

An interactive, web‑based map of **Athia**, built for players and modders of *Forspoken*.  
Browse locations, collectibles, landmarks, and world data directly in your browser.

This project began as a **tool for Forspoken modders**, focused on precise world data, coordinates, and utilities such as drawing tools and grid overlay.  
As the project grew, it evolved into a **general-purpose interactive map** for both players and modders — keeping its technical features while becoming accessible to anyone exploring Athia.

👉 **Live map:** https://fleaw.github.io/forspoken-map

---

## Features

- 🗺️ Full interactive map of Athia
- 🔍 Search, filter, and explore locations
- 📍 Icons for collectibles, landmarks, chests, monuments, and more
- ⚙️ Built with Vite for fast loading and smooth navigation
- 📦 Fully static — deployable anywhere (GitHub Pages, Netlify, etc.)

---

## Development

You can run the project in two ways (both exposes the website at http://localhost:5173/):

### 🔧 Option 1 — Local development (Node.js)
#### Install dependencies
```bash
npm install
```

#### Run the dev server
```bash
npm run dev
```

#### Build for production
```bash
npm run build
```

### 🐳 Option 2 — Development using Docker (no Node.js required)

If you don’t have Node.js or npm installed locally, you can run the project entirely through Docker.

#### Run the development server
```bash
docker compose up
```

This build the image and starts the Vite dev server inside a container then exposes it on your machine, so you can open the map in your 
browser just like a normal local setup.

#### To stop the environment:
```bash
docker compose down
```

---

The site is deployed automatically via GitHub Actions to
https://fleaw.github.io/forspoken-map.

---

## Contributing
Contributions are welcome — whether it’s new markers, bug fixes, or improvements.
Feel free to open an issue or submit a pull request.

---

## License
This project is open‑source under the MIT license.
Forspoken is a trademark of Square Enix; this project is fan‑made and not affiliated with them.