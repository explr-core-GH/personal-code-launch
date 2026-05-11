# Minecraft → DelightEx Exporter

Web tool for kids: upload a `.glb` (Minecraft Education Structure Block 3D Export),
`.mcstructure` (Bedrock Save Mode), or `.schem` (Java Edition WorldEdit /
Litematica), and download an optimized `.glb` ready to import into DelightEx /
CoSpaces.

## Run locally

```sh
npm install
npm run dev    # http://localhost:8080
npm run build  # produces dist/ for Netlify
npm test       # runs the unit + smoke tests
```

## Deploy to Netlify

- Drag the `dist/` folder onto netlify.com after running `npm run build`, or
- `npx netlify-cli deploy --prod --dir dist`

`netlify.toml` is already configured.
