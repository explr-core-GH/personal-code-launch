import { useState, useCallback } from 'react';

export interface OrganizationData {
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationWebsite: string;
  internshipAddress: string;
  interestReason: string;
  contactEmail: string;
  contactNumber: string;
  numberOfInterns: string;
}

const initialData: OrganizationData = {
  firstName: '',
  lastName: '',
  organizationName: '',
  organizationWebsite: '',
  internshipAddress: '',
  interestReason: '',
  contactEmail: '',
  contactNumber: '',
  numberOfInterns: ''
};

export function useOrganizationData() {
  const [organizationData, setOrganizationData] = useState<OrganizationData>(initialData);

  const updateField = useCallback((field: keyof OrganizationData, value: string) => {
    setOrganizationData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const isComplete = useCallback(() => {
    return (
      organizationData.firstName.trim() !== '' &&
      organizationData.lastName.trim() !== '' &&
      organizationData.organizationName.trim() !== '' &&
      organizationData.contactEmail.trim() !== ''
    );
  }, [organizationData]);

  return {
    organizationData,
    updateField,
    isComplete
  };
}
