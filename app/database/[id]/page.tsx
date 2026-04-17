'use client';

import { useState, use, useEffect } from 'react';
import { ChevronLeft, Image, FileText, Briefcase, Settings, Mail, Phone, MapPin, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { DashboardShell } from '@/app/components/dashboard-shell';

const TABS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'informations', label: 'Informations', icon: FileText },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Static sample client data
const SAMPLE_CLIENT = {
  name: 'Aaditya Chaudhary',
  fullName: 'Aaditya Chaudhary',
  email: 'aadi14ry@gmail.com',
  phone: '9864062605',
  contactNumber: '+9779864062605',
  address: 'Bara',
  companyName: 'Websurfer',
  projectDetails: 'sdewfbeswkfbjewkfkewjfewbk',
  fatherName: 'Rajindra Chaudhary',
  motherName: 'Surswati devi Chaudhary',
  firstName: 'Aaditya',
  middleName: 'Kumar',
  lastName: 'Chaudhary',
  password: 'Nepal@1234',
  service: 'Visa Preparation',
  profileStatus: 'In Progress',
  paymentStatus: 'Done',
  applied: 'Yes',
  // Additional English Fields
  dateOfBirth: '1995-05-15',
  gender: 'Male',
  nationality: 'Nepali',
  bloodType: 'O+',
  maritalStatus: 'Single',
  educationalQualification: 'Bachelor of Technology',
  college: 'Institute of Engineering, Tribhuvan University',
  passingYear: '2018',
  gpaPercentage: '3.5/4.0',
  workExperience: '5 years',
  workingOrganization: 'Websurfer IT Solutions',
  position: 'Senior Software Engineer',
  salary: '150,000 NPR',
  skills: 'React, Next.js, TypeScript, Tailwind CSS',
  languagesKnown: 'English, Nepali, Hindi',
  references: 'Manager at Websurfer',
  citizenshipNumber: '05-999-123456',
  permanentAddress: 'Kathmandu, Nepal',
  temporaryAddress: 'Lalitpur, Nepal',
  emergencyContact: '+977-9841234567',
  postingPreference: 'Kathmandu or Lalitpur',
  healthStatus: 'Excellent',
  // Additional Nepali Fields
  पहिलो_नाम: 'आदित्य',
  बीचको_नाम: 'कुमार',
  थर: 'चौधरी',
  ईमेल_नेपाली: 'aadi14ry@gmail.com',
  मोबाइल_नम्बर_नेपाली: '9864062605',
  जन्म_मिति: '२०५२-०२-०२',
  लिङ्ग: 'पुरुष',
  नागरिकता: 'नेपाली',
  रक्त_समुह: 'ओ+',
  वैवाहिक_स्थिति: 'अविवाहित',
  शैक्षिक_योग्यता: 'प्रविधि स्नातक',
  कलेज: 'इञ्जिनियरिङ् संस्थान, त्रिभुवन विश्वविद्यालय',
  उत्तीर्ण_वर्ष: '२०७५',
  जीपीए_प्रतिशत: '३.५/४.०',
  कार्य_अनुभव: '५ वर्ष',
  कार्यरत_संस्था: 'Websurfer आईटी समाधान',
  पद: 'वरिष्ठ सफ्टवेयर इञ्जिनियर',
  तनख्वाह: '१,५०,००० रुपेया',
  कौशल: 'React, Next.js, TypeScript, Tailwind CSS',
  ज्ञात_भाषा: 'अंग्रेजी, नेपाली, हिन्दी',
  संदर्भ: 'Websurfer मा प्रबन्धक',
  नागरिकता_नम्बर: '०५-९९९-१२३४५६',
  स्थायी_ठेगाना: 'काठमाडौं, नेपाल',
  अस्थायी_ठेगाना: 'ललितपुर, नेपाल',
  आपतकालीन_सम्पर्क: '+९७७-९८४१२३४५६७',
  पदको_वरीयता: 'काठमाडौं वा ललितपुर',
  स्वास्थ्य_स्थिति: 'उत्कृष्ट',
};

