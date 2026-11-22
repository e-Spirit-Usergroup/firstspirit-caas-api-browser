import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Icon from "@/components/icons/icon";
import { cn } from "@/lib/tw-utils";

type FileDropZoneProps = {
	selectedFile: File | null;
	onFileSelect: (file: File) => void;
};

function FileDropZone({ selectedFile, onFileSelect }: FileDropZoneProps) {
	const { t } = useTranslation();
	const [isDragOver, setIsDragOver] = useState(false);
	const inputId = useId();

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
		const file = e.dataTransfer.files[0];
		if (!file) return;
		if (file.type === "application/json" || file.name.endsWith(".json")) {
			onFileSelect(file);
		} else {
			toast.error(t("setup.fileUpload.invalidFileType"));
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onFileSelect(file);
		}
	};

	// A label for the visually hidden (but focusable) file input: click, Enter and
	// Space open the file picker natively, so no extra key handling is needed.
	return (
		<label
			htmlFor={inputId}
			className={cn(
				"w-full cursor-pointer border-2 border-dashed rounded-xl p-12 text-center flex flex-col gap-2 transition-colors",
				"has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-2",
				isDragOver &&
					"border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900/30",
				!isDragOver &&
					selectedFile &&
					"border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-900/20",
				!isDragOver &&
					!selectedFile &&
					"border-blue-300 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20",
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<span className="flex items-center justify-center w-full">
				<Icon
					icon={!selectedFile ? "upload" : "check-circle"}
					className={cn(
						"size-12",
						selectedFile ? "fill-green-500" : "fill-blue-400",
					)}
				/>
			</span>
			<span>
				{selectedFile ? (
					<>
						<span className="text-green-600 font-medium">
							{selectedFile.name}
						</span>
						<br />
						<span className="text-sm text-gray-500">
							{t("setup.fileUpload.title.selectDifferentFile")}
						</span>
					</>
				) : isDragOver ? (
					t("setup.fileUpload.dropYourConfigFile")
				) : (
					<>
						{t("setup.fileUpload.title.text")}
						<span className="text-blue-400 underline">
							{t("setup.fileUpload.title.browse")}
						</span>
					</>
				)}
			</span>
			<input
				id={inputId}
				type="file"
				accept=".json,application/json"
				className="sr-only"
				onChange={handleFileInputChange}
			/>
		</label>
	);
}

export { FileDropZone };
