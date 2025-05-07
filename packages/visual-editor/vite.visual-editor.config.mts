//import { defineConfig } from "vite";
//import react from "@vitejs/plugin-react";
//import { viteStaticCopy } from "vite-plugin-static-copy";
//import * as path from "node:path";
//import { createRequire } from "module";
//const require = createRequire(import.meta.url);
//const __dirname = path.dirname(new URL(import.meta.url).pathname);

//// https://vitejs.dev/config/
//export default defineConfig({
//    plugins: [
//        react(),
//        viteStaticCopy({
//            targets: [
//                {
//                    src: path.join(
//                        require.resolve("@doenet/doenetml"),
//                        "../fonts/*",
//                    ),
//                    dest: "fonts/",
//                },
//            ],
//        }),
//    ],
//    root: "./src/preview-window",
//    base: "./",
//    build: {
//        outDir: path.join(__dirname, "extension", "build", "preview-window"),
//        rollupOptions: {
//            output: {
//                entryFileNames: `assets/[name].js`,
//                chunkFileNames: `assets/[name].js`,
//                assetFileNames: `assets/[name].[ext]`,
//            },
//        },
//    },
//});
