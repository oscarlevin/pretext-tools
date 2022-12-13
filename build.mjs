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
const lspServerCompiled = statusUpdateFunction(
    "./src/lsp-server/main.ts",
    "./out/lsp-server.js"
);

// Compile the base extension
esbuild
    .build({
        entryPoints: ["./src/extension.ts"],
        bundle: true,
        format: "cjs",
        platform: "node",
        sourcemap: true,
        external: ["vscode", "vscode*", "file"],
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
        extensionCompiled(result);
    })
    .catch((e) => {
        console.warn("Encountered build error", e);
        process.exit();
    });

// Compile the LSP to a separate file
esbuild
    .build({
        entryPoints: ["./src/lsp-server/main.ts"],
        bundle: true,
        format: "cjs",
        platform: "node",
        sourcemap: true,
        external: ["vscode", "vscode*", "glob", "file"],
        outfile: "./out/lsp-server.js",
        watch: WATCH && {
            onRebuild(error, result) {
                if (error) {
                    console.warn("Encountered build error", e);
                }
                lspServerCompiled(result);
            },
        },
    })
    .then((result) => {
        lspServerCompiled(result);
    })
    .catch((e) => {
        console.warn("Encountered build error", e);
        process.exit();
    });

if (WATCH) {
    console.log("Watching  ...");
}
