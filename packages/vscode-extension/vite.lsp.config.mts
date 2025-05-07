//import { PluginOption, defineConfig } from "vite";
//import * as path from "node:path";
//import dts from "vite-plugin-dts";
//const __dirname = path.dirname(new URL(import.meta.url).pathname);

//// https://vitejs.dev/config/
//export default defineConfig({
//    plugins: [
//        dts({ rollupTypes: true, exclude: [] }),
//    ],
//    base: "./",
//    build: {
//        outDir: path.join(__dirname, "extension", "build", "language-server"),
//        minify: true,
//        sourcemap: true,
//        lib: {
//            entry: "./src/lsp-server/main.ts",
//            name: "PretextToolsLsp",
//            formats: ["iife"],
//        },
//        rollupOptions: {
//            output: {
//                entryFileNames: `[name].js`,
//                chunkFileNames: `[name].js`,
//                assetFileNames: `[name].[ext]`,
//            },
//        },
//    },
//});