export default function DatabaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTabState] = useState('all');
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load tab from localStorage and persist on change
  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
      setActiveTabState(savedTab);
    }
  }, []);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('activeTab', tab);
  };
  
  // State for image sections
  const [imageSections, setImageSections] = useState({
    slc: ['/clientimages/image.png'],
    plus2: ['/clientimages/image1.png', '/clientimages/image2.png'],
    master: ['/clientimages/image3.jpg'],
    certification: ['/clientimages/image4.jpeg'],
    experience: ['/clientimages/image5.jpg'],
    other: ['/clientimages/image6.jpg'],
  });

  const handleImageDrop = (section: keyof typeof imageSections, image: string) => {
    if (!draggedImage) return;
    
    setImageSections(prevSections => {
      const newSections = { ...prevSections };
      
      // Find and remove from old section
      for (const key in newSections) {
        const sectionKey = key as keyof typeof imageSections;
        if (newSections[sectionKey].includes(draggedImage)) {
          newSections[sectionKey] = newSections[sectionKey].filter(img => img !== draggedImage);
          break;
        }
      }
      
      // Add to new section if not already there
      if (!newSections[section].includes(draggedImage)) {
        newSections[section] = [...newSections[section], draggedImage];
      }
      
      return newSections;
    });
    
    setDraggedImage(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InfoCard 
                title="Client Information" 
                content={`${SAMPLE_CLIENT.name} from ${SAMPLE_CLIENT.address} is seeking ${SAMPLE_CLIENT.service} services.`} 
              />
              <InfoCard 
                title="Status Summary" 
                content={`Profile: ${SAMPLE_CLIENT.profileStatus} • Payment: ${SAMPLE_CLIENT.paymentStatus} • Applied: ${SAMPLE_CLIENT.applied}`} 
              />
            </div>
          </div>
        );
      case 'images':
        return (
          <div className="border border-nova-cyan/30 rounded-lg overflow-hidden">
            {/* Section 1: SLC Documents */}
            <DocumentSection 
              title="SLC DOCUMENTS" 
              images={imageSections.slc} 
              isFirst={true} 
              isLast={false}
              sectionKey="slc"
              draggedImage={draggedImage}
              setDraggedImage={setDraggedImage}
              onDrop={handleImageDrop}
            />
            
            {/* Section 2: +2 Documents */}
            <DocumentSection 
              title="+2 DOCUMENTS" 
              images={imageSections.plus2} 
              isFirst={false} 
              isLast={false}
              sectionKey="plus2"
              draggedImage={draggedImage}
              setDraggedImage={setDraggedImage}
              onDrop={handleImageDrop}
            />
            
            {/* Section 3: Master Documents */}
            <DocumentSection 
              title="MASTER DOCUMENTS" 
              images={imageSections.master} 
              isFirst={false} 
              isLast={false}
              sectionKey="master"
              draggedImage={draggedImage}
              setDraggedImage={setDraggedImage}
              onDrop={handleImageDrop}
            />
            
            {/* Section 4: Certification Documents */}
            <DocumentSection 
              title="CERTIFICATION DOCUMENTS" 
              images={imageSections.certification} 
              isFirst={false} 
              isLast={false}
              sectionKey="certification"
              draggedImage={draggedImage}
              setDraggedImage={setDraggedImage}
              onDrop={handleImageDrop}
            />
            
            {/* Section 5: Experience Documents */}
            <DocumentSection 
              title="EXPERIENCE DOCUMENTS" 
              images={imageSections.experience} 
              isFirst={false} 
              isLast={false}
              sectionKey="experience"
              draggedImage={draggedImage}
              setDraggedImage={setDraggedImage}
              onDrop={handleImageDrop}
            />
            
            {/* Section 6: Other Documents */}
            <DocumentSection 
              title="OTHER DOCUMENTS" 
              images={imageSections.other} 
              isFirst={false} 
              isLast={true}
              sectionKey="other"
              draggedImage={draggedImage}
              setDraggedImage={setDraggedImage}
              onDrop={handleImageDrop}
            />
          </div>
        );
      case 'informations':
        const infoFields = [
          { label: 'Name', value: SAMPLE_CLIENT.name },
          { label: 'Full Name', value: SAMPLE_CLIENT.fullName },
          { label: 'First Name', value: SAMPLE_CLIENT.firstName },
          { label: 'Middle Name', value: SAMPLE_CLIENT.middleName },
          { label: 'Last Name', value: SAMPLE_CLIENT.lastName },
          { label: 'Email', value: SAMPLE_CLIENT.email },
          { label: 'Phone', value: SAMPLE_CLIENT.phone },
          { label: 'Contact Number', value: SAMPLE_CLIENT.contactNumber },
          { label: 'Address', value: SAMPLE_CLIENT.address },
          { label: 'Company Name', value: SAMPLE_CLIENT.companyName },
          { label: 'Project Details', value: SAMPLE_CLIENT.projectDetails },
          { label: 'Father Name', value: SAMPLE_CLIENT.fatherName },
          { label: 'Mother Name', value: SAMPLE_CLIENT.motherName },
          { label: 'Password', value: SAMPLE_CLIENT.password },
          { label: 'Service', value: SAMPLE_CLIENT.service },
          { label: 'Profile Status', value: SAMPLE_CLIENT.profileStatus },
          { label: 'Payment Status', value: SAMPLE_CLIENT.paymentStatus },
          { label: 'Applied', value: SAMPLE_CLIENT.applied },
          { label: 'Date of Birth', value: SAMPLE_CLIENT.dateOfBirth },
          { label: 'Gender', value: SAMPLE_CLIENT.gender },
          { label: 'Nationality', value: SAMPLE_CLIENT.nationality },
          { label: 'Blood Type', value: SAMPLE_CLIENT.bloodType },
          { label: 'Marital Status', value: SAMPLE_CLIENT.maritalStatus },
          { label: 'Educational Qualification', value: SAMPLE_CLIENT.educationalQualification },
          { label: 'College', value: SAMPLE_CLIENT.college },
          { label: 'Passing Year', value: SAMPLE_CLIENT.passingYear },
          { label: 'GPA/Percentage', value: SAMPLE_CLIENT.gpaPercentage },
          { label: 'Work Experience', value: SAMPLE_CLIENT.workExperience },
          { label: 'Working Organization', value: SAMPLE_CLIENT.workingOrganization },
          { label: 'Position', value: SAMPLE_CLIENT.position },
          { label: 'Salary', value: SAMPLE_CLIENT.salary },
          { label: 'Skills', value: SAMPLE_CLIENT.skills },
          { label: 'Languages Known', value: SAMPLE_CLIENT.languagesKnown },
          { label: 'References', value: SAMPLE_CLIENT.references },
          { label: 'Citizenship Number', value: SAMPLE_CLIENT.citizenshipNumber },
          { label: 'Permanent Address', value: SAMPLE_CLIENT.permanentAddress },
          { label: 'Temporary Address', value: SAMPLE_CLIENT.temporaryAddress },
          { label: 'Emergency Contact', value: SAMPLE_CLIENT.emergencyContact },
          { label: 'Posting Preference', value: SAMPLE_CLIENT.postingPreference },
          { label: 'Health Status', value: SAMPLE_CLIENT.healthStatus },
          // Nepali Fields
          { label: 'पहिलो नाम', value: SAMPLE_CLIENT.पहिलो_नाम },
          { label: 'बीचको नाम', value: SAMPLE_CLIENT.बीचको_नाम },
          { label: 'थर', value: SAMPLE_CLIENT.थर },
          { label: 'ईमेल', value: SAMPLE_CLIENT.ईमेल_नेपाली },
          { label: 'मोबाइल नम्बर', value: SAMPLE_CLIENT.मोबाइल_नम्बर_नेपाली },
          { label: 'जन्म मिति', value: SAMPLE_CLIENT.जन्म_मिति },
          { label: 'लिङ्ग', value: SAMPLE_CLIENT.लिङ्ग },
          { label: 'नागरिकता', value: SAMPLE_CLIENT.नागरिकता },
          { label: 'रक्त समुह', value: SAMPLE_CLIENT.रक्त_समुह },
          { label: 'वैवाहिक स्थिति', value: SAMPLE_CLIENT.वैवाहिक_स्थिति },
          { label: 'शैक्षिक योग्यता', value: SAMPLE_CLIENT.शैक्षिक_योग्यता },
          { label: 'कलेज/विश्वविद्यालय', value: SAMPLE_CLIENT.कलेज },
          { label: 'उत्तीर्ण वर्ष', value: SAMPLE_CLIENT.उत्तीर्ण_वर्ष },
          { label: 'जीपीए/प्रतिशत', value: SAMPLE_CLIENT.जीपीए_प्रतिशत },
          { label: 'कार्य अनुभव', value: SAMPLE_CLIENT.कार्य_अनुभव },
          { label: 'कार्यरत संस्था', value: SAMPLE_CLIENT.कार्यरत_संस्था },
          { label: 'पद', value: SAMPLE_CLIENT.पद },
          { label: 'तनख्वाह', value: SAMPLE_CLIENT.तनख्वाह },
          { label: 'कौशल', value: SAMPLE_CLIENT.कौशल },
          { label: 'ज्ञात भाषा', value: SAMPLE_CLIENT.ज्ञात_भाषा },
          { label: 'संदर्भ', value: SAMPLE_CLIENT.संदर्भ },
          { label: 'नागरिकता नम्बर', value: SAMPLE_CLIENT.नागरिकता_नम्बर },
          { label: 'स्थायी ठेगाना', value: SAMPLE_CLIENT.स्थायी_ठेगाना },
          { label: 'अस्थायी ठेगाना', value: SAMPLE_CLIENT.अस्थायी_ठेगाना },
          { label: 'आपतकालीन सम्पर्क', value: SAMPLE_CLIENT.आपतकालीन_सम्पर्क },
          { label: 'पदको वरीयता', value: SAMPLE_CLIENT.पदको_वरीयता },
          { label: 'स्वास्थ्य स्थिति', value: SAMPLE_CLIENT.स्वास्थ्य_स्थिति },
        ];
        const mid = Math.ceil(infoFields.length / 2);
        const leftFields = infoFields.slice(0, mid);
        const rightFields = infoFields.slice(mid);
        
        const handleCopyToClipboard = () => {
          const textToCopy = infoFields
            .map(field => `${field.label}: ${field.value}`)
            .join('\n');
          
          navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        };
        
        return (
          <div className="rounded-lg border border-nova-cyan/20 bg-gradient-to-br from-white to-nova-cyan/5 p-8 shadow-sm relative">
            {/* Floating Copy Button */}
            <button
              onClick={handleCopyToClipboard}
              className={`absolute top-4 right-4 flex items-center justify-center px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 ${
                copied
                  ? 'bg-green-500 text-white scale-110'
                  : 'bg-nova-cyan text-white hover:bg-nova-blue hover:shadow-xl hover:scale-110'
              }`}
              title="Copy all information to clipboard"
            >
              {copied ? (
                <Check className="w-6 h-6" />
              ) : (
                <Copy className="w-6 h-6" />
              )}
            </button>
            
            <div className="flex">
              {/* Left Column */}
              <div className="w-1/2 space-y-3 pr-8">
                {leftFields.map((field, idx) => (
                  <InfoLine key={idx} label={field.label} value={field.value} />
                ))}
              </div>
              
              {/* Vertical Divider */}
              <div className="w-px bg-nova-cyan/30"></div>
              
              {/* Right Column */}
              <div className="w-1/2 space-y-3 pl-8">
                {rightFields.map((field, idx) => (
                  <InfoLine key={idx} label={field.label} value={field.value} />
                ))}
              </div>
            </div>
          </div>
        );
      case 'services':
        return (
          <div className="space-y-3">
            <ServiceItem name={SAMPLE_CLIENT.service} status={SAMPLE_CLIENT.paymentStatus === 'Done' ? 'Active' : 'Pending'} />
            <ServiceItem name="Visa Documentation" status="Pending" />
            <ServiceItem name="Interview Preparation" status={SAMPLE_CLIENT.applied === 'Yes' ? 'Completed' : 'Pending'} />
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-4">
            <SettingToggle label="Email Notifications" defaultChecked={true} />
            <SettingToggle label="SMS Alerts" defaultChecked={false} />
            <SettingToggle label="Show in Public Directory" defaultChecked={true} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with Profile Card */}
      <div className="border-b border-nova-cyan/20 bg-white/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/database"
              className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-nova-cyan/10 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-nova-navy" />
            </Link>
            <div className="flex items-center gap-4 w-full">
              {/* Profile Image */}
              <img
                src="/aaditya.png"
                alt={SAMPLE_CLIENT.name}
                className="h-16 w-16 flex-shrink-0 rounded-full shadow-md object-cover"
              />
              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-nova-navy truncate">{SAMPLE_CLIENT.name}</h1>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-nova-cyan" />
                    <span>{SAMPLE_CLIENT.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-nova-cyan" />
                    <span>{SAMPLE_CLIENT.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-nova-cyan" />
                    <span>{SAMPLE_CLIENT.address}</span>
                  </div>
                </div>
              </div>
              {/* Status Badge */}
              <div className="flex-shrink-0 text-right">
                <span className="inline-flex items-center rounded-full bg-nova-cyan/10 px-3 py-1 text-xs font-semibold text-nova-cyan border border-nova-cyan/30">
                  {SAMPLE_CLIENT.profileStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-8 rounded-xl border border-nova-cyan/30 bg-white/60 backdrop-blur-xl shadow-lg shadow-nova-cyan/5">
          <div className="border-b border-nova-cyan/20">
            <div className="flex overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium transition-all duration-200 hover:text-nova-navy ${
                      activeTab === tab.id
                        ? 'border-nova-cyan text-nova-cyan'
                        : 'border-transparent text-gray-600 hover:border-nova-cyan/50'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            <div className="animate-fadeIn">{renderTabContent()}</div>
          </div>
        </div>
      </div>
    </div>
    </DashboardShell>
  );
}

// Helper Components
function InfoCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-lg border border-nova-cyan/20 bg-gradient-to-br from-white to-nova-cyan/5 p-6 shadow-sm hover:shadow-md hover:border-nova-cyan/40 transition-all">
      <h3 className="mb-2 text-lg font-semibold text-nova-navy">{title}</h3>
      <p className="text-gray-600">{content}</p>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-nova-cyan/20 bg-white px-4 py-3 hover:border-nova-cyan/40 transition-colors">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-nova-navy font-semibold">{value}</span>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-1 py-0.5">
      <span className="font-medium text-nova-navy min-w-fit text-xs">{label}:</span>
      <span className="text-gray-700 text-xs">{value}</span>
    </div>
  );
}

