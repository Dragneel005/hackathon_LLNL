import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css'; // <--- IMPORTANT: Import the new CSS file here!

// --- Configuration ---
const API_BASE_URL = 'http://localhost:4000/api';

// --- Icon Components (same as before, but with consistent sizing) ---
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);
const CheckCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1  0 001.414 0l4-4z" clipRule="evenodd" />
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
        <div className="app-container">
            <Header onAddDevice={() => setAddModalOpen(true)} />
            
            <main className="main-content">
                <div className="search-container">
                    <h2 className="dashboard-title">Inventory Dashboard</h2>
                    <input
                        type="text"
                        placeholder="Search by DOE, Model, or User..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="alert-error" role="alert">
                        <p>{error}</p>
                        <button onClick={() => setError(null)}>&times;</button>
                    </div>
                )}

                <DeviceTable
                    devices={filteredDevices}
                    isLoading={isLoading}
                    onCheckIn={(device) => { setSelectedDevice(device); setCheckInModalOpen(true); }}
                    onCheckOut={(device) => { setSelectedDevice(device); setCheckOutModalOpen(true); }}
                    onShowHistory={handleShowHistory}
                />
            </main>
            
            <Footer />

            {/* --- Modals --- */}
            <AddDeviceModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAddDevice} />
            <CheckOutModal isOpen={isCheckOutModalOpen} onClose={() => setCheckOutModalOpen(false)} onCheckOut={handleCheckOut} device={selectedDevice} />
            <CheckInModal isOpen={isCheckInModalOpen} onClose={() => setCheckInModalOpen(false)} onCheckIn={handleCheckIn} device={selectedDevice} />
            <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setHistoryModalOpen(false)} device={selectedDevice} history={deviceHistory} />
        </div>
    );
}

// --- Sub-Components (Updated with new custom CSS classes) ---

const Header = ({ onAddDevice }) => (
    <header className="header">
        <div>
            <h1 className="header-title">Loaner Fleet Manager</h1>
            <p className="header-subtitle">Efficiently manage your company's valuable assets.</p>
        </div>
        <button
            onClick={onAddDevice}
            className="header-button"
        >
            <PlusIcon />
            Add New Device
        </button>
    </header>
);

const DeviceTable = ({ devices, isLoading, onCheckIn, onCheckOut, onShowHistory }) => {
    if (isLoading) {
        return <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-500 text-lg">Loading inventory data...</p></div>;
    }

    if (devices.length === 0) {
        return <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-500 text-lg">No devices found. Use the "Add New Device" button to populate the inventory.</p></div>;
    }

    return (
        <div className="table-container">   
            <table className="device-table">
                <thead className="table-header">
                    <tr>
                        <th scope="col">DOE Number</th>
                        <th scope="col">MAC/PC</th>
                        <th scope="col">Status</th>
                        <th scope="col">Current User</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody className="table-body">
                    {devices.map((device) => (
                        <tr key={device.id}>
                            <td className="serial-number">{device.serialNumber}</td>
                            <td>{device.model}</td>
                            <td>
                                {device.status === 'Available' ? (
                                    <span className="status-badge status-available">
                                        <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                                        Available
                                    </span>
                                ) : (
                                    <span className="status-badge status-checked-out">
                                        <XCircleIcon className="w-4 h-4 mr-1.5" />
                                        Checked Out
                                    </span>
                                )}
                            </td>
                            <td>{device.currentUser || 'N/A'}</td>
                            <td>
                                <div className="action-buttons">
                                    {device.status === 'Available' ? (
                                        <button onClick={() => onCheckOut(device)} className="action-button button-checkout">Check Out</button>
                                    ) : (
                                        <button onClick={() => onCheckIn(device)} className="action-button button-checkin">Check In</button>
                                    )}
                                    <button onClick={() => onShowHistory(device)} className="button-history" title="View History">
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onClose} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body">
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
        if (!serialNumber || !model) {
            alert('Serial Number and Model are required!'); // Simple validation feedback
            return;
        }
        onAdd({ serialNumber, model, notes });
        setSerialNumber('');
        setModel('');
        setNotes('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Device">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="serialNumber" className="form-label">DOE Number</label>
                    <input type="text" id="serialNumber" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                    <label htmlFor="model" className="form-label">Model</label>
                    <input type="text" id="model" value={model} onChange={(e) => setModel(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                    <label htmlFor="notes" className="form-label">Notes (Optional)</label>
                    <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="4" className="form-textarea"></textarea>
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
                    <button type="submit" className="button-primary-modal">Add Device</button>
                </div>
            </form>
        </Modal>
    );
};

const CheckOutModal = ({ isOpen, onClose, onCheckOut, device }) => {
    const [userName, setUserName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userName) {
            alert("User's Name is required!");
            return;
        }
        onCheckOut(userName);
        setUserName('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Check Out Device">
            {device && (
                <div>
                    <p className="modal-text">Checking out: <span className="highlight-text">{device.model}</span> (S/N: {device.serialNumber})</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="userName" className="form-label">User's Name</label>
                            <input type="text" id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} className="form-input" required />
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
                            <button type="submit" className="button-primary-modal">Confirm Check Out</button>
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
                    <p className="modal-text">Are you sure you want to check in the <span className="highlight-text">{device.model}</span> (S/N: {device.serialNumber}) from <span className="highlight-text">{device.currentUser}</span>?</p>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
                        <button onClick={onCheckIn} className="button-primary-modal confirm-button-success">Confirm Check In</button>
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
        <Modal isOpen={isOpen} onClose={onClose} title={`History for ${device?.model || 'Device'}`}>
            {device && (
                <div className="history-list">
                    <ul className="history-list-items">
                        {history.length > 0 ? history.map(entry => (
                            <li key={entry.id} className="history-list-item">
                                <p className="history-user">User: {entry.userName}</p>
                                <p>Checked Out: <span>{formatDate(entry.checkOutDate)}</span></p>
                                <p>Checked In: <span>{formatDate(entry.checkInDate)}</span></p>
                            </li>
                        )) : <p className="text-center text-gray-500 text-md py-4">No history records found for this device.</p>}
                    </ul>
                </div>
            )}
        </Modal>
    );
};

const Footer = () => (
    <footer className="footer">
        <p>© 2025 Loaner Fleet Manager | Powered by Node.js, Express, SQLite & React.js with Custom CSS</p>
    </footer>
);