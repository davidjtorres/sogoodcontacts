"use client";

import { Button } from "@/components/ui/button";
import { Download, Upload, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import ImportContactsModal from "@/components/ImportContactsModal";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { ContactsPagination, ContactsRefreshManager } from "@/components/ContactsPagination";

export default function Home() {
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [syncJob, setSyncJob] = useState<{
		job_id: string;
		status: string;
		progress_percentage?: number;
		processed_contacts?: number;
		total_contacts?: number;
	} | null>(null);

	// Clean up any polling interval when component unmounts
	useEffect(() => {
		const intervalId: NodeJS.Timeout | null = null;

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, []);

	const handleAddContact = () => {
		// Refresh will happen automatically via the ContactsPagination component
		toast({
			title: "Contact added",
			description: "The contact has been added successfully.",
		});
	};

	const handleImportComplete = (count: number) => {
		// Show a toast notification
		toast({
			title: "Import successful",
			description: `${count} contacts have been imported.`,
		});
	};

	const handleExport = async () => {
		try {
			setIsExporting(true);
			// Start the export process
			toast({
				title: "Export started",
				description: "Preparing your contacts for download...",
			});
			// Create a direct download link to the export API
			const exportUrl = "/api/contacts/export";
			// Create a temporary anchor element to trigger the download
			const downloadLink = document.createElement("a");
			downloadLink.href = exportUrl;
			downloadLink.download = "contacts.csv";
			// Append the link to the body, click it, and then remove it
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);
			// Show success message
			toast({
				title: "Export successful",
				description: "Your contacts are being downloaded.",
			});
		} catch (error) {
			console.error("Error exporting contacts:", error);
			// Show error message
			toast({
				title: "Export failed",
				description: "Failed to export contacts. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsExporting(false);
		}
	};

	const handleSyncConstantContact = async () => {
		try {
			setIsSyncing(true);
			// Show starting sync notification
			toast({
				title: "Sync started",
				description: "Syncing contacts with Constant Contact...",
			});

			// Call the sync API endpoint
			const response = await fetch("/api/contacts/sync", {
				method: "POST",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to sync contacts");
			}

			const result = await response.json();
			const jobId = result.job_id;

			if (jobId) {
				// If we got a job ID, this is running as a background job
				toast({
					title: "Sync initiated",
					description: "Contact synchronization has started and will continue in the background.",
				});

				// Start polling for status updates
				startPollingJobStatus(jobId);
			} else {
				// For backward compatibility with direct sync
				toast({
					title: "Sync successful",
					description: `${result.count || 0} contacts have been synced from Constant Contact.`,
				});

				// Refresh the contacts programmatically
				await ContactsRefreshManager.refresh();
				setIsSyncing(false);
			}
		} catch (error) {
			console.error("Error syncing contacts:", error);
			// Show error message
			toast({
				title: "Sync failed",
				description: error instanceof Error ? error.message : "Failed to sync contacts. Please try again.",
				variant: "destructive",
			});
			setIsSyncing(false);
		}
	};

	const startPollingJobStatus = (jobId: string) => {
		let consecutiveErrors = 0;
		// Poll the job status every 2 seconds
		const intervalId = setInterval(async () => {
			try {
				const response = await fetch(`/api/contacts/sync?jobId=${jobId}`);
				if (!response.ok) {
					throw new Error("Failed to get job status");
				}

				const status = await response.json();

				// Update state with the job status
				setSyncJob(status);

				// Update sync button state
				if (status.status === "in_progress") {
					setIsSyncing(true);
				} else {
					setIsSyncing(false);
				}

				// If the job is completed or failed, stop polling and show notification
				if (status.status === "completed" || status.status === "failed") {
					clearInterval(intervalId);

					if (status.status === "completed") {
						// If completed, refresh contacts and show success message
						await ContactsRefreshManager.refresh();

						toast({
							title: "Sync completed",
							description: `${status.processed_contacts || 0} contacts have been synced from Constant Contact.`,
						});
					} else if (status.status === "failed") {
						toast({
							title: "Sync failed",
							description: status.error || "Failed to sync contacts. Please try again.",
							variant: "destructive",
						});
					}

					// Clear job status after a delay
					setTimeout(() => setSyncJob(null), 5000);
				}

				// Reset error counter on success
				consecutiveErrors = 0;
			} catch (error) {
				console.error("Error polling job status:", error);
				consecutiveErrors++;

				// Stop polling after 3 consecutive errors
				if (consecutiveErrors >= 3) {
					clearInterval(intervalId);
					setIsSyncing(false);
					toast({
						title: "Sync status unavailable",
						description: "Unable to get sync status. The sync may still be in progress.",
						variant: "destructive",
					});
				}
			}
		}, 2000);

		// Store the interval ID to clear it later if needed
		return intervalId;
	};

	return (
		<main className="min-h-screen bg-white">
			{/* Header */}
			<header className="bg-[#8B5CF6] py-4">
				<h1 className="text-white text-2xl font-semibold text-center">SoGoodContacts</h1>
			</header>

			{/* Action Buttons */}
			<div className="container mx-auto px-4 py-4 flex flex-wrap gap-2">
				<Button
					className="bg-white text-gray-900 border-2 border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-colors"
					onClick={() => setIsImportModalOpen(true)}
				>
					<Upload className="mr-2 h-4 w-4 text-gray-900 group-hover:text-white" />
					Import
				</Button>
				<Button
					className="bg-white text-gray-900 border-2 border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-colors"
					onClick={handleExport}
					disabled={isExporting}
				>
					<Download className="mr-2 h-4 w-4 text-gray-900 group-hover:text-white" />
					{isExporting ? "Exporting..." : "Export"}
				</Button>
				<Button
					className="bg-white text-gray-900 border-2 border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-colors"
					onClick={handleSyncConstantContact}
					disabled={isSyncing}
				>
					<RefreshCw
						className={`mr-2 h-4 w-4 text-gray-900 group-hover:text-white ${isSyncing ? "animate-spin" : ""}`}
					/>
					{isSyncing
						? syncJob && syncJob.total_contacts && syncJob.total_contacts > 0
							? `Syncing... ${syncJob.processed_contacts || 0}/${syncJob.total_contacts} (${
									syncJob.progress_percentage || 0
							  }%)`
							: "Syncing..."
						: "Sync Constant Contact"}
				</Button>
			</div>

			{/* Contact List Section */}
			<div className="container mx-auto px-4">
				{/* Use the ContactsPagination component */}
				<ContactsPagination />
			</div>

			{/* Import Contacts Modal */}
			<ImportContactsModal
				isOpen={isImportModalOpen}
				onClose={() => setIsImportModalOpen(false)}
				onImportComplete={handleImportComplete}
			/>

			{/* Toast Container */}
			<Toaster />
		</main>
	);
}
