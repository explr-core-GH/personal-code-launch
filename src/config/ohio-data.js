// Ohio reference data for the Pathway Analyzer
// Update this file when Ohio DEW changes standards, or to add partner institutions.

export const OHIO_DATA = {
  creditRequirements: {
    english: 4,
    math: 4,
    science: 3,
    socialStudies: 3,
    health: 0.5,
    physicalEducation: 0.5,
    fineArts: 1, // two semesters, waived for CTE pathway students
    financialLiteracy: 0.5, // class of 2026+
    electives: 5,
    total: 20,
  },

  careerClusters: [
    "Agriculture, Food & Natural Resources",
    "Architecture & Construction",
    "Arts, A/V Technology & Communications",
    "Business Management & Administration",
    "Education & Training",
    "Finance",
    "Government & Public Administration",
    "Health Science",
    "Hospitality & Tourism",
    "Human Services",
    "Information Technology",
    "Law, Public Safety, Corrections & Security",
    "Manufacturing",
    "Marketing",
    "Science, Technology, Engineering & Mathematics",
    "Transportation, Distribution & Logistics",
  ],

  stateDefinedSeals: [
    "OhioMeansJobs-Readiness Seal",
    "Industry-Recognized Credential Seal",
    "College-Ready Seal",
    "Military Enlistment Seal",
    "Citizenship Seal",
    "Science Seal",
    "Honors Diploma Seal",
    "Seal of Biliteracy",
    "Technology Seal",
  ],

  locallyDefinedSeals: [
    "Student Engagement Seal",
    "Community Service Seal",
    "Fine and Performing Arts Seal",
  ],

  omjReadinessSkills: [
    "Drug-Free Pledge",
    "Self-Awareness & Self-Management",
    "Responsibility",
    "Work Ethic",
    "Punctuality",
    "Time Management",
    "Teamwork & Collaboration",
    "Diversity Awareness",
    "Communication (Listening, Speaking, Writing)",
    "Digital Technology",
    "Critical Thinking & Problem Solving",
    "Creativity",
    "Leadership",
    "Global & Cultural Awareness",
    "Career Exploration (Planning & Management)",
  ],

  // EXPLR's primary college pipeline institutions.
  // Add more partner schools here as EXPLR expands.
  partnerInstitutions: {
    csu: {
      name: "Cleveland State University (CSU)",
      shortName: "CSU",
      type: "4-year public research university",
      notableColleges: [
        "Washkewicz College of Engineering (mechanical, electrical, civil, computer, chemical, biomedical)",
        "Monte Ahuja College of Business (finance, marketing, management, supply chain)",
        "College of Sciences & Health Professions (biology, nursing, psychology, computer science, data science)",
        "Levin College of Public Affairs & Education (urban affairs, social work, teacher prep)",
        "College of Arts & Sciences",
        "College of Health (nursing, health sciences, speech)",
        "Cleveland-Marshall College of Law (graduate)",
      ],
      notablePrograms: [
        "Computer Science & Data Science",
        "Engineering (mechanical, electrical, civil, biomedical)",
        "Nursing (BSN and accelerated)",
        "Urban Studies / Urban Planning",
        "Teacher Education (Cleveland Teacher Residency)",
        "Business Analytics / Supply Chain",
      ],
      dualEnrollment:
        "CCP (College Credit Plus) available; CSU is a major CCP partner for Cleveland-area high schools",
    },
    tric: {
      name: "Cuyahoga Community College (Tri-C)",
      shortName: "Tri-C",
      type: "2-year community college with 4 campuses (Metro, Western, Eastern, Westshore) + multiple locations",
      notableColleges: [
        "Center for Manufacturing / Advanced Manufacturing Technology (MAGNET partnership)",
        "Health Careers & Nursing (RN, CNA, surgical tech, medical assisting, phlebotomy)",
        "Information Technology (cybersecurity, software development, network admin)",
        "Public Safety Institute (police, fire, EMS)",
        "Hospitality Management Center of Excellence",
        "Creative Arts Academy",
        "Automotive Technology",
      ],
      notablePrograms: [
        "Associate of Applied Science in Manufacturing Engineering Technology",
        "Associate of Applied Science in Nursing (ADN)",
        "Associate in Cybersecurity / IT",
        "Short-term certificates: Welding, CNC, Mechatronics, HVAC, Phlebotomy",
        "Right Skills Now (accelerated manufacturing, partnered with MAGNET)",
        "Early College programs with Cleveland-area high schools",
      ],
      dualEnrollment: "CCP partner with most Cleveland-area districts; strong CTAG articulation for CTE students",
      transferToCsu:
        "Formal 2+2 transfer agreements with CSU for many majors (engineering tech, business, nursing pre-licensure, etc.)",
    },
  },
};
