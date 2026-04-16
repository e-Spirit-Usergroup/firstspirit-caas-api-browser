import { toast } from "sonner";
import type { ConnectionStatusType } from "@/types/connection-status";

export async function testCaaSConnection(
	caasUrl: string,
	caasApiKey: string,
	onStatusChange: (status: ConnectionStatusType) => void,
	t: (key: string) => string,
): Promise<boolean> {
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
				t("setup.wizardSetup.step1.form.connectionStatus.toast.status200"),
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
			t(`setup.wizardSetup.step1.form.connectionStatus.toast.${toastKey}`),
		);
		return false;
	} catch {
		onStatusChange("disconnected");
		toast.error(
			t("setup.wizardSetup.step1.form.connectionStatus.toast.statusError"),
		);
		return false;
	}
}
