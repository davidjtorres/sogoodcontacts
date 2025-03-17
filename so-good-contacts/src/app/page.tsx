"use client";

import { Button } from "@/components/ui/button";
import { Download, Upload, RefreshCw, UserPlus } from "lucide-react";
import { useState } from "react";
import AddContactModal from "@/components/AddContactModal";
import ImportContactsModal from "@/components/ImportContactsModal";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { ContactsPagination } from "@/components/ContactsPagination";

export default function Home() {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);

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
			// Show success message with the number of contacts synced
			toast({
				title: "Sync successful",
				description: `${result.count} contacts have been synced from Constant Contact.`,
			});
			// Refresh the contacts list
			// This will trigger automatically if using a global state management or SWR/React Query
			// For now, we can trigger a page refresh
			window.location.reload();
		} catch (error) {
			console.error("Error syncing contacts:", error);
			// Show error message
			toast({
				title: "Sync failed",
				description: error instanceof Error ? error.message : "Failed to sync contacts. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSyncing(false);
		}
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
					onClick={() => setIsAddModalOpen(true)}
				>
					<UserPlus className="mr-2 h-4 w-4 text-gray-900 group-hover:text-white" />
					Add Contact
				</Button>
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
					<RefreshCw className={`mr-2 h-4 w-4 text-gray-900 group-hover:text-white ${isSyncing ? "animate-spin" : ""}`} />
					{isSyncing ? "Syncing..." : "Sync Constant Contact"}
				</Button>
			</div>

			{/* Contact List Section */}
			<div className="container mx-auto px-4">
				{/* Use the ContactsPagination component */}
				<ContactsPagination />
			</div>

			{/* Add Contact Modal */}
			<AddContactModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onContactAdded={handleAddContact}
			/>

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
