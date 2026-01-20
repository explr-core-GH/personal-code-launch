import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OrganizationData } from '@/hooks/useOrganizationData';

interface OrganizationInfoProps {
  organizationData: OrganizationData;
  onUpdateField: (field: keyof OrganizationData, value: string) => void;
  onNext: () => void;
}

export function OrganizationInfo({ organizationData, onUpdateField, onNext }: OrganizationInfoProps) {
  return (
    <div className="fade-in w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-display">
          🏢 Organization Information
        </h2>
        <p className="text-muted-foreground">
          Tell us about your organization and internship program
        </p>
      </div>
      
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              placeholder="Enter your first name"
              value={organizationData.firstName}
              onChange={(e) => onUpdateField('firstName', e.target.value)}
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              placeholder="Enter your last name"
              value={organizationData.lastName}
              onChange={(e) => onUpdateField('lastName', e.target.value)}
            />
          </div>

          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name *</Label>
            <Input
              id="organizationName"
              placeholder="Enter your organization name"
              value={organizationData.organizationName}
              onChange={(e) => onUpdateField('organizationName', e.target.value)}
            />
          </div>

          {/* Organization Website */}
          <div className="space-y-2">
            <Label htmlFor="organizationWebsite">Organization Website (optional)</Label>
            <Input
              id="organizationWebsite"
              type="url"
              placeholder="https://www.example.com"
              value={organizationData.organizationWebsite}
              onChange={(e) => onUpdateField('organizationWebsite', e.target.value)}
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="you@organization.com"
              value={organizationData.contactEmail}
              onChange={(e) => onUpdateField('contactEmail', e.target.value)}
            />
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Phone Number</Label>
            <Input
              id="contactNumber"
              type="tel"
              placeholder="(555) 123-4567"
              value={organizationData.contactNumber}
              onChange={(e) => onUpdateField('contactNumber', e.target.value)}
            />
          </div>

          {/* Address of Internship */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="internshipAddress">Address of Internship</Label>
            <Input
              id="internshipAddress"
              placeholder="123 Main St, City, State ZIP"
              value={organizationData.internshipAddress}
              onChange={(e) => onUpdateField('internshipAddress', e.target.value)}
            />
          </div>

          {/* Number of Interns */}
          <div className="space-y-2">
            <Label htmlFor="numberOfInterns">Number of Interns to Host</Label>
            <Input
              id="numberOfInterns"
              type="number"
              min="1"
              placeholder="Enter number of interns"
              value={organizationData.numberOfInterns}
              onChange={(e) => onUpdateField('numberOfInterns', e.target.value)}
            />
          </div>

          {/* Interest Reason */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="interestReason">
              Why is your organization interested in hosting a work-based learning experience?
            </Label>
            <Textarea
              id="interestReason"
              placeholder="Share your organization's motivation for hosting interns and what you hope to achieve..."
              className="min-h-[120px]"
              value={organizationData.interestReason}
              onChange={(e) => onUpdateField('interestReason', e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button 
          onClick={onNext} 
          className="bg-accent hover:bg-emerald-hover text-accent-foreground"
          disabled={!organizationData.firstName || !organizationData.lastName || !organizationData.organizationName || !organizationData.contactEmail}
        >
          Next: Select Skills
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
