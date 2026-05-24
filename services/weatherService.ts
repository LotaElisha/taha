
import { Weather, CropAdvice } from '../types';
import { getWeatherAndCropAdvice } from './geminiService';

export const getWeatherData = async (coords: { lat: number; lon: number }, language: string = 'English'): Promise<{ weather: Weather, advice: CropAdvice }> => {
    // Calling our AI service which uses Search Grounding for real-time local weather
    return await getWeatherAndCropAdvice(coords.lat, coords.lon, language);
};
