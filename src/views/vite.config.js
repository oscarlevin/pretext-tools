import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: './', // Set the root directory to the current folder
    build: {
        outDir: 'dist', // Output directory for bundled files
        rollupOptions: {
            input: path.resolve(__dirname, 'tiptap.js'), // Entry point
            output: {
                entryFileNames: 'tiptap.js', // Output file name
            },
        },
    },
});