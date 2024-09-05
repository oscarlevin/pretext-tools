// Build all parts of the plugin
import esbuild from "esbuild";

const WATCH = process.argv.includes("--watch");

function statusUpdateFunction(entry, outfile) {
    return (result) => {
        if (result) {
            console.log("Built", entry, " to ", outfile);
        }
    };
}

const extensionCompiled = statusUpdateFunction(
    "./src/extension.ts",
    "./out/extension.js"
);

esbuild
    .build({
        entryPoints: ["./src/extension.ts"],
        bundle: true,
        format: "cjs",
        platform: "node",
        sourcemap: true,
        external: ["vscode"],
        outfile: "./out/extension.js",
        watch: WATCH && {
            onRebuild(error, result) {
                if (error) {
                    console.warn("Encountered build error", e);
                }
                extensionCompiled(result);
            },
        },
    })
    .then((result) => {
        if (WATCH) {
            console.log("Watching ...");
        }
        extensionCompiled(result);
    })
    .catch((e) => {
        console.warn("Encountered build error", e);
        process.exit();
    });
