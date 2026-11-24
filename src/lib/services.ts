export type Service = "caas" | "navigation-service";

export const services: readonly {
	value: Service;
	label: string;
	dotClass: string;
	activeTabClass: string;
	glowClass: string;
	panelBorderClass: string;
}[] = [
	{
		value: "caas",
		label: "CaaS",
		dotClass: "bg-caas",
		activeTabClass: "shadow-md shadow-caas/30 ring-1 ring-caas/25",
		glowClass: "shadow-lg shadow-caas/45",
		panelBorderClass: "border-t-caas",
	},
	{
		value: "navigation-service",
		label: "Navigation Service",
		dotClass: "bg-nav",
		activeTabClass: "shadow-md shadow-nav/30 ring-1 ring-nav/25",
		glowClass: "shadow-lg shadow-nav/45",
		panelBorderClass: "border-t-nav",
	},
];

export function getService(value: Service) {
	return services.find((service) => service.value === value) ?? services[0];
}
