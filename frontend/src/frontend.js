import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:4000/api';

// --- Icon Components (same as before) ---
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);
const CheckCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);
const XCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);
const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
);


// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isCheckOutModalOpen, setCheckOutModalOpen] = useState(false);
    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);

    const [selectedDevice, setSelectedDevice] = useState(null);
    const [deviceHistory, setDeviceHistory] = useState([]);

    // --- Data Fetching ---
    const fetchDevices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/devices`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setDevices(result.data);
        } catch (e) {
            console.error("Error fetching devices:", e);
            setError("Failed to fetch inventory data. Is the backend server running?");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    // --- Memoized Filtered Devices ---
    const filteredDevices = useMemo(() => {
        return devices.filter(device =>
            device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (device.currentUser && device.currentUser.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [devices, searchTerm]);

    // --- API Call Handlers ---
    const handleApiCall = async (apiCall, successCallback) => {
        try {
            const response = await apiCall();
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            if(successCallback) successCallback();
            fetchDevices(); // Re-fetch all data to ensure UI is in sync
        } catch (e) {
            console.error("API call failed:", e);
            setError(e.message || "An unexpected error occurred.");
        }
    };

    const handleAddDevice = async (deviceData) => {
        await handleApiCall(
            () => fetch(`${API_BASE_URL}/devices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deviceData),
            }),
            () => setAddModalOpen(false)
        );
    };

    const handleCheckOut = async (userName) => {
        await handleApiCall(
            () => fetch(`${API_BASE_URL}/devices/${selectedDevice.id}/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName }),
            }),
            () => {
                setCheckOutModalOpen(false);
                setSelectedDevice(null);
            }
        );
    };

    const handleCheckIn = async () => {
        await handleApiCall(
            () => fetch(`${API_BASE_URL}/devices/${selectedDevice.id}/checkin`, {
                method: 'POST',
            }),
            () => {
                setCheckInModalOpen(false);
                setSelectedDevice(null);
            }
        );
    };

    const handleShowHistory = async (device) => {
        setSelectedDevice(device);
        try {
            const response = await fetch(`${API_BASE_URL}/devices/${device.id}/history`);
            if (!response.ok) throw new Error("Failed to fetch history");
            const result = await response.json();
            setDeviceHistory(result.data);
            setHistoryModalOpen(true);
        } catch (e) {
            console.error("Error fetching history:", e);
            setError("Failed to fetch device history.");
        }
    };

    // --- Render ---
    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Header onAddDevice={() => setAddModalOpen(true)} />
                
                <main className="bg-white rounded-xl shadow-md p-6 mt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-2xl font-bold text-gray-700">Inventory</h2>
                        <input
                            type="text"
                            placeholder="Search by Serial, Model, or User..."
                            className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert"><p>{error}</p><button onClick={() => setError(null)} className="font-bold ml-4">X</button></div>}

                    <DeviceTable
                        devices={filteredDevices}
                        isLoading={isLoading}
                        onCheckIn={(device) => { setSelectedDevice(device); setCheckInModalOpen(true); }}
                        onCheckOut={(device) => { setSelectedDevice(device); setCheckOutModalOpen(true); }}
                        onShowHistory={handleShowHistory}
                    />
                </main>
                
                <Footer />
            </div>

            {/* --- Modals --- */}
            <AddDeviceModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAddDevice} />
            <CheckOutModal isOpen={isCheckOutModalOpen} onClose={() => setCheckOutModalOpen(false)} onCheckOut={handleCheckOut} device={selectedDevice} />
            <CheckInModal isOpen={isCheckInModalOpen} onClose={() => setCheckInModalOpen(false)} onCheckIn={handleCheckIn} device={selectedDevice} />
            <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setHistoryModalOpen(false)} device={selectedDevice} history={deviceHistory} />
        </div>
    );
}

// --- Sub-Components (Identical to previous version, but included for completeness) ---

const Header = ({ onAddDevice }) => (
    <header className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-200">
        <div>
            <h1 className="text-3xl font-bold text-indigo-600">Loaner Inventory</h1>
            <p className="text-gray-500 mt-1">Manage your company's loaner computer fleet.</p>
        </div>
        <button
            onClick={onAddDevice}
            className="mt-4 sm:mt-0 flex items-center justify-center bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        >
            <PlusIcon />
            Add New Device
        </button>
    </header>
);

const DeviceTable = ({ devices, isLoading, onCheckIn, onCheckOut, onShowHistory }) => {
    if (isLoading) {
        return <div className="text-center py-10"><p className="text-gray-500">Loading inventory...</p></div>;
    }

    if (devices.length === 0) {
        return <div className="text-center py-10"><p className="text-gray-500">No devices found. Click "Add New Device" to get started.</p></div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current User</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {devices.map((device) => (
                        <tr key={device.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.serialNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.model}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {device.status === 'Available' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                                        Available
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <XCircleIcon className="w-4 h-4 mr-1.5" />
                                        Checked Out
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.currentUser || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                    {device.status === 'Available' ? (
                                        <button onClick={() => onCheckOut(device)} className="text-indigo-600 hover:text-indigo-900 font-semibold">Check Out</button>
                                    ) : (
                                        <button onClick={() => onCheckIn(device)} className="text-green-600 hover:text-green-900 font-semibold">Check In</button>
                                    )}
                                    <button onClick={() => onShowHistory(device)} className="text-gray-400 hover:text-gray-600" title="View History">
                                        <HistoryIcon />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const AddDeviceModal = ({ isOpen, onClose, onAdd }) => {
    const [serialNumber, setSerialNumber] = useState('');
    const [model, setModel] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!serialNumber || !model) return;
        onAdd({ serialNumber, model, notes });
        setSerialNumber('');
        setModel('');
        setNotes('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Device">
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Serial Number</label>
                        <input type="text" id="serialNumber" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div>
                        <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
                        <input type="text" id="model" value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Cancel</button>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Add Device</button>
                </div>
            </form>
        </Modal>
    );
};

const CheckOutModal = ({ isOpen, onClose, onCheckOut, device }) => {
    const [userName, setUserName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userName) return;
        onCheckOut(userName);
        setUserName('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Check Out Device">
            {device && (
                <div>
                    <p className="mb-4">Checking out: <span className="font-semibold">{device.model}</span> (S/N: {device.serialNumber})</p>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="userName" className="block text-sm font-medium text-gray-700">User's Name</label>
                            <input type="text" id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Cancel</button>
                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Confirm Check Out</button>
                        </div>
                    </form>
                </div>
            )}
        </Modal>
    );
};

const CheckInModal = ({ isOpen, onClose, onCheckIn, device }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Check In">
            {device && (
                <div>
                    <p className="mb-6">Are you sure you want to check in the <span className="font-semibold">{device.model}</span> (S/N: {device.serialNumber}) from <span className="font-semibold">{device.currentUser}</span>?</p>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Cancel</button>
                        <button onClick={onCheckIn} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Confirm Check In</button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const HistoryModal = ({ isOpen, onClose, device, history }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`History for ${device?.model || ''}`}>
            {device && (
                <div className="max-h-96 overflow-y-auto">
                    <ul className="space-y-3">
                        {history.length > 0 ? history.map(entry => (
                            <li key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-semibold text-gray-800">User: {entry.userName}</p>
                                <p className="text-sm text-gray-500">Checked Out: {formatDate(entry.checkOutDate)}</p>
                                <p className="text-sm text-gray-500">Checked In: {formatDate(entry.checkInDate)}</p>
                            </li>
                        )) : <p>No history for this device.</p>}
                    </ul>
                </div>
            )}
        </Modal>
    );
};

const Footer = () => (
    <footer className="text-center mt-8 text-sm text-gray-400">
        <p>Inventory System | Powered by Node.js & SQLite</p>
    </footer>
);
