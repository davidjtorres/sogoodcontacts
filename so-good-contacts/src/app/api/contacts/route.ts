import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";
import { NextResponse } from "next/server";

const authUser = {
	id: "67cf575d562cd26f0c2ffe49",
	name: "John Doe",
	email: "john.doe@example.com",
	constant_contact_token:
		"eyJraWQiOiJqRFZQN1F2eHdsaXdZV09sWFpVUDBOUlQ3aml6dlZQaXBwVWRUcFJselZZIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULnNhOFZ1X0Q4XzQ4UF8tb3U2MU44TWU3NmRjQnM0N0RrVm85d3FxSWpTdk0ub2FyMW1nMGQ0aUhFR2lCOEQwaDciLCJpc3MiOiJodHRwczovL2lkZW50aXR5LmNvbnN0YW50Y29udGFjdC5jb20vb2F1dGgyL2F1czFsbTNyeTltRjd4MkphMGg4IiwiYXVkIjoiaHR0cHM6Ly9hcGkuY2MuZW1haWwvdjMiLCJpYXQiOjE3NDE5NjA3ODEsImV4cCI6MTc0MjA0NzE4MSwiY2lkIjoiMTNjM2Y2ZTMtZjE0Yy00MGQ2LTgyOWEtYjhjMWZlMjgyZGVlIiwidWlkIjoiMDB1MjFpZ3FiNmtUQTd1NkowaDgiLCJzY3AiOlsib2ZmbGluZV9hY2Nlc3MiLCJjb250YWN0X2RhdGEiXSwiYXV0aF90aW1lIjoxNzQxOTYwNzQ4LCJzdWIiOiJkYXZpZGpfdG9ycmVzQG91dGxvb2suY29tIiwicGxhdGZvcm1fdXNlcl9pZCI6IjhhY2NmMDBmLWYzODQtNGQ5Ni1iNGIyLWJkMTE0OTA4MWY2YiJ9.ggVkr0Ehc8uZPBYUolODjFiKtZdANkTLmH1gOtw6e7tz_F1SD18dcQtJFJUHezeRuNrd4maFuJIgj7WjpeBNPlKsgZNI1yAg2wSnhK7v5pRgok6RG5vRfn4fg7FGRfWtBjYIFAXJ2tGvG2TBiG2qoXaWTTw4rnj_H5LvIGkVWPG9oY6cOGsGTRf-Hg1FjVoltjANXo7xU1qDMKplXZbOv1ZMK_zPDuYCo5lqqG0FnuBu7N5QFACrzvy77ZxnItaFg4NaCa2IBgj_e4zUptMPMceMZ-70bQnsrsRjD6KrV547c2pKqTAAgoP5rKYEK9Gu5QwrRM8BQypvJC7cTATkKg",
};

export async function GET() {
	try {
		const container = await getContainer(authUser);
		const contactsService = container.get(ContactsService);
		const contacts = await contactsService.getContactsFromConstantContact();
		return NextResponse.json(contacts);
	} catch (error) {
		console.error("Error fetching contacts:", error);
		return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	const container = await getContainer(authUser);
	const contactsService = container.get(ContactsService);
	const contact = (await request.json())["contact"];
	const newContact = await contactsService.createContact(contact);
	return NextResponse.json(newContact);
}
