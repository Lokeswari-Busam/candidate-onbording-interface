export type MappingRow = {
  mapping_uuid: string;
  education_uuid: string;
  education_name: string;
  document_name: string;
  is_mandatory: boolean;
};

export type UploadedDoc = {
  document_uuid: string;
  mapping_uuid: string;
  institution_name: string;
  specialization: string;
  year_of_passing: number;
  percentage_cgpa: number;
  degree_uuid?: string;
  institute_location?: string;
  education_mode?: string;
  start_year?: number;
  delay_reason?: string;
  file_path: string;
  status: string;
};

export type CommonForm = {
  institution_name: string;
  specialization: string;
  year_of_passing: string;
  percentage_cgpa: string;
  degree_uuid: string;
  institute_location: string;
  education_mode: string;
  start_year: string;
  delay_reason: string;
};

export type Education = {
  education_name: string;
  institution_name: string;
  specialization: string;
  year_of_passing: string;
  percentage_cgpa: string;
  degree_uuid?: string;
  institute_location?: string;
  education_mode?: string;
  start_year?: string;
  delay_reason?: string;
  documents: {
    document_name: string;
    file_path?: string;
  }[];
};

export type DegreeMaster = {
  degree_uuid: string;
  degree_name: string;
  education_name?: string;
  is_active: boolean;
};

export type EducationLevel = {
  education_uuid: string;
  education_name: string;
  is_active: boolean;
};
