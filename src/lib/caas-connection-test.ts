import { toast } from "sonner";
import { getAvailableModes } from "@/lib/caas-api-keys";
import { applyModeToCaasUrl } from "@/lib/caas-url";
import type { CaasApiKeys } from "@/types/configuration";
import type { ConnectionStatusType } from "@/types/connection-status";
import { modeOptionTexts } from "@/types/mode";

export async function testCaaSConnection(
	caasUrl: string,
	caasApiKey: string,
	onStatusChange: (status: ConnectionStatusType) => void,
	t: (key: string) => string,
	label?: string,
): Promise<boolean> {
	const withLabel = (message: string) =>
		label ? `${label}: ${message}` : message;
	onStatusChange("testing");
	try {
		const url = new URL(caasUrl);
		const searchParams = new URLSearchParams();
		searchParams.append("filter", '{"_id": ""}');
		searchParams.append("np", "");
		searchParams.append("rep", "pj");
		url.search = searchParams.toString();

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${caasApiKey}`,
				"Content-Type": "application/json",
			},
		});

		if (response.status === 200) {
			onStatusChange("connected");
			toast.success(
				withLabel(
					t("setup.wizardSetup.step1.form.connectionStatus.toast.status200"),
				),
			);
			return true;
		}

		onStatusChange("disconnected");
		const toastKey =
			response.status === 401
				? "status401"
				: response.status === 403
					? "status403"
					: response.status === 404
						? "status404"
						: "statusError";
		toast.error(
			withLabel(
				t(`setup.wizardSetup.step1.form.connectionStatus.toast.${toastKey}`),
			),
		);
		return false;
	} catch {
		onStatusChange("disconnected");
		toast.error(
			withLabel(
				t("setup.wizardSetup.step1.form.connectionStatus.toast.statusError"),
			),
		);
		return false;
	}
}

/** Tests each configured key against the CaaS URL of its mode; stops at the first failure. */
export async function testCaaSApiKeys(
	caasUrl: string,
	caasApiKeys: CaasApiKeys,
	onStatusChange: (status: ConnectionStatusType) => void,
	t: (key: string) => string,
): Promise<boolean> {
	for (const mode of getAvailableModes(caasApiKeys)) {
		const isConnected = await testCaaSConnection(
			applyModeToCaasUrl(caasUrl, mode),
			caasApiKeys[mode] ?? "",
			onStatusChange,
			t,
			modeOptionTexts[mode],
		);
		if (!isConnected) return false;
	}
	return true;
}
