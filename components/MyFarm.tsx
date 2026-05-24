
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { Farm, Weather } from '../types';
import { getWeatherData } from '../services/weatherService';
import FarmFormModal from './FarmFormModal';
import { toast } from './ui/sonner';

const WeatherDisplay: React.FC<{ coords: { lat: number, lon: number } }> = ({ coords }) => {
    const [weather, setWeather] = useState<Weather | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            setIsLoading(true);
            try {
                const data = await getWeatherData(coords);
                setWeather(data.weather);
            } catch (error) {
                console.error("Failed to fetch weather", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeather();
    }, [coords]);

    if (isLoading) {
        return <div className="text-center p-2 text-sm text-gray-500 dark:text-gray-400">Loading weather...</div>;
    }

    if (!weather) {
        return <div className="text-center p-2 text-sm text-red-500">Weather unavailable</div>;
    }

    return (
        <div className="bg-blue-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <span className="text-3xl">{weather.icon}</span>
                <div>
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{weather.temp}°C</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{weather.condition}</p>
                </div>
            </div>
            <div className="text-xs text-right text-gray-600 dark:text-gray-300 space-y-1">
                <p>Humidity: {weather.humidity}%</p>
                <p>Wind: {weather.windSpeed} km/h</p>
            </div>
        </div>
    );
};


const FarmCard: React.FC<{ farm: Farm; onEdit: (farm: Farm) => void; onDelete: (farmId: string) => void; }> = ({ farm, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden flex flex-col">
        <div className="p-4">
            <h3 className="text-xl font-bold text-brand-green-dark dark:text-gray-100">{farm.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>{farm.location}</span>
            </p>
            <div className="mt-3 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <p><strong>Size:</strong> {farm.size} acres</p>
                <p><strong>Main Crops:</strong> {farm.mainCrops.join(', ')}</p>
            </div>
        </div>
        <div className="mt-auto p-4 space-y-3">
             <WeatherDisplay coords={farm.coords} />
             <div className="flex justify-end space-x-2">
                <button onClick={() => onEdit(farm)} className="text-sm font-medium text-blue-600 hover:underline">Edit</button>
                <button onClick={() => onDelete(farm.id)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
            </div>
        </div>
    </div>
);


const MyFarm: React.FC = () => {
    const { user, updateUserAuthData } = useAuth();
    const { updateUser } = useUser();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [farmToEdit, setFarmToEdit] = useState<Farm | null>(null);
    
    const farms = user?.farms || [];

    const handleOpenModal = (farm: Farm | null = null) => {
        setFarmToEdit(farm);
        setIsModalOpen(true);
    };

    const handleDelete = (farmId: string) => {
        if (!user) return;
        const farmToRestore = farms.find(f => f.id === farmId);
        const newFarms = farms.filter(f => f.id !== farmId);
        const updatedUser = { ...user, farms: newFarms };

        updateUserAuthData({ farms: newFarms });
        updateUser(updatedUser);

        toast('Farm deleted.', {
            action: {
                label: 'Undo',
                onClick: () => {
                    if (!farmToRestore) return;
                    const restored = [...newFarms, farmToRestore];
                    updateUserAuthData({ farms: restored });
                    updateUser({ ...user, farms: restored });
                },
            },
        });
    };

    const handleSave = (farmData: Omit<Farm, 'id' | 'userId'>) => {
        if (!user) return;
        
        let newFarms: Farm[];
        if (farmToEdit) {
            newFarms = farms.map(f => f.id === farmToEdit.id ? { ...farmToEdit, ...farmData } : f);
        } else {
            const newFarm: Farm = {
                id: `farm-${Date.now()}`,
                userId: user.id,
                ...farmData
            };
            newFarms = [...farms, newFarm];
        }

        const updatedUser = { ...user, farms: newFarms };
        updateUserAuthData({ farms: newFarms });
        updateUser(updatedUser);

        setIsModalOpen(false);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Farms Dashboard</h2>
                <button onClick={() => handleOpenModal()} className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    + Add Farm
                </button>
            </div>
            {farms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {farms.map(farm => (
                        <FarmCard key={farm.id} farm={farm} onEdit={() => handleOpenModal(farm)} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                     <h3 className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-100">No Farms Added Yet</h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Add your farm to get localized weather updates and more.</p>
                </div>
            )}
            <FarmFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                farmToEdit={farmToEdit}
            />
        </div>
    );
};

export default MyFarm;
