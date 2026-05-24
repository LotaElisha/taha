
import React from 'react';
import { Product, Agrodealer, Review, User, UserRole, Order, CartItem, Agrovet, TruckType, LogisticsBooking, LogisticsProvider, Tool, ToolBooking } from '../types';

// Centralized User Data Store
export const mockTastAgro: Agrodealer = {
    id: 'vendor-tast',
    name: 'TAST Agribusiness',
    email: 'tast@agribusiness.com',
    role: 'Agrodealer',
    phone: '+255774312203',
    phoneVerifiedAt: new Date().toISOString(),
    region: 'TZ',
    kycStatus: 'Verified',
    location: 'Arusha, Tanzania',
    coords: { lat: -3.3731, lon: 36.6860 },
    businessDescription: 'Agribusiness innovation provider of high-quality hybrid seeds, certified herbicides, and general agricultural inputs.',
    logoUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=200',
    operatingHours: '08:00 - 17:00',
    specialties: ['Seeds', 'Pesticides'],
    whatsappConfig: {
        enabled: true,
        phoneNumber: '+255774312203',
        accountId: 'act-tast',
        phoneNumberId: 'phone-tast',
        accessToken: 'mock-token-tast'
    },
    rating: 4.8
};

export const mockUsers: User[] = [
    {
        id: 'admin-001',
        name: 'System Administrator',
        email: 'admin@mkulima.com',
        password: 'password',
        role: 'SuperAdmin',
        kycStatus: 'Verified'
    },
    mockTastAgro
];

export const getAllMockUsers = (): User[] => mockUsers;