function ServiceItem({ name, status }: { name: string; status: string }) {
  const statusColors: Record<string, string> = {
    Active: 'bg-nova-cyan/10 text-nova-cyan border border-nova-cyan/30',
    Pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    Completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-nova-cyan/20 bg-white p-4 hover:shadow-md hover:border-nova-cyan/40 transition-all">
      <span className="font-medium text-nova-navy">{name}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[status]}`}>
        {status}
      </span>
    </div>
  );
}

function SettingToggle({ label, defaultChecked }: { label: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between rounded-lg border border-nova-cyan/20 bg-white p-4 hover:border-nova-cyan/40 transition-colors">
      <span className="font-medium text-nova-navy">{label}</span>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-nova-cyan' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function ImageCard({ src, alt, isDragged = false, onDragStart, onDragEnd }: { src: string; alt: string; isDragged?: boolean; onDragStart?: (src: string) => void; onDragEnd?: () => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <div
        draggable
        onDragStart={() => onDragStart?.(src)}
        onDragEnd={onDragEnd}
        onClick={() => setIsFullscreen(true)}
        className={`relative group cursor-pointer border-2 bg-white shadow-sm transition-all ${
          isDragged 
            ? 'border-nova-cyan bg-nova-cyan/10 opacity-50' 
            : 'border-nova-cyan/20 hover:shadow-lg hover:border-nova-cyan/40'
        }`}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-nova-cyan hover:bg-nova-blue rounded-full text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DocumentSection({ title, images, isFirst, isLast, sectionKey, draggedImage, setDraggedImage, onDrop }: { title: string; images: string[]; isFirst: boolean; isLast: boolean; sectionKey: string; draggedImage: string | null; setDraggedImage: (img: string | null) => void; onDrop: (section: any, image: string) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedImage) {
      onDrop(sectionKey, draggedImage);
    }
    setIsDragOver(false);
  };

  return (
    <div 
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={handleDrop}
      className={`border-t border-nova-cyan/30 p-6 ${isFirst ? 'rounded-t-lg' : ''} ${isLast ? 'rounded-b-lg border-b' : ''} transition-colors ${
        isDragOver ? 'bg-nova-cyan/10 border-t-2 border-t-nova-cyan' : 'bg-white hover:bg-nova-cyan/5'
      }`}
    >
      <div className="mb-4 pb-2 border-b border-nova-cyan/20">
        <h3 className="text-xs font-medium text-nova-navy uppercase tracking-wide">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.length > 0 ? (
          images.map((image, index) => (
            <ImageCard 
              key={`${sectionKey}-${image}`}
              src={image} 
              alt={`${title} - Image ${index + 1}`}
              isDragged={draggedImage === image}
              onDragStart={() => setDraggedImage(image)}
              onDragEnd={() => setDraggedImage(null)}
            />
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-gray-400">
            <p className="text-sm">Drag images here or no images yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
