'use client';

interface CVData {
  name: string;
  phone: string;
  email: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  address: string;
  postalCode?: string;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  summary: string;
  profileImage: string;
  workExperience: Array<{
    title: string;
    years: string;
    responsibilities: string[];
  }>;
  education: Array<{
    level: string;
    details?: string;
  }>;
  languages: string[];
  technicalSkills: string[];
  familyDetails: Array<{
    relation: string;
    name: string;
  }>;
}

export default function Template1({ data }: { data?: Partial<CVData> }) {
  const cvData: CVData = {
    name: data?.name || 'RUPAK KUMAR RAI',
    phone: data?.phone || '+977 9851136175',
    email: data?.email || 'ramkumarbasnet31@gmail.com',
    fullName: data?.fullName || 'Rupak Kumar Rai',
    dateOfBirth: data?.dateOfBirth || '04 July 1996',
    gender: data?.gender || 'Male',
    maritalStatus: data?.maritalStatus || 'Married',
    nationality: data?.nationality || 'Nepali',
    address: data?.address || 'Hariharpurgadhi Rural Municipality-5, Sindhuli, Bagmati Province, Nepal',
    postalCode: data?.postalCode || '09092256',
    passportNumber: data?.passportNumber || '09092256',
    passportIssueDate: data?.passportIssueDate || '17 August 2015',
    passportExpiryDate: data?.passportExpiryDate || '16 August 2025',
    profileImage: data?.profileImage || '/aaditya.png',
    summary: data?.summary || 'Dedicated and hardworking Housekeeping professional with 5 years of experience in maintaining cleanliness, hygiene, and order in hotels and residential facilities. Skilled in room cleaning, linen management, sanitation, and guest services. Known for attention to detail, teamwork, and ability to work efficiently under pressure. Committed to delivering high-quality service and ensuring a safe and comfortable environment for guests. Seeking a challenging position in housekeeping to contribute skills and experience in a professional setting.',
    workExperience: data?.workExperience || [
      {
        title: 'Housekeeping Staff',
        years: '5 Years',
        responsibilities: [
          'Cleaning and maintaining guest rooms, bathrooms, corridors, and public areas.',
          'Changing bed linens, towels, and restocking room supplies.',
          'Ensuring cleanliness and hygiene according to hotel standards.',
          'Reporting maintenance problems to the supervisor.',
          'Providing friendly service and assistance to guests when required.',
          'Working with the housekeeping team to maintain a safe and clean environment.',
          'Conducting inventory checks for cleaning supplies and equipment.',
          'Training and guiding new housekeeping staff on standard procedures.',
          'Assisting in preparing rooms for VIP guests and special events.'
        ]
      }
    ],
    education: data?.education || [
      {
        level: 'Grade 10 (Running)',
        details: ''
      }
    ],
    languages: data?.languages || ['Nepali', 'English', 'Hindi'],
    technicalSkills: data?.technicalSkills || [
      'Housekeeping and Cleaning Management',
      'Room Cleaning and Maintenance',
      'Bed Making and Linen Changing',
      'Bathroom Cleaning and Sanitization',
      'Knowledge of Cleaning Chemicals and equipment',
      'Time Management',
      'Team Work and Cooperation',
      'Hardworking and Honest',
      'Good Physical Fitness'
    ],
    familyDetails: data?.familyDetails || [
      { relation: "Father's Name", name: 'Ram Bahadur Rai' },
      { relation: "Mother's Name", name: 'Sukh Maya Rai' },
      { relation: 'Spouse', name: 'Sarina Rai' }
    ]
  };

  return (
    <div className="w-full bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg">
        {/* Europass Logo Header */}
        <div className="flex items-center justify-end gap-3 px-8 py-3 bg-white border-b border-gray-200">
          <img src="/europas.png" alt="Europass Logo" className="h-6" />
          <span className="text-purple-800 font-semibold text-lg">europass</span>
        </div>

        {/* Header with Europass Stripe */}
        <div className="bg-gradient-to-r from-yellow-700 to-yellow-600 h-6"></div>

        <div className="flex">
          {/* Left Column - Blue Section */}
          <div className="w-1/3 bg-blue-900 text-white p-8">
            {/* Profile Image */}
            <div className="mb-6 flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white">
                <img
                  src={cvData.profileImage}
                  alt={cvData.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Name */}
            <h1 className="text-2xl font-bold text-center mb-8 pb-4 border-b-2 border-blue-700">
              {cvData.name}
            </h1>

            {/* Contact Section */}
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-700">
                Contact
              </h2>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-sm">📞</span>
                  <span>{cvData.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">✉️</span>
                  <span className="break-all">{cvData.email}</span>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-700">
                Personal Details
              </h2>
              <div className="space-y-1 text-xs leading-relaxed">
                <div>
                  <span className="font-semibold">Full Name:</span> {cvData.fullName}
                </div>
                <div>
                  <span className="font-semibold">Date of Birth:</span> {cvData.dateOfBirth}
                </div>
                <div>
                  <span className="font-semibold">Gender:</span> {cvData.gender}
                </div>
                <div>
                  <span className="font-semibold">Marital Status:</span> {cvData.maritalStatus}
                </div>
                <div>
                  <span className="font-semibold">Nationality:</span> {cvData.nationality}
                </div>
                <div>
                  <span className="font-semibold">Permanent Address:</span> {cvData.address}
                </div>
              </div>
            </div>

            {/* Passport Details */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 pb-2 border-b border-blue-700">Passport Details</h3>
              <div className="space-y-1 text-xs mt-2">
                <div>
                  <span className="font-semibold">Passport Number:</span> {cvData.passportNumber}
                </div>
                <div>
                  <span className="font-semibold">Date of Issue:</span> {cvData.passportIssueDate}
                </div>
                <div>
                  <span className="font-semibold">Date of Expiry:</span> {cvData.passportExpiryDate}
                </div>
              </div>
            </div>

            {/* Technical Skills */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-700">
                Technical Skills
              </h2>
              <ul className="space-y-1 text-xs">
                {cvData.technicalSkills.map((skill, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - White Section */}
          <div className="w-2/3 p-8">
            {/* Summary Section */}
            <section className="mb-6">
              <h2 className="text-lg font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-900">
                Summary
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed text-justify">
                {cvData.summary}
              </p>
            </section>

            {/* Work Experience Section */}
            <section className="mb-6">
              <h2 className="text-lg font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-900">
                Work Experience
              </h2>
              {cvData.workExperience.map((job, index) => (
                <div key={index} className="mb-4">
                  <h3 className="font-bold text-sm text-gray-800">{job.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    <span className="font-semibold">Experience:</span> {job.years}
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Responsibilities:</p>
                  <ul className="space-y-1">
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-gray-700">
                        <span className="text-blue-900">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            {/* Education Section */}
            <section className="mb-6">
              <h2 className="text-lg font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-900">
                Education
              </h2>
              {cvData.education.map((edu, index) => (
                <div key={index} className="mb-2">
                  <h3 className="font-bold text-sm text-gray-800">{edu.level}</h3>
                  {edu.details && <p className="text-xs text-gray-700">{edu.details}</p>}
                </div>
              ))}
            </section>

            {/* Language Section */}
            <section className="mb-6">
              <h2 className="text-lg font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-900">
                Language
              </h2>
              <ul className="space-y-1">
                {cvData.languages.map((lang, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-900">•</span>
                    <span>{lang}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Family Details Section */}
            <section>
              <h2 className="text-lg font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-900">
                Family Details
              </h2>
              <ul className="space-y-1">
                {cvData.familyDetails.map((detail, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    <span className="font-semibold">{detail.relation}:</span> {detail.name}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Footer Stripe */}
        <div className="bg-gradient-to-r from-yellow-700 to-yellow-600 h-6"></div>
      </div>
    </div>
  );
}
