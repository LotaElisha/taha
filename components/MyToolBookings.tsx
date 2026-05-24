import React from 'react';
import { ToolBooking, Tool, ToolBookingStatus } from '../types';

interface MyToolBookingsProps {
    bookings: ToolBooking[];
    tools: Tool[];
}

const MyToolBookings: React.FC<MyToolBookingsProps> = ({ bookings, tools }) => {
    const getToolInfo = (toolId: string) => tools.find(t => t.id === toolId);

    const getStatusBadge = (status: ToolBookingStatus) => {
        const colorClasses: { [key in ToolBookingStatus]: string } = {
            Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            Confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            Active: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
            Completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[status]}`}>{status}</span>;
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-brand-green-dark dark:text-gray-100 mb-6">My Tool Bookings</h1>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="text-left py-3 px-4">Tool</th>
                                <th className="text-left py-3 px-4">Owner</th>
                                <th className="text-left py-3 px-4">Dates</th>
                                <th className="text-left py-3 px-4">Total Cost (Tsh)</th>
                                <th className="text-center py-3 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {bookings.length > 0 ? (
                                bookings.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(booking => {
                                    const tool = getToolInfo(booking.toolId);
                                    return (
                                        <tr key={booking.id}>
                                            <td className="py-3 px-4 font-semibold">{tool?.name || 'Unknown Tool'}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{tool?.owner.name || 'N/A'}</td>
                                            <td className="py-3 px-4 text-sm">{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 font-medium">{booking.totalCost.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-center">{getStatusBadge(booking.status)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        You have not booked any tools yet.
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

export default MyToolBookings;
