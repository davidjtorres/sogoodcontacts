import { container } from "@/inversify.config";
import { ContactRepository } from "@/repositories/contact-repository";
import { NextResponse } from "next/server";

export async function GET() {
    const contactRepository = container.get(ContactRepository);
    const contacts = await contactRepository.findAll();
    return NextResponse.json(contacts);
  }

  export async function POST(request: Request) {
    const contactRepository = container.get(ContactRepository);
    const contact = await request.json();
    const newContact = await contactRepository.create(contact);
    return NextResponse.json(newContact);
  }