export interface Skill {
  name: string;
  level: number; // Visual proficiency indicator; not a percentage claim.
  experienceYears: number;
  highlightTag?: string;
  description: string;
  emblemKey:
    | 'react'
    | 'typescript'
    | 'tailwind'
    | 'three'
    | 'node'
    | 'python'
    | 'postgres'
    | 'graphql'
    | 'docker'
    | 'k8s'
    | 'aws'
    | 'cicd'
    | 'langchain'
    | 'vector'
    | 'pytorch'
    | 'openai'
    | 'github';
}

export interface SkillCategory {
  id: string;
  categoryName: string;
  icon: string;
  skills: Skill[];
}

export interface Project {
  id: string;
  title: string;
  category: 'Web Architecture' | 'AI / Intelligent Systems' | 'Cloud Infrastructure' | 'Mobile & Cross-Platform';
  subtitle: string;
  description: string;
  longDescription: string;
  technicalHighlights: string[];
  impactMetrics: { label: string; value: string }[];
  tags: string[];
  image: string;
  demoUrl: string;
  githubUrl: string;
  featured: boolean;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

export interface TechnicalHighlight {
  id: string;
  title: string;
  metric: string;
  description: string;
  tags: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  qualification: string;
  period: string;
  result: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
  duration: string;
}

export const PROFILE_DATA = {
  personal: {
    name: "Naitik Gupta",
    title: "Computer Engineering Student & Frontend Developer",
    tagline: "Building responsive web experiences, mobile applications, and practical software systems.",
    bio: "Computer Engineering student at KJ Somaiya College of Engineering with hands-on experience in React.js, Angular, React Native, TypeScript, and frontend development. Interested in building practical, responsive, and user-focused software.",
    location: "Not specified",
    email: "naitikg1103@gmail.com",
    availability: "Open to internships and software development opportunities",
    statusBadge: "Computer Engineering • Open to Opportunities",
    socials: {
      github: "https://github.com/creatorofC-gif",
      linkedin: "https://www.linkedin.com/in/naitik-gupta-236a43320/",
      twitter: "",
      discord: "",
    },
    resumeUrl: "#resume",
  },

  education: [
    {
      id: "edu-1",
      institution: "KJ Somaiya College of Engineering, Mumbai",
      qualification: "B.Tech. in Computer Engineering",
      period: "2028",
      result: "CGPA: 9.1",
    },
    {
      id: "edu-2",
      institution: "Divya Jyot School, Ahmedabad",
      qualification: "Senior Secondary — Central Board of Secondary Education",
      period: "2024",
      result: "Percentage: 85",
    },
    {
      id: "edu-3",
      institution: "Seth Anandram Jaipuria School, Ghaziabad",
      qualification: "Secondary — Indian Certificate of Secondary Education",
      period: "2019",
      result: "Percentage: 97",
    },
  ] as EducationItem[],

  // Audio tracks for the ambient lo-fi music player widget.
  // These are interface assets and are not part of the resume.
  musicTracks: [
    {
      id: "track-1",
      title: "Midnight Coding Session (Lo-Fi)",
      artist: "ChillHop Beats",
      src: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
      duration: "2:45",
    },
    {
      id: "track-2",
      title: "Cyberpunk Ambient Drift",
      artist: "Synthwave Audio",
      src: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ambient-lofi-10821.mp3",
      duration: "3:12",
    },
    {
      id: "track-3",
      title: "Coffee & Code Chill",
      artist: "Focus Studio",
      src: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792e8.mp3?filename=lofi-chill-medium-123497.mp3",
      duration: "2:18",
    },
  ] as AudioTrack[],

  skillCategories: [
    {
      id: "frontend",
      categoryName: "Frontend Development",
      icon: "Layout",
      skills: [
        {
          name: "React.js",
          emblemKey: "react",
          level: 55,
          experienceYears: 0,
          highlightTag: "Fundamentals",
          description: "Component-based UI development and responsive frontend interfaces.",
        },
        {
          name: "Angular",
          emblemKey: "react",
          level: 55,
          experienceYears: 0,
          highlightTag: "Fundamentals",
          description: "Components, modules, routing, services, data binding, and Angular CLI.",
        },
        {
          name: "React Native",
          emblemKey: "react",
          level: 60,
          experienceYears: 0,
          highlightTag: "Project Experience",
          description: "Android application development with smooth UI interactions and media handling.",
        },
        {
          name: "Tailwind CSS",
          emblemKey: "tailwind",
          level: 60,
          experienceYears: 0,
          highlightTag: "Frontend",
          description: "Responsive UI styling and reusable utility-based interface development.",
        },
        {
          name: "Bootstrap",
          emblemKey: "tailwind",
          level: 55,
          experienceYears: 0,
          highlightTag: "Fundamentals",
          description: "Responsive layouts and UI development using Bootstrap.",
        },
      ],
    },
    {
      id: "languages",
      categoryName: "Programming Languages",
      icon: "Code",
      skills: [
        {
          name: "JavaScript",
          emblemKey: "typescript",
          level: 55,
          experienceYears: 0,
          highlightTag: "Fundamentals",
          description: "Core JavaScript concepts used in frontend development.",
        },
        {
          name: "TypeScript",
          emblemKey: "typescript",
          level: 55,
          experienceYears: 0,
          highlightTag: "Fundamentals",
          description: "Type-safe development used with Angular and modern frontend projects.",
        },
        {
          name: "Python",
          emblemKey: "python",
          level: 50,
          experienceYears: 0,
          highlightTag: "Fundamentals",
          description: "Programming fundamentals and problem-solving with Python.",
        },
        {
          name: "C++",
          emblemKey: "python",
          level: 50,
          experienceYears: 0,
          highlightTag: "Fundamentals",
          description: "Programming fundamentals and algorithmic problem-solving with C++.",
        },
        {
          name: "HTML5",
          emblemKey: "typescript",
          level: 70,
          experienceYears: 0,
          highlightTag: "Web Fundamentals",
          description: "Semantic structure and frontend page development.",
        },
        {
          name: "CSS3",
          emblemKey: "tailwind",
          level: 70,
          experienceYears: 0,
          highlightTag: "Web Fundamentals",
          description: "Responsive styling, layouts, and visual presentation.",
        },
        {
          name: "SQL",
          emblemKey: "postgres",
          level: 55,
          experienceYears: 0,
          highlightTag: "Database",
          description: "SQL fundamentals and relational database interaction.",
        },
      ],
    },
    {
      id: "database-tools",
      categoryName: "Databases & Developer Tools",
      icon: "Database",
      skills: [
        {
          name: "PostgreSQL",
          emblemKey: "postgres",
          level: 55,
          experienceYears: 0,
          highlightTag: "Database",
          description: "Relational database development and management with PostgreSQL and pgAdmin.",
        },
        {
          name: "Git",
          emblemKey: "github",
          level: 65,
          experienceYears: 0,
          highlightTag: "Version Control",
          description: "Version control and collaborative development workflows.",
        },
        {
          name: "GitHub",
          emblemKey: "github",
          level: 65,
          experienceYears: 0,
          highlightTag: "Collaboration",
          description: "Repository management and collaborative software development.",
        },
        {
          name: "Angular CLI",
          emblemKey: "react",
          level: 55,
          experienceYears: 0,
          highlightTag: "Development Tool",
          description: "Angular project creation, development, and tooling.",
        },
        {
          name: "VS Code",
          emblemKey: "typescript",
          level: 70,
          experienceYears: 0,
          highlightTag: "Development Tool",
          description: "Primary development environment for software projects.",
        },
        {
          name: "Thunder Client",
          emblemKey: "graphql",
          level: 55,
          experienceYears: 0,
          highlightTag: "API Testing",
          description: "API request testing and development workflow support.",
        },
        {
          name: "Android Studio",
          emblemKey: "react",
          level: 55,
          experienceYears: 0,
          highlightTag: "Mobile Development",
          description: "Android application development and debugging.",
        },
        {
          name: "Expo",
          emblemKey: "react",
          level: 55,
          experienceYears: 0,
          highlightTag: "React Native",
          description: "React Native development and mobile project tooling.",
        },
        {
          name: "pgAdmin",
          emblemKey: "postgres",
          level: 55,
          experienceYears: 0,
          highlightTag: "Database Tool",
          description: "PostgreSQL database administration and inspection.",
        },
      ],
    },
    {
      id: "ai-tools",
      categoryName: "AI Development Tools",
      icon: "Sparkles",
      skills: [
        {
          name: "Claude",
          emblemKey: "openai",
          level: 65,
          experienceYears: 0,
          highlightTag: "AI Tool",
          description: "AI-assisted development and technical problem solving.",
        },
        {
          name: "ChatGPT",
          emblemKey: "openai",
          level: 65,
          experienceYears: 0,
          highlightTag: "AI Tool",
          description: "AI-assisted development, research, and productivity.",
        },
        {
          name: "Stitch",
          emblemKey: "tailwind",
          level: 60,
          experienceYears: 0,
          highlightTag: "Design Tool",
          description: "AI-assisted interface design and prototyping.",
        },
        {
          name: "Antigravity",
          emblemKey: "openai",
          level: 60,
          experienceYears: 0,
          highlightTag: "Development Tool",
          description: "AI-assisted development workflow and project iteration.",
        },
      ],
    },
  ] as SkillCategory[],

  projects: [
    {
      id: "memories",
      title: "Memories — Secure Photo Gallery App",
      category: "Mobile & Cross-Platform",
      subtitle: "Privacy-focused Android photo gallery built with React Native",
      description:
        "An Android application built with React Native to provide a secure photo gallery experience with photo organization and memory-based tagging.",
      longDescription:
        "Memories is a React Native Android application focused on secure photo gallery functionality. The app organizes and tags photos based on locations and memories while prioritizing privacy, smooth UI interactions, and efficient media handling.",
      technicalHighlights: [
        "React Native-based Android application",
        "Photo organization and tagging based on locations and memories",
        "Privacy-focused media handling and smooth mobile interactions",
      ],
      impactMetrics: [
        { label: "Platform", value: "Android" },
        { label: "Framework", value: "React Native" },
        { label: "Focus", value: "Privacy & Media Handling" },
      ],
      tags: ["React Native", "JavaScript", "Android"],
      image:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
      demoUrl: "",
      githubUrl: "",
      featured: true,
    },
  ] as Project[],

  technicalHighlights: [
    {
      id: "tech-1",
      title: "Responsive Frontend Development",
      metric: "React + Tailwind CSS",
      description:
        "Redesigned and redeveloped the MyEzz food delivery web platform with a focus on UI/UX, responsiveness, maintainability, and frontend performance.",
      tags: ["React.js", "Tailwind CSS", "UI/UX"],
    },
    {
      id: "tech-2",
      title: "Angular Application Development",
      metric: "Angular + TypeScript",
      description:
        "Worked on guided Angular development tasks covering components, modules, routing, services, data binding, TypeScript, Angular CLI, and debugging.",
      tags: ["Angular", "TypeScript", "Angular CLI"],
    },
    {
      id: "tech-3",
      title: "Hardware–Software Integration",
      metric: "ESP32 + Bluetooth",
      description:
        "Developed a Bluetooth-enabled Android application integrated with an ESP32-based smart heating band for reliable device control and mobile-to-hardware communication.",
      tags: ["Android", "ESP32", "Bluetooth"],
    },
  ] as TechnicalHighlight[],

  experience: [
    {
      id: "exp-1",
      role: "Angular Developer Intern",
      company: "Red Leaf Softwares & Services LLP",
      location: "Not specified",
      period: "July 2026",
      description:
        "Worked on guided Angular development tasks while building familiarity with component-based application development and professional frontend workflows.",
      achievements: [
        "Learned Angular fundamentals including components, modules, routing, services, and data binding.",
        "Worked with TypeScript and Angular CLI to understand component-based application development and project structure.",
        "Implemented basic Angular features, performed debugging, and followed industry coding practices under mentor guidance.",
        "Collaborated with mentors using Git and gained exposure to professional frontend development workflows.",
      ],
      technologies: ["Angular", "TypeScript", "Angular CLI", "Git"],
    },
    {
      id: "exp-2",
      role: "Android Developer",
      company: "Alien Healthcare",
      location: "Not specified",
      period: "Jan 2026 — Mar 2026",
      description:
        "Developed a Bluetooth-enabled Android application integrated with an ESP32-based smart heating band system for device control.",
      achievements: [
        "Developed an Android application integrated with an ESP32-based smart heating band.",
        "Utilized Android development tools, ESP32 integration, and Bluetooth communication protocols for hardware–software connectivity.",
        "Implemented a stable mobile-to-hardware communication framework to improve responsiveness and overall user experience.",
      ],
      technologies: ["Android", "ESP32", "Bluetooth"],
    },
    {
      id: "exp-3",
      role: "Frontend Developer",
      company: "MyEzz — Food Delivery Startup",
      location: "Not specified",
      period: "Sept 2025 — Oct 2025",
      description:
        "Redesigned and redeveloped the web platform with a focus on UI/UX, responsiveness, frontend performance, and maintainability.",
      achievements: [
        "Redesigned and redeveloped the complete web platform to improve UI/UX, responsiveness, and overall system performance.",
        "Built and optimized scalable frontend modules using React.js and Tailwind CSS to improve maintainability and interface efficiency.",
        "Led production deployment activities and collaborated with cross-functional teams to ensure smooth implementation and successful project delivery.",
      ],
      technologies: ["React.js", "Tailwind CSS"],
    },
  ] as ExperienceItem[],

  softSkills: [
    "Communication",
    "Teamwork",
    "Leadership",
    "Problem Solving",
    "Time Management",
  ],

  resume: {
    phone: "9650781590",
    linkedin: "https://www.linkedin.com/in/naitik-gupta-236a43320/",
  },
};