import React, { useState, useMemo } from 'react';
import { User, Product, Order } from '../types';
import SimpleBarChart from './SimpleBarChart';
import SimpleLineChart from './SimpleLineChart';

interface AnalyticsDashboardProps {
  users: User[];
  products: Product[];
  orders: Order[];
}

const StatCard: React.FC<{ title: string; value: string | number; change?: string; }> = ({ title, value, change }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">{title}</h3>
      <p className="text-3xl font-bold text-brand-green-dark dark:text-white mt-2">{value}</p>
      {change && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{change}</p>}
    </div>
);

type DateRange = '7d' | '30d' | 'all';

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ users, products, orders }) => {
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const filteredOrders = useMemo(() => {
    if (dateRange === 'all') return orders;
    const now = new Date();
    const daysToSubtract = dateRange === '7d' ? 7 : 30;
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));
    return orders.filter(order => new Date(order.date) >= cutoffDate);
  }, [orders, dateRange]);
  
  const filteredUsers = useMemo(() => {
    // This is a placeholder for new user calculation. A real app would have a `createdAt` date on the user model.
    // For now, we'll just show total users.
    return users;
  }, [users, dateRange]);


  // KPIs Calculation
  const totalRevenue = useMemo(() => filteredOrders.reduce((sum, order) => sum + order.total, 0), [filteredOrders]);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Chart Data Calculation
  const salesOverTimeData = useMemo(() => {
    const salesByDate: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
        const date = new Date(order.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
        salesByDate[date] = (salesByDate[date] || 0) + order.total;
    });
    return Object.entries(salesByDate).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime()).map(([date, total]) => ({ x: new Date(date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}), y: total }));
  }, [filteredOrders]);
  
  const topProductsData = useMemo(() => {
    const productSales: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            productSales[item.product.name] = (productSales[item.product.name] || 0) + item.quantity;
        });
    });
    return Object.entries(productSales).sort(([, a], [, b]) => b - a).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [filteredOrders]);

  const topVendorsData = useMemo(() => {
    const vendorSales: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            vendorSales[item.product.vendor.name] = (vendorSales[item.product.vendor.name] || 0) + (item.product.price * item.quantity);
        });
    });
    return Object.entries(vendorSales).sort(([, a], [, b]) => b - a).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [filteredOrders]);

  const handleExport = () => {
    const headers = ['OrderID', 'Date', 'CustomerName', 'Total', 'Status', 'Channel'];
    const csvContent = [
        headers.join(','),
        ...filteredOrders.map(order => {
            const customerName = users.find(u => u.id === order.userId)?.name || (order.channel === 'pos' ? 'POS Sale' : 'Guest');
            // Ensure customer name with commas is wrapped in quotes
            const safeCustomerName = `"${customerName.replace(/"/g, '""')}"`;
            return [order.id, new Date(order.date).toISOString(), safeCustomerName, order.total, order.status, order.channel || 'online'].join(',');
        })
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const DateRangeButton: React.FC<{range: DateRange, label: string}> = ({ range, label }) => (
      <button onClick={() => setDateRange(range)} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${dateRange === range ? 'bg-brand-green text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300'}`}>
          {label}
      </button>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Analytics & Reports</h2>
        <div className="flex items-center space-x-2">
            <DateRangeButton range="7d" label="Last 7 Days" />
            <DateRangeButton range="30d" label="Last 30 Days" />
            <DateRangeButton range="all" label="All Time" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`Tsh ${totalRevenue.toLocaleString()}`} />
        <StatCard title="Total Orders" value={totalOrders.toLocaleString()} />
        <StatCard title="Average Order Value" value={`Tsh ${averageOrderValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} />
        <StatCard title="Total Users" value={filteredUsers.length.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 gap-8">
         <SimpleLineChart data={salesOverTimeData} title="Sales Over Time" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SimpleBarChart data={topProductsData} title="Top Selling Products (Units)" />
        <SimpleBarChart data={topVendorsData} title="Top Performing Vendors (Revenue)" colorClass="fill-brand-green-light" />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Sales Report</h3>
            <button onClick={handleExport} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors text-sm inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export CSV</span>
            </button>
        </div>
        <div className="overflow-x-auto max-h-96">
            <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                    <tr>
                        <th className="text-left py-2 px-3">Order ID</th>
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-left py-2 px-3">Customer</th>
                        <th className="text-right py-2 px-3">Total (Tsh)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredOrders.map(order => (
                        <tr key={order.id}>
                            <td className="py-2 px-3 font-mono text-xs">{order.id}</td>
                            <td className="py-2 px-3">{new Date(order.date).toLocaleDateString()}</td>
                            <td className="py-2 px-3">{users.find(u => u.id === order.userId)?.name || 'POS/Guest'}</td>
                            <td className="py-2 px-3 text-right font-semibold">{order.total.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;