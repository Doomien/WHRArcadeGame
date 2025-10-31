# WHR Arcade Game Phaser Prototype

This directory hosts the first playable Phaser proof-of-concept for the WHR Arcade Game migration. Open `index.html` in a local web server (or directly in a browser that allows local file access to images) to view the scene. The scene displays the Unity menu background rendered through Phaser 3, verifying that the framework boots correctly and assets load as expected.

> **Note:** The Unity background image (`web/assets/main-scene-background.png`) is ignored by Git so it can be managed locally.
> Copy the latest export from the Unity project into that path before launching the prototype.

## Running locally

From the repository root, start any static file server that serves the `web/` directory. For example, using Python:

```bash
cd web
python -m http.server 8080
```

Then open <http://localhost:8080> in your browser.
