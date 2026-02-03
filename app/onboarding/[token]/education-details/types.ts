export type MappingRow = {
  mapping_uuid: string;
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
  file_path: string;
  status: string;
};

export type CommonForm = {
  institution_name: string;
  specialization: string;
  year_of_passing: string;
  percentage_cgpa: string;
};

export type Education = {
  education_name: string;
  institution_name: string;
  specialization: string;
  year_of_passing: string;
  percentage_cgpa: string;
  documents: {
    document_name: string;
    file_path?: string;
  }[];
};
