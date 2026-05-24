
import React from 'react';

export type UserRole = 
  | 'Farmer' 
  | 'Agrodealer' 
  | 'Agronomist' 
  | 'Agrovet' 
  | 'LogisticsProvider'
  | 'Admin' 
  | 'SuperAdmin'
  | 'KYCOfficer'
  | 'CatalogManager' 
  | 'SupportAgent'
  | 'FinancialAuditor';

export interface Farm {
  id: string;
  userId: string;
  name: string;
  location: string;
  coords: { lat: number; lon: number };
  size: number; // in acres
  mainCrops: string[];
}

export interface ForecastDay {
    date: string;
    temp: number;
    condition: string;
    icon: string;
}

export interface GroundingSource {
    title: string;
    uri: string;
}

export interface Weather {
    temp: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    forecast: ForecastDay[];
    sources?: GroundingSource[];
}

export interface CropAdvice {
    bestCrops: { name: string; reason: string; plantingTip: string }[];
    soilPreparation: string;
    alert?: string;
    sources?: GroundingSource[];
}

export interface WhatsAppConfig {
  enabled: boolean;
  phoneNumber: string;
  accountId: string;
  phoneNumberId: string;
  accessToken: string;
}

export interface GoogleBusinessConfig {
  enabled: boolean;
  placeId: string;
  businessUrl: string;
  googleRating?: number;
  reviewCount?: number;
  isVerified?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // legacy; admin/agronomist secondary path only
  role: UserRole;
  /** E.164 phone number, e.g. "+255712345678". Primary identity per DESIGN_SPEC §9.2. */
  phone?: string;
  /** ISO timestamp set when the user passed OTP. */
  phoneVerifiedAt?: string;
  /** Region of the phone number, for SMS provider routing. */
  region?: "TZ" | "KE";
  location?: string;
  coords?: { lat: number; lon: number };
  kycStatus?: 'Not Submitted' | 'Pending' | 'Verified' | 'Rejected';
  nin?: string;
  kycSubmissionDate?: string;
  idFrontUrl?: string;
  selfieUrl?: string;
  farms?: Farm[];
  businessDescription?: string;
  logoUrl?: string;
  operatingHours?: string;
  specialties?: string[];
  whatsappConfig?: WhatsAppConfig;
  googleBusinessConfig?: GoogleBusinessConfig;
}

export interface Agrodealer extends User {
  role: 'Agrodealer';
  rating: number;
}

export interface Agrovet extends User {
  role: 'Agrovet';
  rating: number;
}

export interface LogisticsProvider extends User {
  role: 'LogisticsProvider';
  companyName: string;
  vehicleType: string;
  licensePlate: string;
  status: 'Approved' | 'Pending' | 'Banned';
}

export interface Product {
  id:string;
  name: string;
  description: string;
  price: number;
  category: 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Tools' | 'Animal Medicine' | 'Agrovet Services';
  imageUrl?: string;
  image_url?: string;
  vendor: Agrodealer | Agrovet;
  stock: number;
  barcode?: string;
  isFeatured?: boolean;
  is_featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface Review {
  id: string;
  vendorId: string;
  userName: string;
  rating: number; 
  comment: string;
  date: string;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Completed';
  channel?: 'online' | 'pos';
}

export interface PlantAnalysisResult {
  diagnosis: string;
  causes: string;
  recommendations: string;
  suggestedProductTypes: string[];
}

export interface DeliveryOption {
  id: 'standard' | 'express';
  name: string;
  cost: number;
  eta: string;
}

export interface PaymentMethod {
  id: 'mpesa' | 'card' | 'cod';
  name: string;
}

export type PaymentProvider = 'Selcom' | 'AzamPay' | 'M-Pesa' | 'TigoPesa' | 'Bank';

export interface PaymentGatewayConfig {
    provider: PaymentProvider;
    enabled: boolean;
    apiKey?: string;
    apiSecret?: string;
    vendorId?: string; 
    shortcode?: string; 
    accountName?: string; 
    accountNumber?: string; 
    bankName?: string; 
}

export interface TruckType {
    id: string;
    name: string;
    capacity: string;
    icon: React.ReactNode;
}

export interface LogisticsBooking {
    id: string;
    farmerId: string;
    providerId?: string;
    pickupLocation: string;
    dropoffLocation: string;
    cargoDetails: string;
    truckTypeId: string;
    pickupDate: string;
    status: 'Pending' | 'Confirmed' | 'In Transit' | 'Delivered' | 'Cancelled';
}

export type ToolProvider = Agrodealer | Agrovet;
export type ToolAvailability = 'Available' | 'Rented Out' | 'Maintenance';
export type ToolCategory = 'Tractor' | 'Tillage' | 'Seeding' | 'Harvester' | 'Other';

export interface Tool {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    dailyRate: number;
    owner: ToolProvider;
    availability: ToolAvailability;
    category: ToolCategory;
    unavailableRanges?: { start: string; end: string }[];
}

export type ToolBookingStatus = 'Pending' | 'Confirmed' | 'Active' | 'Completed' | 'Cancelled' | 'Rejected';

export interface ToolBooking {
    id: string;
    toolId: string;
    farmerId: string;
    startDate: string; 
    endDate: string;   
    totalCost: number;
    status: ToolBookingStatus;
}
