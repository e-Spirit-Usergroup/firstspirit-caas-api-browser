import { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/icons/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Inputs } from "./schema";

export type SchemaInputProps = {
	schema: Inputs["databaseSchemas"][number];
	addEntityType: (name: string, schema: string) => void;
	removeEntityType: (name: string, schema: string) => void;
	removeSchema: (name: string) => void;
};

export const DatabaseSchemaComponent: React.FC<SchemaInputProps> = ({
	schema,
	addEntityType,
	removeEntityType,
	removeSchema,
}) => {
	const { t } = useTranslation();

	const [entityTypeInput, setEntityTypeInput] = useState<string>("");

	const handleAddEntityType = () => {
		if (entityTypeInput.trim()) {
			addEntityType(entityTypeInput.trim(), schema.name);
			setEntityTypeInput("");
		}
	};

	return (
		<div className="bg-card rounded-md border border-border">
			<div className="flex items-center gap-2 border-b border-border p-4">
				<h2 className="text-lg font-bold flex-1">{schema.name}</h2>
				<Button
					type="button"
					variant="ghost"
					className="group/btn"
					onClick={() => removeSchema(schema.name)}
				>
					<Icon icon="trash" className="group-hover/btn:text-red-500" />
				</Button>
			</div>
			{/* Items */}
			{schema?.entityTypeNames?.length > 0 && (
				<div className="p-4 flex flex-col gap-4">
					{schema.entityTypeNames.map((entityTypeName: string) => (
						<div
							className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md"
							key={entityTypeName}
						>
							<div className="flex-1 font-bold text-sm">{entityTypeName}</div>
							<Button
								size="sm"
								type="button"
								variant="ghost"
								className="group/btn"
								onClick={() => removeEntityType(entityTypeName, schema.name)}
							>
								<Icon icon="delete" className="group-hover/btn:text-red-500" />
							</Button>
						</div>
					))}
				</div>
			)}
			<div className="flex gap-2 p-4">
				<Input
					type="text"
					placeholder="Entity Type"
					name="entityType"
					value={entityTypeInput}
					onChange={(e) => setEntityTypeInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							handleAddEntityType();
						}
					}}
				/>
				<Button type="button" onClick={handleAddEntityType}>
					<Icon icon="plus" />
					{t(
						"setup.wizardSetup.step2.form.configurationMode.manual.addEntityTypeBtn",
					)}
				</Button>
			</div>
		</div>
	);
};
