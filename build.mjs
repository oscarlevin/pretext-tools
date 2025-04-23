import { execSync } from 'child_process';
import esbuild from 'esbuild';

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");

function statusUpdateFunction(entry, outfile) {
  return (result) => {
    if (result) {
      console.log("Built", entry, "to", outfile);
    }
  };
}

const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd(result => {
      if (result.errors.length > 0) {
        console.error('Build errors:', result.errors);
      } else {
        console.log('[watch] build finished');
      }
    });
  }
};

const buildOptions = {
  entryPoints: ["./src/extension.ts"],
  bundle: true,
  format: "cjs",
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  platform: "node",
  external: ["vscode"],
  outfile: "./out/extension.js",
  plugins: [esbuildProblemMatcherPlugin],
};

const ctx = await esbuild.context({ ...buildOptions });

if (watch) {
  await ctx.watch();
} else {
  await ctx.rebuild();
}
await ctx.dispose();

// Add Vite build step for the visualEditor React app
try {
  console.log("Building visualEditor React app with Vite...");
  execSync("vite build", { cwd: "./visualEditor", stdio: "inherit" });
  console.log("visualEditor React app built successfully.");
} catch (error) {
  console.error("Error building visualEditor React app:", error);
  process.exit(1);
}
