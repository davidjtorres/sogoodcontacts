"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Upload, X, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import Link from "next/link";

interface ImportContactsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImportComplete: (count: number) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

export default function ImportContactsModal({ isOpen, onClose, onImportComplete }: ImportContactsModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (selectedFile: File | null) => {
		setError(null);

		if (!selectedFile) {
			setFile(null);
			return;
		}

		// Check file type
		if (!selectedFile.name.endsWith(".csv")) {
			setError("Please upload a CSV file");
			setFile(null);
			return;
		}

		// Check file size
		if (selectedFile.size > MAX_FILE_SIZE) {
			setError(`File size exceeds the 2MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)`);
			setFile(null);
			return;
		}

		setFile(selectedFile);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);

		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			handleFileChange(e.dataTransfer.files[0]);
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			handleFileChange(e.target.files[0]);
		}
	};

	const handleBrowseClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleRemoveFile = () => {
		setFile(null);
		setError(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleImport = async () => {
		if (!file) return;

		try {
			setIsUploading(true);
			setUploadProgress(0);

			// Create FormData
			const formData = new FormData();
			formData.append("file", file);

			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => {
					const newProgress = prev + Math.random() * 15;
					return newProgress > 90 ? 90 : newProgress;
				});
			}, 300);

			// Send the file to the server
			const response = await fetch("/api/contacts/import", {
				method: "POST",
				body: formData,
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to import contacts");
			}

			const data = await response.json();

			// Show success message
			toast({
				title: "Import successful",
				description: `${data.importedCount} contacts have been imported.`,
			});

			// Notify parent component
			onImportComplete(data.importedCount);

			// Reset and close modal
			setTimeout(() => {
				setFile(null);
				setIsUploading(false);
				setUploadProgress(0);
				onClose();
			}, 1000);
		} catch (error) {
			console.error("Error importing contacts:", error);
			setIsUploading(false);
			setUploadProgress(0);

			toast({
				title: "Import failed",
				description: error instanceof Error ? error.message : "Failed to import contacts. Please try again.",
				variant: "destructive",
			});
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[550px]">
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold text-gray-900">Import Contacts</DialogTitle>
				</DialogHeader>

				<div className="py-6 space-y-6">
					{/* File upload area */}
					{!file && !isUploading && (
						<div
							className={`border-2 border-dashed rounded-lg p-8 text-center ${
								isDragging ? "border-[#8B5CF6] bg-purple-50" : "border-gray-300"
							} ${error ? "border-red-300 bg-red-50" : ""}`}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
						>
							<input
								type="file"
								accept=".csv"
								onChange={handleFileInputChange}
								className="sr-only"
								id="file-upload"
								data-testid="file-input"
							/>

							<div className="flex flex-col items-center justify-center space-y-3">
								<div className="p-3 rounded-full bg-purple-100">
									<Upload className="h-8 w-8 text-[#8B5CF6]" />
								</div>
								<div className="space-y-1">
									<h3 className="text-gray-700 font-medium">Drag and drop your CSV file</h3>
									<p className="text-sm text-gray-500">or</p>
									<Button
										type="button"
										variant="outline"
										onClick={handleBrowseClick}
										className="mt-2 border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white"
									>
										Browse Files
									</Button>
								</div>
								<p className="text-xs text-gray-500 mt-2">Maximum file size: 2MB</p>
							</div>
						</div>
					)}

					{/* Error message */}
					{error && (
						<div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
							<AlertCircle className="h-5 w-5" />
							<p className="text-sm">{error}</p>
						</div>
					)}

					{/* Selected file */}
					{file && !isUploading && (
						<div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-[#8B5CF6] bg-opacity-10 rounded">
									<FileText className="h-6 w-6 text-[#8B5CF6]" />
								</div>
								<div>
									<p className="font-medium text-gray-700">{file.name}</p>
									<p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleRemoveFile}
								className="text-gray-500 hover:text-red-500"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>
					)}

					{/* Upload progress */}
					{isUploading && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="p-2 bg-[#8B5CF6] bg-opacity-10 rounded">
										<FileText className="h-6 w-6 text-[#8B5CF6]" />
									</div>
									<div>
										<p className="font-medium text-gray-700">{file?.name}</p>
										<p className="text-sm text-gray-500">Uploading...</p>
									</div>
								</div>
								{uploadProgress === 100 && <CheckCircle2 className="h-5 w-5 text-green-500" />}
							</div>

							<div className="w-full bg-gray-200 rounded-full h-2.5">
								<div
									className="bg-[#8B5CF6] h-2.5 rounded-full transition-all duration-300"
									style={{ width: `${uploadProgress}%` }}
								></div>
							</div>

							<p className="text-sm text-gray-500 text-right">{uploadProgress < 100 ? "Processing..." : "Complete!"}</p>
						</div>
					)}

					{/* CSV format information */}
					<div className="bg-blue-50 p-4 rounded-lg">
						<h4 className="font-medium text-blue-800 mb-2">CSV Format Requirements</h4>
						<p className="text-sm text-blue-700 mb-2">Your CSV file should include the following columns:</p>
						<ul className="text-xs text-blue-700 list-disc pl-5 space-y-1">
							<li>first_name (required)</li>
							<li>last_name (required)</li>
							<li>email (required)</li>
							<li>phone_number</li>
							<li>company</li>
							<li>job_title</li>
							<li>address_line_1</li>
							<li>address_line_2</li>
							<li>city</li>
							<li>state</li>
							<li>zipcode</li>
							<li>country</li>
						</ul>

						<div className="mt-3 flex justify-center">
							<Link
								href="/contact_import_template.csv"
								download
								className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
							>
								<Download className="h-4 w-4 mr-1" />
								Download Template
							</Link>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						className="border-gray-300 text-gray-700 hover:bg-gray-50"
						disabled={isUploading}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleImport}
						className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
						disabled={!file || isUploading}
					>
						{isUploading ? "Importing..." : "Import Contacts"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
