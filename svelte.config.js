import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // adapter-node: produces a standalone Node server (build/), run with
    // `node build`. Matches the Dockerfile CMD and Render runtime.
    adapter: adapter()
  }
};

export default config;