export const mockProducts: Product[] = [
    {
        id: 'p-beche-plus',
        name: 'Beche Plus 300WP',
        description: 'Selective rice weeding herbicide ("palizi ya mpunga"). Active ingredients: Bispyribac-Sodium (180g/kg) + Bensulfuron-Methyl (120g/kg). Total active content: 300g/kg. Packaging: 250g. Low toxic formulation (WP) ideal for agricultural commercial use.',
        price: 29000,
        category: 'Pesticides',
        imageUrl: '/images/products/beche_plus.jpg',
        image_url: '/images/products/beche_plus.jpg',
        vendor: mockTastAgro,
        stock: 45,
        barcode: 'ET20240305',
        isFeatured: true,
        is_featured: true
    },
    {
        id: 'p-t-maguguma',
        name: 'T-Maguguma 18.5SC',
        description: 'Selective maize weeding herbicide ("palizi ya mahindi"). Premium emergency treatment to control most broadleaf weeds and grasses with outstanding performance. Packaging: 1 Litre liquid solution (SC). Highly stable.',
        price: 35000,
        category: 'Pesticides',
        imageUrl: '/images/products/t_maguguma.jpg',
        image_url: '/images/products/t_maguguma.jpg',
        vendor: mockTastAgro,
        stock: 30,
        barcode: 'TM185SC-1L',
        isFeatured: true,
        is_featured: true
    },
    {
        id: 'p-seedco-sc719',
        name: 'Seed-Co SC 719 Maize Seed',
        description: 'Certified premium hybrid maize seed SC 719 (Late Maturity). High-yielding variety with excellent grain quality, strong lodging resistance, and robust disease package. Perfect for reliable high outputs. Packaging: 2kg.',
        price: 12500,
        category: 'Seeds',
        imageUrl: '/images/products/seedco_maize.jpg',
        image_url: '/images/products/seedco_maize.jpg',
        vendor: mockTastAgro,
        stock: 100,
        barcode: 'SC719-2KG',
        isFeatured: true,
        is_featured: true
    },
    {
        id: 'p-seedco-sc513',
        name: 'Seed-Co SC 513 Maize Seed',
        description: 'Certified premium hybrid maize seed SC 513 (Early Maturity). High-yielding variety characterized by fast maturity and outstanding drought tolerance. Packaging: 2kg.',
        price: 11500,
        category: 'Seeds',
        imageUrl: '/images/products/seedco_maize.jpg',
        image_url: '/images/products/seedco_maize.jpg',
        vendor: mockTastAgro,
        stock: 120,
        barcode: 'SC513-2KG',
        isFeatured: false,
        is_featured: false
    },
    {
        id: 'p-advanta-record',
        name: 'Advanta Sunflower RECORD Seed',
        description: 'TOSCI approved certified hybrid sunflower seed. High productivity seed with exceptional crop stability, robust root system, and high seed oil percentage. Packaging: 1kg.',
        price: 15000,
        category: 'Seeds',
        imageUrl: '/images/products/advanta_sunflower.jpg',
        image_url: '/images/products/advanta_sunflower.jpg',
        vendor: mockTastAgro,
        stock: 60,
        barcode: 'ADV-REC-1KG',
        isFeatured: true,
        is_featured: true
    },
    {
        id: 'p-advanta-hysun33',
        name: 'Advanta Sunflower HYSUN 33 Seed',
        description: 'TOSCI approved premium hybrid sunflower seed. Provides outstanding drought resistance and high yield potential under diverse soil conditions. Packaging: 1kg.',
        price: 16500,
        category: 'Seeds',
        imageUrl: '/images/products/advanta_sunflower.jpg',
        image_url: '/images/products/advanta_sunflower.jpg',
        vendor: mockTastAgro,
        stock: 75,
        barcode: 'ADV-HYS-1KG',
        isFeatured: false,
        is_featured: false
    },
    {
        id: 'p-advanta-aguara6',
        name: 'Advanta Sunflower AGUARA 6 Seed',
        description: 'TOSCI approved premium hybrid sunflower seed. Highly resilient variety with superior lodging resistance and exceptional grain output. Packaging: 1kg.',
        price: 16000,
        category: 'Seeds',
        imageUrl: '/images/products/advanta_sunflower.jpg',
        image_url: '/images/products/advanta_sunflower.jpg',
        vendor: mockTastAgro,
        stock: 80,
        barcode: 'ADV-AG6-1KG',
        isFeatured: false,
        is_featured: false
    },
    {
        id: 'p-advanta-aguara4',
        name: 'Advanta Sunflower AGUARA 4 Seed',
        description: 'TOSCI approved hybrid sunflower seed AGUARA 4. Excellent seed uniform growth, quick establishment, and strong performance. Packaging: 1kg.',
        price: 15500,
        category: 'Seeds',
        imageUrl: '/images/products/advanta_sunflower.jpg',
        image_url: '/images/products/advanta_sunflower.jpg',
        vendor: mockTastAgro,
        stock: 90,
        barcode: 'ADV-AG4-1KG',
        isFeatured: false,
        is_featured: false
    }
];

export const mockReviews: Review[] = [
    {
        id: 'r-beche-1',
        vendorId: 'vendor-tast',
        userName: 'Masanja K.',
        rating: 5,
        comment: 'Beche Plus did an amazing job selective weeding my rice paddy. Safe and efficient!',
        date: '2026-05-10T14:30:00Z'
    },
    {
        id: 'r-seedco-1',
        vendorId: 'vendor-tast',
        userName: 'Rehema M.',
        rating: 5,
        comment: 'SC 719 yields are massive. Very reliable hybrid seed. High germination rate.',
        date: '2026-05-12T09:15:00Z'
    },
    {
        id: 'r-tast-1',
        vendorId: 'vendor-tast',
        userName: 'Hamisi J.',
        rating: 4,
        comment: 'TAST Agribusiness delivered fast through mobile booking, and the herbicides were extremely authentic.',
        date: '2026-05-18T16:45:00Z'
    }
];

export const mockOrders: Order[] = [];

export const mockTruckTypes: TruckType[] = [
    // Fix: Changed '=' to ':' for strokeLinejoin property in object literal
    { id: 'pickup', name: 'Pickup Truck', capacity: 'Up to 1 Ton', icon: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4h16v10h-4v-4h-2v4H4V4zM2 14h20M2 18h20" })) },
];

export const mockLogisticsBookings: LogisticsBooking[] = [];
export const mockTools: Tool[] = [];
export const mockToolBookings: ToolBooking[] = [];
