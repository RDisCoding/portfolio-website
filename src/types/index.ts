// Common types used across the application
import type { PortableTextBlock } from '@portabletext/types'

export interface SanityImage {
  asset?: {
    _id: string;
    url: string;
  };
  alt?: string;
}

export interface AboutData {
  name?: string;
  email?: string;
  location?: string;
  education?: string;
  biography?: PortableTextBlock[];
  profileImage?: string;
  profileLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface AcademicData {
  _id: string;
  title?: string;
  institution?: string;
  year?: string;
  score?: string;
  order?: number;
  semester?: number;
  description?: PortableTextBlock[] | string;
  semesterImages?: SanityImage[];
}

export interface ProjectData {
  _id: string;
  title: string;
  category?: string;
  year?: string;
  description?: PortableTextBlock[];
  techStack?: string[];
  projectLink?: string;
  docsLink?: string;
  githubLink?: string;
  images?: SanityImage[];
}

export interface CocurricularData {
  _id: string;
  activity: string;
  category?: string;
  year?: string;
  description?: PortableTextBlock[] | string;
  link?: string;
  images?: SanityImage[];
}

export interface TestimonialData {
  _id: string;
  name: string;
  role?: string;
  company?: string;
  testimonial: string;
  rating?: number;
  approved?: boolean;
  _createdAt?: string;
}
