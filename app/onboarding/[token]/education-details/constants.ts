export const EDUCATION_HIERARCHY = [
  "SSC",
  "INTERMEDIATE",
  "BACHELORS",
  "UNDER GRADUATE",
  "POST GRADUATE",
];

// Expected duration (in years) for each education level
export const EDUCATION_DURATION: Record<string, number> = {
  // Secondary (1 year)
  "SSC": 1,
  "SECONDARY": 1,
  "SECONDARY SCHOOL": 1,
  "SECONDARYSCHOOL": 1,

  // Intermediate (2 years)
  "INTERMEDIATE": 2,
  "Intermediate": 2,
  "HIGHER SECONDARY": 2,
  "HIGHERSECONDARY": 2,
  "SENIOR SECONDARY": 2,
  "SENIORSECONDARY": 2,
  "HSC": 2,
  "PLUS TWO": 2,
  "PLUSTWO": 2,
  "Higher Secondary Education": 2,
  "HIGHER SECONDARY EDUCATION": 2,
  "HIGHERSECONDARYEDUCATION": 2,

  // Diploma (3 years)
  "DIPLOMA": 3,

  // Bachelors (4 years)
  "BACHELORS": 4,
  "UNDERGRADUATE": 4,
  "UNDER GRADUATE": 4,
  "UNDERGRADUAT": 4,
  "B.TECH": 4,
  "BA": 4,
  "B.SC": 4,
  "B.COM": 4,
  "BTECH": 4,

  // Postgraduate (2 years)
  "POSTGRADUATE": 2,
  "POST GRADUATE": 2,
  "POSTGRADUAT": 2,
  "MASTERS": 2,
  "M.TECH": 2,
  "MA": 2,
  "M.SC": 2,
  "M.COM": 2,
  "MBA": 2,
  "MTECH": 2,
};
