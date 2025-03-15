'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Contact } from '@/app/api/models/contact';
import { toast } from '@/components/ui/use-toast';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: (contact: Contact) => void;
}

export default function AddContactModal({ isOpen, onClose, onContactAdded }: AddContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    company: '',
    job_title: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zipcode: '',
    country: 'United States',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare contact data
      const contactData: Partial<Contact> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number || undefined,
        company: formData.company || undefined,
        job_title: formData.job_title || undefined,
        user_id: null, // This will be set by the server
        source: "so_good_contacts"
      };

      // Add address if any address field is filled
      if (formData.address_line_1 || formData.city || formData.state || formData.zipcode) {
        contactData.address = {
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2 || undefined,
          city: formData.city,
          state: formData.state,
          zipcode: formData.zipcode,
          country: formData.country
        };
      }

      // Send data to API
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact: contactData }),
      });

      if (!response.ok) {
        throw new Error('Failed to add contact');
      }

      const newContact = await response.json();
      
      // Notify parent component
      onContactAdded(newContact);
      
      // Show success message
      toast({
        title: "Contact added",
        description: `${formData.first_name} ${formData.last_name} has been added to your contacts.`,
      });
      
      // Reset form and close modal
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        company: '',
        job_title: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        zipcode: '',
        country: 'United States',
        notes: ''
      });
      onClose();
      
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Add New Contact</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-700">Personal Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm font-medium">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className="border-gray-300 focus:border-[#8B5CF6]"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm font-medium">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="border-gray-300 focus:border-[#8B5CF6]"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@example.com"
                className="border-gray-300 focus:border-[#8B5CF6]"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="(123) 456-7890"
                className="border-gray-300 focus:border-[#8B5CF6]"
              />
            </div>
          </div>
          
          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-700">Professional Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Company
                </Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Acme Inc."
                  className="border-gray-300 focus:border-[#8B5CF6]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="job_title" className="text-sm font-medium">
                  Job Title
                </Label>
                <Input
                  id="job_title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  placeholder="Software Engineer"
                  className="border-gray-300 focus:border-[#8B5CF6]"
                />
              </div>
            </div>
          </div>
          
          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-700">Address</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address_line_1" className="text-sm font-medium">
                Address Line 1
              </Label>
              <Input
                id="address_line_1"
                name="address_line_1"
                value={formData.address_line_1}
                onChange={handleChange}
                placeholder="123 Main St"
                className="border-gray-300 focus:border-[#8B5CF6]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address_line_2" className="text-sm font-medium">
                Address Line 2
              </Label>
              <Input
                id="address_line_2"
                name="address_line_2"
                value={formData.address_line_2}
                onChange={handleChange}
                placeholder="Apt 4B"
                className="border-gray-300 focus:border-[#8B5CF6]"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="San Francisco"
                  className="border-gray-300 focus:border-[#8B5CF6]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  State
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="CA"
                  className="border-gray-300 focus:border-[#8B5CF6]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipcode" className="text-sm font-medium">
                  Zip Code
                </Label>
                <Input
                  id="zipcode"
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleChange}
                  placeholder="94105"
                  className="border-gray-300 focus:border-[#8B5CF6]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium">
                  Country
                </Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="United States"
                  className="border-gray-300 focus:border-[#8B5CF6]"
                />
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional information about this contact..."
              className="min-h-[100px] border-gray-300 focus:border-[#8B5CF6]"
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 