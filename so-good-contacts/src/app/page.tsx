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
				<Button className="bg-white text-gray-900 border-2 border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-colors">
					<Download className="mr-2 h-4 w-4 text-gray-900 group-hover:text-white" />
					Export
				</Button>
				<Button className="bg-white text-gray-900 border-2 border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-colors">
					<RefreshCw className="mr-2 h-4 w-4 text-gray-900 group-hover:text-white" />
					Sync Constant Contact
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
