"use client";

import { useState, useEffect } from "react";
import { Contact } from "@/app/api/models/contact";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

interface PaginationResponse {
	contacts: Contact[];
	totalCount: number;
	totalPages: number;
	currentPage: number;
}

export function ContactsPagination() {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [sortField, setSortField] = useState("_id");
	const [sortDirection, setSortDirection] = useState<1 | -1>(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [totalCount, setTotalCount] = useState(0);

	useEffect(() => {
		const fetchContacts = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await fetch(
					`/api/contacts?page=${currentPage}&pageSize=${pageSize}&sortField=${sortField}&sortDirection=${sortDirection}`
				);

				if (!response.ok) {
					throw new Error(`Error: ${response.status}`);
				}

				const data: PaginationResponse = await response.json();
				setContacts(data.contacts);
				setTotalPages(data.totalPages);
				setCurrentPage(data.currentPage);
				setTotalCount(data.totalCount);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
				console.error("Error fetching contacts:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchContacts();
	}, [currentPage, pageSize, sortField, sortDirection]);

	const handlePageChange = (newPage: number) => {
		setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
	};

	const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setPageSize(parseInt(e.target.value, 10));
		setCurrentPage(1); // Reset to first page when changing page size
	};

	const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSortField(e.target.value);
		setCurrentPage(1);
	};

	const handleSortDirectionChange = () => {
		setSortDirection((prev) => (prev === 1 ? -1 : 1));
		setCurrentPage(1);
	};

	// Filter contacts based on search query
	const filteredContacts = contacts.filter((contact) => {
		if (!searchQuery.trim()) return true;

		const searchTerm = searchQuery.toLowerCase();
		return (
			(contact.first_name?.toLowerCase() || "").includes(searchTerm) ||
			(contact.last_name?.toLowerCase() || "").includes(searchTerm) ||
			(contact.email?.toLowerCase() || "").includes(searchTerm) ||
			(contact.phone_number?.toLowerCase() || "").includes(searchTerm)
		);
	});

	return (
		<div className="space-y-4">
			<div>
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">Contacts</h2>
					<div className="text-sm text-gray-500">{totalCount} total contacts</div>
				</div>

				{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">{error}</div>}

				{/* Search Bar */}
				<div className="mt-4">
					<Input
						type="text"
						placeholder="Search contacts..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="max-w-full bg-white border-2 border-[#8B5CF6] focus-visible:ring-[#8B5CF6] text-gray-900 placeholder:text-gray-500"
					/>
				</div>

				<div className="flex flex-wrap gap-4 items-center mt-4">
					<div className="flex items-center gap-2">
						<span>Sort by:</span>
						<select
							value={sortField}
							onChange={handleSortFieldChange}
							className="border border-[#8B5CF6] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
						>
							<option value="_id">ID</option>
							<option value="first_name">First Name</option>
							<option value="last_name">Last Name</option>
							<option value="email">Email</option>
						</select>
						<button
							onClick={handleSortDirectionChange}
							className="px-3 py-1 border border-[#8B5CF6] rounded hover:bg-[#8B5CF6] hover:text-white transition-colors"
						>
							{sortDirection === 1 ? "↑" : "↓"}
						</button>
					</div>

					<div className="flex items-center gap-2">
						<span>Contacts per page:</span>
						<select
							value={pageSize.toString()}
							onChange={handlePageSizeChange}
							className="border border-[#8B5CF6] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
						>
							<option value="10">10</option>
							<option value="20">20</option>
							<option value="50">50</option>
							<option value="100">100</option>
						</select>
					</div>
				</div>
			</div>

			{/* Scrollable Contact List with fixed height */}
			<div className="overflow-y-scroll border rounded-md h-[400px] shadow-md">
				{/* Loading State */}
				{loading && contacts.length === 0 ? (
					<div className="flex justify-center items-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B5CF6]"></div>
					</div>
				) : (
					<>
						{/* Contacts */}
						<div className="space-y-2 p-2">
							{filteredContacts.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-gray-500">No contacts found. Try adjusting your search or add a new contact.</p>
								</div>
							) : (
								filteredContacts.map((contact, index) => (
									<div
										key={String(contact.id) || index}
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
					</>
				)}
			</div>

			{/* Pagination Controls */}
			<div className="flex items-center justify-between">
				<div className="text-sm text-gray-500">
					Page {currentPage} of {totalPages} • Showing {filteredContacts.length} of {totalCount} contacts
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => handlePageChange(1)}
						disabled={currentPage === 1 || loading}
						className="px-3 py-1 border border-[#8B5CF6] rounded disabled:opacity-50 hover:bg-[#8B5CF6] hover:text-white transition-colors"
					>
						First
					</button>
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1 || loading}
						className="px-3 py-1 border border-[#8B5CF6] rounded disabled:opacity-50 hover:bg-[#8B5CF6] hover:text-white transition-colors"
					>
						Previous
					</button>
					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages || loading}
						className="px-3 py-1 border border-[#8B5CF6] rounded disabled:opacity-50 hover:bg-[#8B5CF6] hover:text-white transition-colors"
					>
						Next
					</button>
					<button
						onClick={() => handlePageChange(totalPages)}
						disabled={currentPage === totalPages || loading}
						className="px-3 py-1 border border-[#8B5CF6] rounded disabled:opacity-50 hover:bg-[#8B5CF6] hover:text-white transition-colors"
					>
						Last
					</button>
				</div>
			</div>
		</div>
	);
}
