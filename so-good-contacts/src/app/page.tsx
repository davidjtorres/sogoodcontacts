"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload, RefreshCw, MoreVertical, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Contact } from "./api/models/contact";
import AddContactModal from "@/components/AddContactModal";
import ImportContactsModal from "@/components/ImportContactsModal";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";

export default function Home() {
	const [searchQuery, setSearchQuery] = useState("");
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	//fetch contacts from API with cursor pagination
	const fetchContacts = async (cursor?: string, append: boolean = false) => {
		try {
			setIsLoading(true);

			// Build URL with cursor pagination parameters
			const url = new URL("/api/contacts", window.location.origin);
			url.searchParams.append("useCursor", "true");
			url.searchParams.append("limit", "20");

			if (cursor) {
				url.searchParams.append("cursor", cursor);
			}

			const response = await fetch(url.toString());
			const data = await response.json();

			if (data.contacts) {
				if (append) {
					setContacts((prev) => [...prev, ...data.contacts]);
				} else {
					setContacts(data.contacts);
				}
				setNextCursor(data.nextCursor);
				setHasMore(!!data.nextCursor);
			} else {
				// Handle legacy API response format
				setContacts(data);
			}
		} catch (error) {
			console.error("Error fetching contacts:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchContacts();
	}, []);

	const handleAddContact = (newContact: Contact) => {
		setContacts((prev) => [newContact, ...prev]);
	};

	const handleImportComplete = (count: number) => {
		// Refresh the contacts list
		fetchContacts();
		
		// Show a toast notification
		toast({
			title: "Import successful",
			description: `${count} contacts have been imported.`,
		});
	};

	const handleLoadMore = () => {
		if (nextCursor) {
			fetchContacts(nextCursor, true);
		}
	};

	const filteredContacts = contacts.filter((contact) => {
		const searchTerm = searchQuery.toLowerCase();
		return (
			contact.first_name.toLowerCase().includes(searchTerm) ||
			contact.last_name.toLowerCase().includes(searchTerm) ||
			contact.email.toLowerCase().includes(searchTerm)
		);
	});

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
				<h2 className="text-xl font-medium text-gray-900 mb-4">Contact List</h2>

				{/* Search Bar */}
				<div className="mb-6">
					<Input
						type="text"
						placeholder="Search contacts..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="max-w-full bg-white border-2 border-[#8B5CF6] focus-visible:ring-[#8B5CF6] text-gray-900 placeholder:text-gray-500"
					/>
				</div>

				{/* Loading State */}
				{isLoading && contacts.length === 0 ? (
					<div className="flex justify-center items-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B5CF6]"></div>
					</div>
				) : (
					<>
						{/* Contacts */}
						<div className="space-y-2">
							{filteredContacts.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-gray-500">No contacts found. Try adjusting your search or add a new contact.</p>
								</div>
							) : (
								filteredContacts.map((contact, index) => (
									<div
										key={contact.id || index}
										className="py-2 px-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors flex justify-between items-center"
									>
										<div className="flex items-center gap-6">
											<h3 className="font-medium text-gray-900 w-32">
												{contact.first_name} {contact.last_name}
											</h3>
											<div className="text-sm text-gray-500 flex gap-6">
												<span className="flex items-center">
													<span className="mr-1">✉</span>
													{contact.email}
												</span>
												{contact.phone_number && (
													<span className="flex items-center">
														<span className="mr-1">📞</span>
														{contact.phone_number}
													</span>
												)}
												{contact.address && (
													<span className="flex items-center">
														<span className="mr-1">📍</span>
														{contact.address?.address_line_1}
														{contact.address?.city && `, ${contact.address.city}`}
														{contact.address?.state && `, ${contact.address.state}`}
														{contact.address?.zipcode && contact.address.zipcode}
													</span>
												)}
											</div>
										</div>
										<Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#8B5CF6]">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</div>
								))
							)}
						</div>

						{/* Load More Button */}
						{hasMore && (
							<div className="mt-6 flex justify-center">
								<Button
									onClick={handleLoadMore}
									variant="outline"
									className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white"
								>
									Load More
								</Button>
							</div>
						)}
					</>
				)}
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
