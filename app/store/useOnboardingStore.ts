import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ===================== TYPES ===================== */

export interface PersonalDetails {
  user_uuid: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  blood_group: string;
  nationality_country_uuid: string;
  residence_country_uuid: string;
  emergency_country_uuid: string;
  emergency_contact: string;
}


export interface AddressDetails {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface EducationDetails {
  degree: string;
  institution: string;
  year_of_passing: string;
}

export interface ExperienceDetails {
  company_name: string;
  role_title: string;
  start_date: string;
  end_date?: string;
}

export interface IdentityDocument {
  identity_type_uuid: string;
  identity_file_number: string;
  identity_type_name: string;
  file: File;
}

export interface IdentityDetails {
  country_uuid: string;
  documents: IdentityDocument[];
}


/* ===================== STORE TYPE ===================== */

interface OnboardingState {
  personal: Partial<PersonalDetails>;
  address: Partial<AddressDetails>;
  identity: Partial<IdentityDetails>;
  education: EducationDetails[];
  experience: ExperienceDetails[];
  isSubmitted: boolean;

  setPersonal: (data: Partial<PersonalDetails>) => void;
  setAddress: (data: Partial<AddressDetails>) => void;
  setIdentity: (data: Partial<IdentityDetails>) => void;
  setEducation: (data: EducationDetails[]) => void;
  setExperience: (data: ExperienceDetails[]) => void;

  submit: () => void;
  reset: () => void;
}

/* ===================== STORE ===================== */

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      personal: {},
      address: {},
      identity: {},
      education: [],
      experience: [],
      isSubmitted: false,

      setPersonal: (data) => set({ personal: data }),
      setAddress: (data) => set({ address: data }),
      setIdentity: (data) => set({ identity: data }),
      setEducation: (data) => set({ education: data }),
      setExperience: (data) => set({ experience: data }),

      submit: () => set({ isSubmitted: true }),

      reset: () =>
        set({
          personal: {},
          address: {},
          identity: {},
          education: [],
          experience: [],
          isSubmitted: false,
        }),
    }),
    {
      name: "onboarding-draft",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
