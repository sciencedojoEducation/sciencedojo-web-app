export type Subject = "Science" | "Math" | "Physics" | "Chemistry" | "Biology" | "Programming";

export interface Tutor {
  id: string;
  name: string;
  subject: Subject;
  bio: string;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  isAvailableNow: boolean;
}

export const mockTutors: Tutor[] = [
  {
    id: "1",
    name: "Dr. Sarah Jenkins",
    subject: "Chemistry",
    bio: "PhD in Chemistry from MIT. Specializes in making complex molecular concepts simple and intuitive. Over 5 years of remote tutoring experience.",
    hourlyRate: 85,
    rating: 4.9,
    reviewCount: 124,
    imageUrl: "/tutor_sarah.webp", // Will link to generated artifact or public asset
    isAvailableNow: true,
  },
  {
    id: "2",
    name: "Michael Chen",
    subject: "Physics",
    bio: "Former CERN researcher with a passion for teaching. I can help you understand classical mechanics, electromagnetism, and modern physics.",
    hourlyRate: 75,
    rating: 4.8,
    reviewCount: 89,
    imageUrl: "/tutor_michael.webp",
    isAvailableNow: false,
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    subject: "Math",
    bio: "Math doesn't have to be scary! From Algebra to Calculus III, I focus on building a strong foundation and boosting your confidence.",
    hourlyRate: 60,
    rating: 5.0,
    reviewCount: 201,
    imageUrl: "/tutor_elena.webp",
    isAvailableNow: true,
  },
  {
    id: "4",
    name: "James Wilson",
    subject: "Biology",
    bio: "Medical student who loves teaching biology. Specializing in AP Biology and college-level genetics. Let's make learning cell structure fun.",
    hourlyRate: 65,
    rating: 4.7,
    reviewCount: 45,
    imageUrl: "/tutor_james.webp",
    isAvailableNow: true,
  },
  {
    id: "5",
    name: "Dr. Ananya Patel",
    subject: "Programming",
    bio: "Ex-Google engineer teaching Python, JavaScript, and data structures. I will prepare you not just for exams, but for real-world problem solving.",
    hourlyRate: 110,
    rating: 4.9,
    reviewCount: 156,
    imageUrl: "/tutor_ananya.webp",
    isAvailableNow: false,
  },
  {
    id: "6",
    name: "David Kim",
    subject: "Science",
    bio: "General science expert for middle and high schoolers. My approach is hands-on and heavily uses visual aids to guarantee understanding.",
    hourlyRate: 50,
    rating: 4.6,
    reviewCount: 32,
    imageUrl: "/tutor_david.webp",
    isAvailableNow: true,
  }
];

// --- Phase 6 Mock Data Models ---

export interface Booking {
  id: string;
  tutorId: string;
  studentName: string;
  subject: string;
  timeSlot: string;
  status: "upcoming" | "completed" | "cancelled";
  meetingUrl?: string;
  price: number;
}

export interface LessonNote {
  id: string;
  bookingId: string;
  date: string;
  summary: string;
  homework: string;
}

export interface AdminStats {
  totalRevenue: number;
  hoursTaught: number;
  activeTutors: number;
  totalStudents: number;
}

export const mockBookings: Booking[] = [
  {
    id: "bk_1",
    tutorId: "1",
    studentName: "Alex Mercer",
    subject: "Chemistry",
    timeSlot: "Tomorrow, 10:00 AM",
    status: "upcoming",
    meetingUrl: "https://zoom.us/j/123456789",
    price: 85
  },
  {
    id: "bk_2",
    tutorId: "2",
    studentName: "Alex Mercer",
    subject: "Physics",
    timeSlot: "Yesterday, 2:00 PM",
    status: "completed",
    price: 75
  },
  {
    id: "bk_3",
    tutorId: "1",
    studentName: "Sarah Connor",
    subject: "Chemistry",
    timeSlot: "Today, 4:00 PM",
    status: "upcoming",
    meetingUrl: "https://zoom.us/j/987654321",
    price: 85
  }
];

export const mockLessonNotes: LessonNote[] = [
  {
    id: "ln_1",
    bookingId: "bk_2",
    date: "March 26, 2026",
    summary: "Alex struggled initially with balancing stoichiometry equations but quickly grasped the molar ratio concept.",
    homework: "Complete worksheets 4A and 4B focusing on reactant limitations."
  }
];

export const mockAdminStats: AdminStats = {
  totalRevenue: 14250,
  hoursTaught: 312,
  activeTutors: 8,
  totalStudents: 145
};
