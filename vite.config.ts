import path from "node:path";
import { styleText } from "node:util";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

const NEO_REPLY_URL = "https://neoreply.de/?utm_source=caasapibrowser";

function terminalLink(label: string, url: string) {
	return `\u001b]8;;${url}\u0007${label}\u001b]8;;\u0007`;
}

function pink(text: string) {
	return `\u001b[38;2;255;121;198m${text}\u001b[39m`;
}

function neoReplyStartupMessage(): Plugin {
	return {
		name: "neo-reply-startup-message",
		configureServer(server) {
			const { printUrls } = server;
			server.printUrls = () => {
				server.config.logger.info(
					styleText("dim", "  made with ") +
						pink("❤") +
						styleText(
							"dim",
							` by ${terminalLink("Neo Reply", NEO_REPLY_URL)}\n`,
						),
				);
				printUrls();
			};
		},
	};
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		tailwindcss(),
		neoReplyStartupMessage(),
	],
	resolve: {
		tsconfigPaths: true,
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
			"@components": path.resolve(import.meta.dirname, "./src/components"),
			"@stores": path.resolve(import.meta.dirname, "./src/stores"),
			"@utils": path.resolve(import.meta.dirname, "./src/utils"),
			"@ui": path.resolve(import.meta.dirname, "./src/ui"),
			"@lib": path.resolve(import.meta.dirname, "./src/lib"),
			"@hooks": path.resolve(import.meta.dirname, "./src/hooks"),
		},
	},
});
