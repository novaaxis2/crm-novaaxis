import { DatabaseRecord } from './database-types';

const firstNames = [
  'Aaditya', 'Nabin', 'Ramesh', 'Priya', 'Deepak', 'Arjun', 'Pooja', 'Vikram',
  'Neha', 'Rohan', 'Anjali', 'Sanjay', 'Meera', 'Rajesh', 'Simran', 'Ashish',
  'Sneha', 'Nikhil', 'Divya', 'Arun', 'Swati', 'Karan', 'Isha', 'Manoj',
  'Richa', 'Rahul', 'Kavya', 'Suresh', 'Ananya', 'Harish', 'Laxmi', 'Vishal',
  'Rani', 'Pankaj', 'Gita', 'Sandeep', 'Riya', 'Tushar', 'Neetu', 'Vinod',
  'Priya', 'Sachin', 'Shreya', 'Dheeraj', 'Seema', 'Mohan', 'Nisha', 'Akshay',
  'Isha', 'Aryan',
];

const lastNames = [
  'Chaudhary', 'Rokaya', 'Poudel', 'Bhattarai', 'Sharma', 'Thapa', 'Gautam',
  'Singh', 'Kumar', 'Verma', 'Gupta', 'Joshi', 'Yadav', 'Pandey', 'Negi',
  'Mishra', 'Desai', 'Kulkarni', 'Agarwal', 'Chopra', 'Malhotra', 'Bansal',
  'Kapoor', 'Saxena', 'Dutta', 'Ghosh', 'Bose', 'Roy', 'Das', 'Sengupta',
  'Mukherjee', 'Chatterjee', 'Rao', 'Reddy', 'Iyer', 'Srinivasan', 'Subramanian',
  'Krishnan', 'Raman', 'Srinivas', 'Chandran', 'Venkatesh', 'Balakrishnan',
  'Nagarajan', 'Rajhans', 'Trivedi', 'Dwivedi', 'Pandya', 'Mehta',
];

const cities = [
  'Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar', 'Janakpur',
  'Birgunj', 'Nepalgunj', 'Dharan', 'Itahari', 'Sunsari', 'Morang', 'Rupandehi',
];

const services = ['CV', 'Loksewa form 2026', 'Documentation', 'Visa Prep', 'Interview Coaching'] as const;

const generateEmail = (firstName: string, lastName: string, index: number) => {
  const domain = ['gmail.com', 'outlook.com', 'yahoo.com'][index % 3];
  return `${firstName.toLowerCase()}${index}@${domain}`;
};

const generatePhone = () => {
  return '98' + Math.floor(Math.random() * 9000000000 + 1000000000).toString().slice(-8);
};

export function generateMockDatabaseData(): DatabaseRecord[] {
  const records: DatabaseRecord[] = [];

  for (let i = 1; i <= 50; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    const name = lastNames[i - 1] ? `${firstName} ${lastNames[i - 1]}` : firstName;

    const statusOptions = ['Ready', 'Not ready', 'In Progress'] as const;
    const paymentOptions = ['Pending', 'Done', 'Cancelled'] as const;
    const appliedOptions = ['Yes', 'No'] as const;

    records.push({
      id: i,
      serialNumber: i,
      name: name,
      email: generateEmail(firstName, lastNames[i - 1], i),
      address: cities[Math.floor(Math.random() * cities.length)],
      contact: generatePhone(),
      service: services[Math.floor(Math.random() * services.length)],
      profileStatus: statusOptions[Math.floor(Math.random() * statusOptions.length)],
      paymentStatus: paymentOptions[Math.floor(Math.random() * paymentOptions.length)],
      applied: appliedOptions[Math.floor(Math.random() * appliedOptions.length)],
      joinedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
    });
  }

  return records;
}
