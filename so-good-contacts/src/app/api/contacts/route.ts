import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";
import { NextResponse } from "next/server";

const authUser = {
	id: "67cf575d562cd26f0c2ffe49",
	name: "John Doe",
	email: "john.doe@example.com",
	constant_contact_token:
		"eyJraWQiOiJqRFZQN1F2eHdsaXdZV09sWFpVUDBOUlQ3aml6dlZQaXBwVWRUcFJselZZIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULnhFN0NQWW5xZ002NlFtdkdyWjFwZ2hPOVltNndfTkZnUGViZ1cyLUR1OVEub2FyMW1qc2lrd0lqZERUWkcwaDciLCJpc3MiOiJodHRwczovL2lkZW50aXR5LmNvbnN0YW50Y29udGFjdC5jb20vb2F1dGgyL2F1czFsbTNyeTltRjd4MkphMGg4IiwiYXVkIjoiaHR0cHM6Ly9hcGkuY2MuZW1haWwvdjMiLCJpYXQiOjE3NDIyMTI0MjEsImV4cCI6MTc0MjI5ODgyMSwiY2lkIjoiMTNjM2Y2ZTMtZjE0Yy00MGQ2LTgyOWEtYjhjMWZlMjgyZGVlIiwidWlkIjoiMDB1MjFpZ3FiNmtUQTd1NkowaDgiLCJzY3AiOlsib2ZmbGluZV9hY2Nlc3MiLCJjb250YWN0X2RhdGEiXSwiYXV0aF90aW1lIjoxNzQyMjEyMzg0LCJzdWIiOiJkYXZpZGpfdG9ycmVzQG91dGxvb2suY29tIiwicGxhdGZvcm1fdXNlcl9pZCI6IjhhY2NmMDBmLWYzODQtNGQ5Ni1iNGIyLWJkMTE0OTA4MWY2YiJ9.QQxC8F5gVeRIQWhqilh988Q-bd-e4EW_KuX1u4773bNpcNlmzuEPzLk70qh9B_QGkZo0xsAK6-R-o6Fry6L36bWulFfWQhwzvPF46OUqaP_09qi-VQ_pApXuXCe8FSsacYisunTKXt6DL7NvpJYgytEVetKg-ajQfcKhYOtxfip4Qqe5d-g4MWeI0XStlwfVZsyZ_5YOoQ83nuDDYdQa3zjWWHJOfAUGmZRK4Ai8rlyv3RwDx3o19BsSJVMCigCsrV70DcRZ8MaAbbO3_oTwUzjxOPnbcYPSzJDUmG-N7mxWa_62osJy9zcwXrs4IyGj11BTwmfTlo4MoBkQu70KJg",
};

export async function GET() {
	try {
		const container = await getContainer(authUser);
		const contactsService = container.get(ContactsService);
		const contacts = await contactsService.getContactsWithCursor(authUser.id);
		return NextResponse.json({
			contacts: contacts,
		});
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
