import React from 'react';
import { LogisticsBooking } from '../types';
import { mockTruckTypes } from '../data/mockData';

interface LogisticsProps {
    bookings: LogisticsBooking[];
    onBookNew: () => void;
}

const Logistics: React.FC<LogisticsProps> = ({ bookings, onBookNew }) => {

    const getTruckName = (truckTypeId: string) => {
        return mockTruckTypes.find(t => t.id === truckTypeId)?.name || 'Unknown Truck';
    };

    const getStatusBadge = (status: LogisticsBooking['status']) => {
        const colorClasses = {
            Delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            Confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'In Transit': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[status]}`}>{status}</span>;
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Logistics Bookings</h2>
                <button onClick={onBookNew} className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    + Book a Truck
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Pickup</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Dropoff</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">Truck</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">Pickup Date</th>
                                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {bookings.length > 0 ? (
                                bookings.map(booking => (
                                    <tr key={booking.id}>
                                        <td className="py-3 px-4 text-gray-800 dark:text-gray-100">{booking.pickupLocation}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{booking.dropoffLocation}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300 hidden md:table-cell">{getTruckName(booking.truckTypeId)}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300 hidden md:table-cell">{new Date(booking.pickupDate).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 text-center">{getStatusBadge(booking.status)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        You have no logistics bookings yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Logistics;