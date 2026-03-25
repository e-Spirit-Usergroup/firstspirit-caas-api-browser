import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		tsconfigPaths(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@components": path.resolve(__dirname, "./src/components"),
			"@stores": path.resolve(__dirname, "./src/stores"),
			"@utils": path.resolve(__dirname, "./src/utils"),
			"@ui": path.resolve(__dirname, "./src/ui"),
			"@lib": path.resolve(__dirname, "./src/lib"),
			"@hooks": path.resolve(__dirname, "./src/hooks"),
		},
	},
});
