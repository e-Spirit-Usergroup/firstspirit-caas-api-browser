import { useTranslation } from "react-i18next";
import { type Service, services } from "@/lib/services";
import { cn } from "@/lib/tw-utils";

type ServiceSwitchProps = {
	value: Service;
	onChange: (service: Service) => void;
};

function ServiceSwitch({ value, onChange }: ServiceSwitchProps) {
	const { t } = useTranslation();

	return (
		<div
			role="tablist"
			aria-label={t("app.form.service.label")}
			className="col-span-12 flex gap-1.5 rounded-xl border bg-muted/70 p-1.5 dark:bg-neutral-900"
		>
			{services.map((service) => {
				const isSelected = value === service.value;
				return (
					<button
						key={service.value}
						type="button"
						role="tab"
						aria-selected={isSelected}
						onClick={() => onChange(service.value)}
						className={cn(
							"flex h-11 flex-1 items-center justify-center gap-2.5 rounded-lg text-[0.95rem] transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							isSelected
								? cn(
										"bg-background font-semibold text-foreground dark:bg-neutral-800",
										service.activeTabClass,
									)
								: "font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground dark:hover:bg-neutral-800/60",
						)}
					>
						<span
							aria-hidden="true"
							className={cn(
								"size-2.5 rounded-full transition-opacity duration-200",
								service.dotClass,
								isSelected ? "opacity-100" : "opacity-40",
							)}
						/>
						{service.label}
					</button>
				);
			})}
		</div>
	);
}

export { ServiceSwitch };
