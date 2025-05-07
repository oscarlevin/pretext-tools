//import { defineConfig } from "vite";
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
//        outDir: path.join(__dirname, "extension", "build", "extension"),
//        minify: false,
//        sourcemap: true,
//        lib: {
//            entry: "./src/extension.ts",
//            fileName: "index",
//            formats: ["cjs"],
//        },
//        rollupOptions: {
//            external: ["vscode", "vscode-languageserver/node"],
//        },
//    },
//});
