import axios from 'axios'
import { BASE_URL } from './apiPaths';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Request integration
axiosInstance.interceptors.request.use(
    (config) => {
        // Add any request modifications here, like adding auth tokens
        const accessToken = localStorage.getItem('token');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // Handle successful responses
        return response;
    },
    (error) => {
        // Handle errors globally
        if (error.response) {

            if (error.response.status === 401) {
                // Handle unauthorized access, e.g., redirect to login
                window.location.href = '/login';
                // Optionally, you can redirect to login page here
            } else if (error.response.status === 500) {
                // Handle server errors
                console.error('Server error: Please try again later.');
            }
        } else if (error.code === 'ECONNABORTED') {
            // Handle timeout errors
            console.error('Request timed out. Please try again later.');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;