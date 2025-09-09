import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Lock, Unlock, User, LogOut, Package, Activity, Clock, Search, Plus, Camera, 
  DoorOpen, DoorClosed, Usb, Calendar, AlertTriangle, QrCode, Shield, 
  CheckCircle, XCircle, Eye, BookOpen, Barcode
} from 'lucide-react';

import Webcam from 'react-webcam';
import QrScanner from 'qr-scanner';
import { BrowserMultiFormatReader } from '@zxing/browser';

const API_BASE_URL = 'https://checmiallab.up.railway.app';

const ChemicalStorageSystem = () => {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showReportsSection, setShowReportsSection] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [selectedReportChemical, setSelectedReportChemical] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [monthlyReportData, setMonthlyReportData] = useState(null);
  const [yearlyReportData, setYearlyReportData] = useState(null);
  const [bottleStatus, setBottleStatus] = useState({});
  const [showBottleActions, setShowBottleActions] = useState(false);
  const [selectedChemicalForBottle, setSelectedChemicalForBottle] = useState(null);
  const [loginAsAdmin, setLoginAsAdmin] = useState(false);
  const [allChemicalsForReports, setAllChemicalsForReports] = useState([]);
  const [registeredDevices, setRegisteredDevices] = useState([]); // Store registered devices
  const [detectedDevice, setDetectedDevice] = useState(null); // Currently detected device
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  // NEW: Enhanced location and access states
  const [currentLocation, setCurrentLocation] = useState('outside'); // 'outside', 'lab_room', 'cabinet_open'
  const [cabinetLocked, setCabinetLocked] = useState(true);
  const [showLabRoom, setShowLabRoom] = useState(false);
  const [showFaceScanForRoom, setShowFaceScanForRoom] = useState(false);
  // REMOVED: showFaceScanForCabinet state is no longer needed
  const [pendingCabinetAction, setPendingCabinetAction] = useState(null); // 'unlock' or 'lock'
  const [usbDeviceDetected, setUsbDeviceDetected] = useState(false);
  const [showUSBPrompt, setShowUSBPrompt] = useState(false);
  // At the top of ChemicalStorageSystem, with your other useState hooks
  const [todaySlots, setTodaySlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  // State for webcam and multi-step UI flows
  const [showAdminViewModal, setShowAdminViewModal] = useState(false);
  const [selectedReservationForView, setSelectedReservationForView] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoginFaceScan, setIsLoginFaceScan] = useState(false);
  const [isRegisterFaceScan, setIsRegisterFaceScan] = useState(false);
  const [newUserForFaceScan, setNewUserForFaceScan] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const webcamRef = useRef(null);
  const [currentView, setCurrentView] = useState('dashboard'); 
  // Add this new state variable
const [showReservationManagement, setShowReservationManagement] = useState(false);
  // Application-specific state
  const [chemicals, setChemicals] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [accessAction, setAccessAction] = useState({ action: 'withdraw', quantity: 0, batch_number: '' });
  const [newChemical, setNewChemical] = useState({
    name: '', chemical_formula: '', bottle_number: '', current_quantity: 0,
    unit: '', minimum_threshold: 0, maximum_capacity: 0, 
    safety_level: 'Low'
  });
  const [newUser, setNewUser] = useState({ 
  username: '', 
  password: '', 
  full_name: '', 
  name_katakana: '',  
  user_id: '',        
  affiliation: '',    
  role: 'user',
  email: ''
});
  const [searchQuery, setSearchQuery] = useState('');
  const [showUSBScanForRegistration, setShowUSBScanForRegistration] = useState(false);
  const [availableUSBDevices, setAvailableUSBDevices] = useState([]);
  const [selectedUSBDevice, setSelectedUSBDevice] = useState(null);
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [showAddChemicalForm, setShowAddChemicalForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [selectedCabinet, setSelectedCabinet] = useState(null); // 'general' or 'toxic'
  const [toxicChemicals, setToxicChemicals] = useState([]);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationData, setReservationData] = useState({
    date: '',
    time_slot: '',
    assignment_no: '',
    user_affiliation: '',
    user_id_no: '',
    reagent_name: '',
    amount_needed: 0,
    unit: '',
    purpose: '',
    
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [toxicAccess, setToxicAccess] = useState({ has_access: false });
  const [adminReservations, setAdminReservations] = useState([]);
   
  const loadChemicals = useCallback(async () => { try { const data = await apiCall('/chemicals'); setChemicals(data); } catch (err) { console.error(err.message); }}, [token]);
  const loadAccessLogs = useCallback(async () => { try { const data = await apiCall('/admin/lab-sessions'); setAccessLogs(data); } catch (err) { console.error(err.message); }}, [token]);
  const loadInventoryLogs = useCallback(async () => { try { const data = await apiCall('/inventory-logs'); setInventoryLogs(data); } catch (err) { console.error(err.message); }}, [token]);
  const loadUsers = useCallback(async () => { try { const data = await apiCall('/users'); setUsers(data); } catch (err) { console.error(err.message); }}, [token]);
  
  
  const loadAllChemicalsForReports = useCallback(async () => {
    try {
      const data = await apiCall('/all-chemicals');
      setAllChemicalsForReports(data);   // ✅ update state
      console.log("Loaded chemicals for dropdown:", data);
    } catch (err) {
    console.error(err.message);
    }
  }, [token]);
 


  // NEW: Toxic cabinet specific API calls
  const loadToxicChemicals = useCallback(async () => {
    try {
      const data = await apiCall('/toxic-chemicals');
      setToxicChemicals(data);
    } catch (err) {
      console.error(err.message);
    }
  }, [token]);

  const loadAvailableSlots = async (date) => {
    try {
      const data = await apiCall(`/available-slots/${date}`);
      setAvailableSlots(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadUserReservations = useCallback(async () => {
    try {
      const data = await apiCall('/my-toxic-reservations');
      setUserReservations(data);
    } catch (err) {
      console.error(err.message);
    }
  }, [token]);

  const loadAdminReservations = useCallback(async () => {
    try {
      const data = await apiCall('/admin/toxic-reservations');
      setAdminReservations(data);
    } catch (err) {
      console.error(err.message);
    }
  }, [token]);

  const checkToxicAccess = useCallback(async () => {
    try {
      const data = await apiCall('/check-toxic-access');
      setToxicAccess(data);
    } catch (err) {
      console.error(err.message);
    }
  }, [token]);

 const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiCall('/toxic-reservation', {
        method: 'POST',
        body: JSON.stringify(reservationData)
      });
      setShowReservationForm(false);
      setReservationData({ date: '', time_slot: '', assignment_no: '', user_affiliation: '', user_id_no: '', reagent_name: '', amount_needed: 0, unit: '', purpose: '' });
      loadUserReservations();
      alert('Your request has been sent for approval. You will get an email configuration after approval.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 const handleReservationApproval = async (reservationId, action) => {
    setLoading(true);
    setError('');
    try {
      await apiCall('/admin/toxic-reservation-approval', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: reservationId,
          action: action,
        })
      });
      await loadAdminReservations();
      setShowAdminViewModal(false);
      setSelectedReservationForView(null);
      alert(`Reservation ${action}d successfully!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
const BarcodeScannerModal = ({ onResult, onClose }) => {
  const webcamRef = useRef(null);
  const codeReaderRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();

    if (webcamRef.current && webcamRef.current.video) {
      codeReaderRef.current
        .decodeFromVideoDevice(undefined, webcamRef.current.video, (result, err) => {
          if (result) {
            onResult(result.getText());
            if (controlsRef.current) controlsRef.current.stop(); // stop scanning
          }

          // Filter out "no barcode found" errors
          if (err && err.name !== "NotFoundException") {
            console.error("Barcode scan error:", err);
          }
        })
        .then(controls => {
          controlsRef.current = controls;
        })
        .catch(err => {
          console.error("Failed to start barcode scanner:", err);
        });
    }

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-xl relative w-full max-w-md">
        <h3 className="text-lg font-bold text-center mb-2">Scan Chemical Barcode</h3>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full rounded"
          videoConstraints={{ facingMode: "environment" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/4 border-4 border-red-500 rounded-lg opacity-75" />
      </div>
      <button
        onClick={onClose}
        className="mt-4 bg-white text-black py-2 px-6 rounded-full font-semibold"
      >
        Cancel
      </button>
    </div>
  );
};

 

  // ADD THESE FUNCTIONS:
// Function to load registered devices for the current user
const loadRegisteredDevices = useCallback(async () => {
  if (!user) return;
  
  try {
    // Get previously authorized devices that match this user's registered device
    const devices = await navigator.usb.getDevices();
    setRegisteredDevices(devices);
    
    // Check if any of the currently connected devices match the user's registered device
    await checkForUserDevice();
  } catch (error) {
    console.error('Failed to load registered devices:', error);
  }
}, [user]);

// Function to check if user's registered device is connected
const checkForUserDevice = async () => {
  if (!navigator.usb || !user?.usb_device_id) return false;
  
  try {
    const devices = await navigator.usb.getDevices();
    console.log('Available devices:', devices);
    
    // Check if any connected device matches user's registered device ID
    const userDevice = devices.find(device => {
      const deviceId = `${device.vendorId}-${device.productId}-${device.serialNumber || 'unknown'}`;
      return user.usb_device_id === deviceId;
    });
    
    if (userDevice) {
      console.log('User device found:', userDevice);
      setDetectedDevice(userDevice);
      setUsbDeviceDetected(true);
      return true;
    } else {
      console.log('User device not found among connected devices');
      setDetectedDevice(null);
      setUsbDeviceDetected(false);
      return false;
    }
  } catch (error) {
    console.error('Failed to check for user device:', error);
    return false;
  }
};
 // ADD USER DEPENDENCY


  // const handleReservationApproval = async (reservationId, action, notes = '') => {
  //   setLoading(true);
  //   try {
  //     await apiCall('/admin/toxic-reservation-approval', {
  //       method: 'POST',
  //       body: JSON.stringify({
  //         reservation_id: reservationId,
  //         action: action,
  //         admin_notes: notes
  //       })
  //     });
      
  //     loadAdminReservations();
  //     setShowApprovalModal(false);
  //     setSelectedReservation(null);
  //     alert(`Reservation ${action}d successfully!`);
  //   } catch (err) {
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleBarcodeScanResult = (scannedText) => {
    if (scannedText) {
      console.log('Barcode Scanned:', scannedText);
      // Let's assume the barcode contains the chemical name or a product code.
      // We'll use it to pre-fill the 'name' and 'bottle_number' fields.
      setNewChemical(prev => ({
        ...prev,
        name: scannedText,
        bottle_number: scannedText
      }));
      
      // Close the scanner and open the form
      setShowBarcodeScanner(false);
      setShowAddChemicalForm(true);
    }
  };
const handleQRScan = async (result) => {
  if (!result) {
    console.log("No QR scan result received");
    return;
  }

  const qrData = result.getText ? result.getText() : result; // Handle ZXing Result object
  console.log("QR scan data received:", qrData);

  // If the cabinet is already unlocked, this is a lock action
  if (!cabinetLocked && selectedCabinet === 'toxic') {
    console.log("Locking toxic cabinet via QR.");
    setCabinetLocked(true);
    setSelectedCabinet(null);
    setCurrentLocation('lab_room');
    setShowQRScanner(false);
    try {
      await logAccess('lock_toxic_cabinet', 'toxic_cabinet', 'qr_code');
      console.log("Successfully logged lock_toxic_cabinet");
    } catch (logErr) {
      console.error("Logging error during toxic cabinet lock:", logErr.message);
      setError("Failed to log cabinet lock: " + logErr.message);
    }
    alert('Toxic cabinet has been locked.');
    return;
  }

  // Otherwise, this is an unlock action
  try {
    console.log("Attempting to verify QR for unlock:", qrData);
    const formData = new FormData();
    formData.append('qr_data', qrData);
    const response = await apiCall('/verify-toxic-qr', {
      method: 'POST',
      body: formData
    });

    setShowQRScanner(false);
    setSelectedCabinet('toxic');
    setCabinetLocked(false);
    setCurrentLocation('cabinet_open');

    try {
      await logAccess('unlock_toxic_cabinet', 'toxic_cabinet', 'qr_code');
      console.log("Successfully logged unlock_toxic_cabinet");
    } catch (logErr) {
      console.error("Logging error during toxic cabinet unlock:", logErr.message);
      setError("Failed to log cabinet unlock: " + logErr.message);
    }

    alert(`✅ QR Code verified! Toxic cabinet unlocked.\n\nTime Slot: ${response.reservation.time_slot}`);
  } catch (err) {
    console.error("QR verification error:", err);
    setError("QR verification failed: " + err.message);
    setShowQRScanner(false);
  }
};
const handleConfirmWithdrawal = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // ONLY call bottle action - this handles both bottle lending AND chemical withdrawal
    await handleBottleAction('take_bottle', selectedChemical.id, selectedChemical.bottle_number, parseFloat(accessAction.quantity));

    setShowAccessForm(false);
    setAccessAction({ action: 'withdraw', quantity: 0, batch_number: '' });

    // Reload appropriate chemical list
    if (selectedCabinet === 'toxic') {
      await loadToxicChemicals();
    } else {
      await loadChemicals();
    }

    if (user?.role === 'admin') {
      await loadInventoryLogs();
    }

    setSelectedChemical(null);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

const completeToxicSession = async () => {
    setError('');
    // Step 1: Check for USB device first
    if (!usbDeviceDetected) {
      setShowUSBPrompt(true);
      return;
    }
    
    // Step 2: If USB is present, proceed with locking and session completion
    try {
      setLoading(true);
      // Mark the reservation as complete on the backend
      await apiCall('/complete-toxic-session', { method: 'POST' }); 
      
      // Log the specific lock action
      await logAccess('lock_toxic_cabinet', 'toxic_cabinet', 'usb_only');

      // Update UI state
      setToxicAccess({ has_access: false });
      setSelectedCabinet(null);
      setCabinetLocked(true);
      setCurrentLocation('lab_room');
      
      

      alert('Toxic reagent session completed and cabinet locked successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
   

  // Enhanced useEffect hooks
useEffect(() => {
  if (user) {
    setError('');
    loadChemicals();
    loadToxicChemicals();
    loadUserReservations();
    checkToxicAccess();
    loadRegisteredDevices(); // ADD THIS LINE
    if (user.role === 'admin') {
      loadAccessLogs();
      loadInventoryLogs();
      loadUsers();
      loadAdminReservations();
    }
  }
}, [user, loadChemicals, loadToxicChemicals, loadUserReservations, checkToxicAccess, loadRegisteredDevices, loadAccessLogs, loadInventoryLogs, loadUsers, loadAdminReservations]);


// In ChemicalStorageSystem, with your other useEffect hooks
useEffect(() => {
  // This function fetches slot data for today's date
  const loadTodaySlots = async () => {
    if (!user) return; // Don't run if user is not logged in
    
    setSlotsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0]; // Gets today's date in YYYY-MM-DD format
      const data = await apiCall(`/available-slots/${today}`);
      setTodaySlots(data);
    } catch (err) {
      console.error("Failed to load today's slots:", err.message);
      // It's okay to fail silently here, the UI will show an empty state
      setTodaySlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Run this function only when the user is on the main lab entry screen
  if (showLabRoom && currentLocation === 'outside') {
    loadTodaySlots();
  }
}, [user, showLabRoom, currentLocation]); // Dependencies that trigger the fetch
 
 

 

  // --- HELPER FUNCTIONS ---
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  }, [webcamRef]);
  
  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const generateMonthlyReport = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const data = await apiCall('/monthly-report', {
        method: 'POST',
        body: JSON.stringify({
          chemical_id: selectedReportChemical,
          month: reportMonth,
          year: reportYear
        })
      });
      setMonthlyReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  if (showReportsSection && user?.role === 'admin') {
    loadAllChemicalsForReports();
  }
}, [showReportsSection, user, loadAllChemicalsForReports]);

  const generateYearlyReport = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const data = await apiCall('/yearly-report', {
        method: 'POST',
        body: JSON.stringify({ year: reportYear })
      });
      setYearlyReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const handleBottleAction = async (action, chemicalId, bottleNumber = null, quantity = null) => {
  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('chemical_id', chemicalId);
    formData.append('action', action);

    // Always include cabinet_type, for both take_bottle and return_bottle
    const isToxic = selectedCabinet === 'toxic';
    formData.append('cabinet_type', isToxic ? 'toxic' : 'general');

    if (action === 'take_bottle') {
      if (bottleNumber) {
        formData.append('bottle_number', bottleNumber);
      }
      if (quantity !== null && !Number.isNaN(quantity)) {
        formData.append('quantity', quantity);
      }
    } else if (action === 'return_bottle') {
      // Prefer using the latest taken bottle from status
      const bottle = bottleStatus[chemicalId]?.bottles?.[0]; // assuming first/latest bottle in list
      if (bottle?.bottle_number) {
        formData.append('bottle_number', bottle.bottle_number);
      } else if (bottleNumber) {
        // Fallback if one is supplied
        formData.append('bottle_number', bottleNumber);
      }
    }

    await apiCall('/bottle-action', { method: 'POST', body: formData });

    // Refresh status and lists
    await checkBottleStatus(chemicalId);
    if (isToxic) {
      await loadToxicChemicals();
    } else {
      await loadChemicals();
    }
    if (user?.role === 'admin') {
      await loadInventoryLogs();
    }
  } catch (err) {
    setError(err.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};

  const checkBottleStatus = async (chemicalId) => {
    try {
      const data = await apiCall(`/bottle-status/${chemicalId}`);
      setBottleStatus(prev => ({ ...prev, [chemicalId]: data }));
    } catch (err) {
      console.error('Bottle status error:', err.message);
    }
  };

  const downloadPDF = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // --- API CALLS ---
  const apiCall = async (url, options = {}) => {
    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

    if (!response.ok) {
      let errorDetail;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || 'An unknown error occurred';
      } catch (e) {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorDetail);
    }
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', loginData.username);
      formData.append('password', loginData.password);
      
      const endpoint = loginAsAdmin ? '/admin/token' : '/user/token';
      const data = await apiCall(endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
        body: formData 
      });

      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      setLoginData({ username: '', password: ''});
      
      if (loginAsAdmin) {
        setCurrentView('admin_dashboard');
      } else {
        setCurrentLocation('outside');
        setShowLabRoom(true);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logAccess('exit_lab_room', 'lab_room');
    setToken(null);
    setUser(null);
    setCurrentLocation('outside');
    setShowLabRoom(false);
    setCabinetLocked(true);
    setUsbDeviceDetected(false); // Ensure reset on logout
    localStorage.removeItem('token');
  };

  const logAccess = async (action, location, verification_method = 'usb_and_face') => {
    try { 
      await apiCall(`/access-log`, { 
        method: 'POST', 
        body: JSON.stringify({ action, location, verification_method }) 
      }); 
      if (user?.role === 'admin') loadAccessLogs(); 
    } catch (err) { 
      console.error("Logging Error:", err.message);
    }
  };
  
const handleEnterRoom = async () => {
  setError('');
  // ONLY show the prompt. Let the prompt's own logic handle the device check.
  setShowUSBPrompt(true);
};



  const confirmEnterRoom = async () => {
    if (!capturedImage) {
      setError('Please capture your face for verification');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const imageFile = dataURLtoFile(capturedImage, 'room-entry-face.jpg');
      const formData = new FormData();
      formData.append('username', user.username);
      formData.append('face_image', imageFile);
      
      await apiCall('/verify-face-access', { method: 'POST', body: formData });
      
      await logAccess('enter_lab_room', 'lab_room');
      setCurrentLocation('lab_room');
      setShowFaceScanForRoom(false);
      setCapturedImage(null);
      
    

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCabinetAccess = async (action) => {
  setError('');
  
  if (!usbDeviceDetected) {
    setShowUSBPrompt(true);
    return;
  }
  
  setLoading(true);
  try {
    if (action === 'unlock') {
      await logAccess('unlock_cabinet', 'chemical_cabinet', 'usb_only');
      setCabinetLocked(false);
      setCurrentLocation('cabinet_open');
    } else {
      await logAccess('lock_cabinet', 'chemical_cabinet', 'usb_only');
      setCabinetLocked(true);
      setCurrentLocation('lab_room');
    }
    
    // Don't reset USB detection - let the physical removal handle it
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};



  
const USBPromptModal = () => {
    const [scanningDevices, setScanningDevices] = useState(true);
    const [manualSelectionNeeded, setManualSelectionNeeded] = useState(false);

    // This new function handles the manual device selection process
    const handleRequestDevice = async () => {
      setError('');
      try {
        console.log("Requesting device selection from user...");
        const device = await navigator.usb.requestDevice({ filters: [] });
        console.log("User selected device:", device);
        
        const generatedId = `${device.vendorId}-${device.productId}-${device.serialNumber || 'unknown'}`;
        const registeredId = user?.usb_device_id;

        console.log(`- Comparing: (Selected) "${generatedId}" === (Registered) "${registeredId}"`);

        if (registeredId === generatedId) {
          setDetectedDevice(device);
          setUsbDeviceDetected(true); // This triggers the success flow
        } else {
          setError('The selected device is not the one registered to your account.');
          setUsbDeviceDetected(false);
        }
      } catch (err) {
        console.error("Failed to request device:", err);
        if (err.name === 'NotFoundError') {
          setError("You did not select a device.");
        } else {
          setError("Device selection was cancelled or failed.");
        }
      }
    };

    // This effect checks for already-permitted devices when the modal opens
    useEffect(() => {
      (async () => {
        try {
          const devices = await navigator.usb.getDevices();
          const userDevice = devices.find(d => {
            const deviceId = `${d.vendorId}-${d.productId}-${d.serialNumber || 'unknown'}`;
            return user?.usb_device_id === deviceId;
          });

          if (userDevice) {
            setDetectedDevice(userDevice);
            setUsbDeviceDetected(true);
          } else {
            // If no device is found automatically, prompt for manual selection
            setManualSelectionNeeded(true);
          }
        } catch (err) {
          console.error('USB scan error:', err);
          setError('Could not scan for USB devices. Please check browser permissions.');
        } finally {
          setScanningDevices(false);
        }
      })();
    }, []);

    // This separate effect handles the UI transition AFTER a device is detected
    useEffect(() => {
      if (usbDeviceDetected) {
        const timer = setTimeout(() => {
          setShowUSBPrompt(false);
          setShowFaceScanForRoom(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }, [usbDeviceDetected]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
          <Usb className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Scan Your ID Card</h3>
          <p className="text-gray-600 mt-2">Insert your registered USB ID card to continue.</p>

          <div className="mt-4 min-h-[4rem]">
            {usbDeviceDetected && (
              <div className="p-3 bg-green-100 text-green-800 rounded">
                <CheckCircle className="inline-block h-5 w-5 mr-2" />
                Device Detected! Proceeding...
              </div>
            )}
            {manualSelectionNeeded && !usbDeviceDetected && (
               <div className="p-3 bg-yellow-100 text-yellow-800 rounded text-sm">
                 Automatic detection failed. Please select your ID card manually.
               </div>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 rounded text-sm">
              {error}
            </div>
          )}

          {manualSelectionNeeded && !usbDeviceDetected && (
            <button
              onClick={handleRequestDevice}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
            >
              <Search className="inline-block h-5 w-5 mr-2" />
              Select ID Card
            </button>
          )}

          <button
            onClick={() => setShowUSBPrompt(false)}
            className="mt-4 w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };
  

 


  const handleAddChemical = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    setError('');
    try { 
      await apiCall('/add-chemical', { 
        method: 'POST', 
        body: JSON.stringify(newChemical), 
      }); 
      setShowAddChemicalForm(false); 
      setNewChemical({ 
        name: '', chemical_formula: '', bottle_number: '', current_quantity: 0, 
        unit: '', minimum_threshold: 0, maximum_capacity: 0, safety_level: 'Low' 
      }); 
      loadChemicals(); 
      if (user?.role === 'admin') loadInventoryLogs(); 
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    } 
  };
  const handleUSBRegistration = async () => {
  if (!selectedUSBDevice) {
    setError('Please select a USB device');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const formData = new FormData();
    formData.append('username', newUserForFaceScan);
    formData.append('usb_device_id', `${selectedUSBDevice.vendorId}-${selectedUSBDevice.productId}-${selectedUSBDevice.serialNumber || 'unknown'}`);

    await apiCall('/register-usb', {
      method: 'POST',
      body: formData
    });

    setShowUSBScanForRegistration(false);
    setSelectedUSBDevice(null);
    setAvailableUSBDevices([]);
    setNewUserForFaceScan(null);
    
    alert('User registration completed successfully! Face and ID card registered.');
    
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const handleAddUser = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    setError('');
    try {
      await apiCall('/register', { method: 'POST', body: JSON.stringify(newUser) });
      setNewUserForFaceScan(newUser.username);
      setShowAddUserForm(false);
      setIsRegisterFaceScan(true);
      setNewUser({ 
      username: '', 
      password: '', 
      full_name: '', 
      name_katakana: '',  // Reset this
      user_id: '',        // Reset this
      affiliation: '',    // Reset this
      role: 'user' 
    });
      loadUsers();
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };
  
  const handleRegisterFace = async () => {
    if (!capturedImage) {
      setError('Please capture an image first.');
      return;
  }

    setLoading(true);
    setError('');

    try {
      const imageFile = dataURLtoFile(capturedImage, 'register-face.jpg');
      const formData = new FormData();
      formData.append('username', newUserForFaceScan);
      formData.append('file', imageFile);

      await apiCall('/register-face', {
        method: 'POST',
        body: formData
    });

      setIsRegisterFaceScan(false);
      setCapturedImage(null);
    
    // Continue to USB registration instead of completing
      setShowUSBScanForRegistration(true);
    
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (user && user.role !== 'admin' && chemicals.length > 0) {
      chemicals.forEach(chemical => {
        checkBottleStatus(chemical.id);
      });
    }
  }, [chemicals, user]);


  useEffect(() => {
    if (token) {
      const fetchUser = async () => {
        try {
          const data = await apiCall('/users/me');
          setUser(data);
        } catch (userError) {
          try {
            const adminData = await apiCall('/admins/me');
            setUser(adminData);
          } catch (adminError) {
            console.error('Failed to fetch user/admin data, logging out:', adminError.message);
            logout();
          }
        }
      };
      fetchUser();
    }
  }, [token]);
useEffect(() => {
  if (user && user.role !== 'admin' && toxicChemicals.length > 0) {
    toxicChemicals.forEach(chemical => {
      checkBottleStatus(chemical.id);
    });
  }
}, [toxicChemicals, user]);
  useEffect(() => {
    if (user) {
      setError('');
      loadChemicals();
      if (user.role === 'admin') {
        loadAccessLogs();
        loadInventoryLogs();
        loadUsers();
      }
    }
  }, [user, loadChemicals, loadAccessLogs, loadInventoryLogs, loadUsers]);

  
  const getSafetyColor = (level) => { 
    switch (level) { 
      case 'High': return 'text-red-600 bg-red-100'; 
      case 'Medium': return 'text-yellow-600 bg-yellow-100'; 
      case 'Low': return 'text-green-600 bg-green-100'; 
      default: return 'text-gray-600 bg-gray-100'; 
    } 
  };

  const getQuantityStatus = (current, minimum, maximum) => { 
    const percentage = (current / maximum) * 100; 
    if (current <= minimum) return 'text-red-600'; 
    if (percentage < 30) return 'text-yellow-600'; 
    return 'text-green-600'; 
  };

  const filteredChemicals = chemicals.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.chemical_formula.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredToxicChemicals = toxicChemicals.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.chemical_formula.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const FaceScanModal = ({ onCapture, onSubmit, onCancel, title, submitText }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-auto max-w-lg shadow-2xl">
        <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">{title}</h3>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">{error}</div>}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-80 h-60 bg-gray-200 rounded-lg overflow-hidden">
            {capturedImage ? 
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" /> : 
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full" />
            }
          </div>
          <div className="flex space-x-4 w-full">
            {capturedImage ? (
              <>
                <button onClick={onSubmit} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Processing...' : submitText}
                </button>
                <button onClick={() => setCapturedImage(null)} className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors">
                  Retake
                </button>
              </>
            ) : (
              <button onClick={onCapture} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center transition-colors">
                <Camera className="inline-block mr-2"/>Capture Photo
              </button>
            )}
          </div>
           <button onClick={onCancel} className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 mt-2 transition-colors">
             Cancel
           </button>
        </div>
      </div>
    </div>
  );
  const CabinetSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Package className="text-green-600" size={32} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Chemical Laboratory</h1>
              <p className="text-sm text-gray-600">Select Cabinet Type</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User size={20} className="text-gray-600" />
              <span className="text-sm font-medium">{user.full_name}</span>
            </div>
            <button onClick={logout} className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Cabinet */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-l-8 border-green-500">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Package className="text-white" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">General Reagents Cabinet</h2>
              <p className="text-gray-600 mb-4">Standard chemicals and reagents</p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 text-sm">
                  <strong>Access Method:</strong> USB ID Card Only
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-semibold text-gray-800">{chemicals.length}</div>
                  <div className="text-gray-600">Total Chemicals</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-semibold text-gray-800">
                    {chemicals.filter(c => c.current_quantity > 0).length}
                  </div>
                  <div className="text-gray-600">Available</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Usb className={`${usbDeviceDetected ? 'text-green-600' : 'text-gray-400'}`} size={20} />
                  <span className="text-sm font-medium">USB ID Card</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  usbDeviceDetected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {usbDeviceDetected ? 'Ready' : 'Required'}
                </div>
              </div>
              
              <button 
  onClick={() => {
    setSelectedCabinet('general');
    handleCabinetAccess('unlock');
  }}
  disabled={loading} // Corrected line
  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
>
  <Unlock size={20} />
  <span>{loading ? 'Accessing...' : 'Access General Cabinet'}</span>
</button>
            </div>
          </div>

          {/* Toxic Cabinet */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-l-8 border-red-500">
  <div className="text-center mb-6">
    <div className="mx-auto mb-4 w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
      <AlertTriangle className="text-white" size={48} />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Toxic Reagents Cabinet</h2>
    <p className="text-gray-600 mb-4">Hazardous chemicals - Restricted Access</p>

    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <p className="text-red-800 text-sm">
        <strong>Access Method:</strong> Approved QR Code Only
      </p>
    </div>
  </div>

  <div className="space-y-3">
    <button 
      onClick={() => {
        setError(''); // Clear previous errors
        setSelectedCabinet('toxic'); // Set context for the scanner
        setShowQRScanner(true);
      }}
      className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
    >
      <QrCode size={20} />
      <span>Unlock Cabinet with QR Code</span>
    </button>
  </div>
</div> 
            
          
        </div>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              logAccess('exit_lab_room', 'lab_room', 'manual');
              setCurrentLocation('outside');
            }}
            className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
          >
            <DoorClosed size={20} />
            <span>Exit Laboratory</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
            {error}
          </div>
        )}
      </main>
    </div>
  );

  // NEW: Reservation Form Modal
  {showReservationForm && (
    <ReservationFormModal
      isOpen={showReservationForm}
      onClose={() => {
        setShowReservationForm(false);
        setError(''); // Also clear any previous errors when closing
      }}
      reservationData={reservationData}
      setReservationData={setReservationData}
      handleReservationSubmit={handleReservationSubmit}
      loading={loading}
      error={error}
      availableSlots={availableSlots}
      loadAvailableSlots={loadAvailableSlots}
      toxicChemicals={toxicChemicals} 
    />
  )}
  // NEW: QR Scanner Modal
const QRScannerModal = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      result => {
        if (result?.data) {
          console.log("✅ Decoded QR code:", result.data);
          handleQRScan(result.data);

          // Stop scanning and close modal after success
          qrScanner.stop();
          setShowQRScanner(false);
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        onDecodeError: err => {
          // Suppress common "no QR" errors
          if (err?.message?.includes("No QR code found")) return;
          console.error("QR scan error:", err);
        }
      }
    );

    qrScanner.start().catch(err => {
      console.error("QR Scanner failed to start:", err);
      setError("Could not start the camera. Please grant permission and try again.");
    });

    return () => {
      qrScanner.destroy();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-auto max-w-lg shadow-2xl">
        <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">Scan QR Code</h3>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}
        <div className="w-80 h-60 bg-gray-200 rounded-lg overflow-hidden">
          <video ref={videoRef} style={{ width: "100%", height: "100%" }} />
        </div>
        <button
          onClick={() => {
            setShowQRScanner(false);
            setError("");
          }}
          className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 mt-4 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
 const AdminViewReservationModal = () => {
    if (!selectedReservationForView) return null;

    const res = selectedReservationForView;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-2xl">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Reservation Request</h3>
            <button onClick={() => setShowAdminViewModal(false)} className="text-gray-400 hover:text-gray-600">
              <XCircle size={24} />
            </button>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-4 p-2 bg-gray-50 rounded">
              <strong className="col-span-1 text-gray-600">User:</strong>
              <span className="col-span-2 text-gray-800">{res.full_name} ({res.username})</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-2 rounded">
              <strong className="col-span-1 text-gray-600">Affiliation:</strong>
              <span className="col-span-2 text-gray-800">{res.user_affiliation} (ID: {res.user_id_no})</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-2 bg-gray-50 rounded">
              <strong className="col-span-1 text-gray-600">Date & Time:</strong>
              <span className="col-span-2 text-gray-800">{res.date} @ {res.time_slot}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-2 rounded">
              <strong className="col-span-1 text-gray-600">Reagent:</strong>
              <span className="col-span-2 text-gray-800">{res.reagent_name}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-2 bg-gray-50 rounded">
              <strong className="col-span-1 text-gray-600">Amount:</strong>
              <span className="col-span-2 text-gray-800">{res.amount_needed} {res.unit}</span>
            </div>
            <div className="p-2 rounded">
              <strong className="block mb-1 text-gray-600">Purpose of Use:</strong>
              <p className="text-gray-800 bg-gray-50 p-2 rounded border">{res.purpose}</p>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => handleReservationApproval(res.id, 'approve')}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> {loading ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={() => handleReservationApproval(res.id, 'reject')}
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircle size={18} /> {loading ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    );
  };
const QRCodeModal = ({ qrCode, onClose }) => {
  // Clean up the QR code string (remove quotes/whitespace)
  const cleanQrCode = qrCode ? qrCode.trim().replace(/^"(.*)"$/, '$1') : '';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your QR Code</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="text-center">
          {cleanQrCode ? (
            <div>
              <img 
                src={`data:image/png;base64,${cleanQrCode}`} 
                alt="QR Code" 
                className="mx-auto mb-4"
              />
              <p className="text-sm text-gray-600">
                Show this QR code to access the toxic cabinet
              </p>
            </div>
          ) : (
            <p>Loading QR code...</p>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <button 
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
  // Add this new component for the reservation management screen
const ReservationManagement = () => (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Toxic Reagent Reservations</h2>
      <p className="text-gray-600 mb-6">Create a new reservation or view the status of existing requests. Reservations must be approved by an administrator before you can access the toxic cabinet.</p>

      <div className="flex space-x-4 mb-8">
          <button onClick={() => setShowReservationForm(true)} className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Calendar size={18} />
            <span>Make New Reservation</span>
          </button>
          <button onClick={() => setShowReservationManagement(false)} className="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors">
            Back to Lab Entry
          </button>
      </div>

      <h3 className="font-semibold text-gray-800 mb-3">Your Reservations</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto border p-4 rounded-lg">
        {userReservations.length > 0 ? userReservations.map(reservation => (
          <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
            <div>
              <div className="font-medium text-gray-900">{reservation.reagent_name}</div>
              <div className="text-gray-600">{reservation.date} @ {reservation.time_slot}</div>
              {reservation.status === 'approved' && reservation.qr_code && (
                <button 
                  onClick={() => {
                    setSelectedQRCode(reservation.qr_code);
                    setShowQRModal(true);
                  }}
                  className="text-blue-600 hover:underline text-sm font-semibold mt-1 flex items-center gap-1"
                >
                  <QrCode size={14} /> View QR Code
                </button>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              reservation.status === 'approved' ? 'bg-green-100 text-green-800' :
              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              reservation.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {reservation.status}
            </span>
          </div>
        )) : <p className="text-gray-500">You have no reservations.</p>}
      </div>
    </div>
  );
  
  


  // --- RENDER LOGIC ---
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <div className="text-center mb-6">
            <Lock className="mx-auto mb-4 text-blue-600" size={48} />
            <h1 className="text-2xl font-bold text-gray-800">Chemical Storage System</h1>
            <p className="text-gray-600">Enter Credentials</p>
          </div>
          
          <div className="flex justify-center items-center bg-gray-200 rounded-full p-1 mb-6">
            <button 
              onClick={() => setLoginAsAdmin(false)} 
              className={`w-1/2 py-2 text-sm font-medium rounded-full transition-colors ${!loginAsAdmin ? 'bg-blue-600 text-white shadow' : 'text-gray-600'}`}
            >
              User Login
            </button>
            <button 
              onClick={() => setLoginAsAdmin(true)} 
              className={`w-1/2 py-2 text-sm font-medium rounded-full transition-colors ${loginAsAdmin ? 'bg-blue-600 text-white shadow' : 'text-gray-600'}`}
            >
              Admin Login
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                value={loginData.username} 
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                value={loginData.password} 
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          {loginAsAdmin && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              <p>Demo admin: admin / admin123</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isRegisterFaceScan) {
    return <FaceScanModal 
      title={`Register Face for: ${newUserForFaceScan}`} 
      submitText="Confirm & Register Face" 
      onCapture={capture} 
      onSubmit={handleRegisterFace} 
      onCancel={() => { setIsRegisterFaceScan(false); setCapturedImage(null); setError(''); }} 
    />;
  }
  if (showUSBPrompt) {
  return <USBPromptModal />;
}
  if (showFaceScanForRoom) {
    return <FaceScanModal 
      title="Enter Lab Room: Face Verification" 
      submitText="Confirm & Enter Room" 
      onCapture={capture} 
      onSubmit={confirmEnterRoom} 
      onCancel={() => { setShowFaceScanForRoom(false); setCapturedImage(null); setError(''); }} 
    />;
  }

   

  if (showLabRoom && currentLocation === 'outside') {
    if (showReservationManagement) {
      return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <ReservationManagement />
            {showQRModal && <QRCodeModal qrCode={selectedQRCode} onClose={() => setShowQRModal(false)} />}
            {showReservationForm && (
              <ReservationFormModal
                isOpen={showReservationForm}
                onClose={() => setShowReservationForm(false)}
                reservationData={reservationData}
                setReservationData={setReservationData}
                handleReservationSubmit={handleReservationSubmit}
                loading={loading}
                error={error}
                availableSlots={availableSlots}
                loadAvailableSlots={loadAvailableSlots}
                toxicChemicals={toxicChemicals} 
              />
            )}
          </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
          <div className={`grid grid-cols-1 ${user.role === 'toxic_user' ? 'md:grid-cols-2' : 'md:grid-cols-1 md:max-w-md mx-auto'} gap-8`}>
            {/* --- Lab Entry Panel (always visible) --- */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <div className="mx-auto mb-6 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <DoorClosed className="text-white" size={64} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">General Laboratory</h1>
                <p className="text-gray-600 mb-4">Welcome, {user.full_name}</p>
              </div>
              <div className="mt-8 flex">
                <button 
                  onClick={handleEnterRoom}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <DoorOpen size={20} />
                  <span>Enter Laboratory</span>
                </button>
              </div>
            </div>
  
            {/* --- Reservation Panel (shown only to toxic users) --- */}
            {user.role === 'toxic_user' && (
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto mb-6 w-32 h-32 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                    <AlertTriangle className="text-white" size={64} />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Toxic Reagents</h1>
                  <p className="text-gray-600 mb-4">Reservation Required for Access</p>
                </div>
                <div className="mt-8 flex">
                  <button
                    onClick={() => setShowReservationManagement(true)}
                    className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Calendar size={20} />
                    <span>Manage & Make Reservations</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =================================================================== */}
          {/* ========= NEW: TODAY'S TOXIC CABINET SCHEDULE PANEL =============== */}
          {/* =================================================================== */}
          <div className="mt-8 bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Clock size={20} className="mr-2 text-gray-500"/>
              Today's Lab Schedule ({new Date().toLocaleDateString()})
            </h3>
            {slotsLoading ? (
              <div className="text-center text-gray-500">Loading schedule...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {todaySlots.length > 0 ? todaySlots.map(slot => (
                  <div key={slot.time_slot} className={`p-3 rounded-lg text-center border ${
                    slot.available 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="font-semibold text-sm text-gray-700">{slot.time_slot}</div>
                    <div className={`text-xs font-bold ${
                      slot.available ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {slot.available ? 'Available' : 'Booked'}
                    </div>
                  </div>
                )) : (
                  <p className="col-span-full text-center text-gray-500">No slots available for today.</p>
                )}
              </div>
            )}
          </div>
          {/* =================================================================== */}
          
          <div className="text-center mt-8">
              <button 
                onClick={logout}
                className="bg-gray-700 text-white py-2 px-6 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 mx-auto"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Package className="text-blue-600" size={32} />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Chemical Storage System - Admin</h1>
                <p className="text-sm text-gray-600">Control Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User size={20} className="text-gray-600" />
                <span className="text-sm font-medium">{user.full_name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{user.role}</span>
              </div>
              <button onClick={logout} className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>
         
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <User className="mr-2" size={20} />User Management
              </h2>
              <button onClick={() => setShowAddUserForm(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mb-4 transition-colors">
                <Plus size={16} />
                <span>Add New User</span>
              </button>
              {!users || users.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Username</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Full Name</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-t">
                          <td className="px-4 py-2 text-sm">{u.username}</td>
                          <td className="px-4 py-2 text-sm">{u.full_name}</td>
                          <td className="px-4 py-2 text-sm">{u.role}</td>
                          <td className="px-4 py-2 text-sm">{new Date(u.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="mr-2" size={20} />Access Logs
              </h2>
              {accessLogs.length === 0 ? (
  <div className="text-center py-8 text-gray-500">No access logs yet.</div>
) : (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border border-gray-200">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enter Room</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Room</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cabinet Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unlock Cabinet</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lock Cabinet</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {accessLogs.map((log, index) => {
          // Determine cabinet type and times
          let cabinetType = 'N/A';
          let enterCabinet = 'N/A';
          let exitCabinet = 'N/A';
          
          // Check for general cabinet usage
          if (log.unlock_cabinet_time || log.lock_cabinet_time) {
            cabinetType = 'General';
            enterCabinet = log.unlock_cabinet_time ? 
              new Date(log.unlock_cabinet_time).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : 'N/A';
            exitCabinet = log.lock_cabinet_time ? 
              new Date(log.lock_cabinet_time).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : 'N/A';
          }
          
          // Check for toxic cabinet usage (overrides general if both exist)
          if (log.unlock_toxic_cabinet_time || log.lock_toxic_cabinet_time) {
            cabinetType = 'Toxic';
            enterCabinet = log.unlock_toxic_cabinet_time ? 
              new Date(log.unlock_toxic_cabinet_time).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : 'N/A';
            exitCabinet = log.lock_toxic_cabinet_time ? 
              new Date(log.lock_toxic_cabinet_time).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : 'N/A';
          }
          
          return (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {log.username}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Chemical Lab
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(log.enter_room_time).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {log.exit_room_time ? 
                  new Date(log.exit_room_time).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : 
                  'N/A'
                }
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  cabinetType === 'Toxic' ? 'bg-red-100 text-red-800' : 
                  cabinetType === 'General' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-500'
                }`}>
                  {cabinetType}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {enterCabinet}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {exitCabinet}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}


            </div>
            
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="mr-2" size={20} />Inventory Logs
              </h2>
              {!inventoryLogs || inventoryLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No inventory logs yet.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {inventoryLogs.map((log, i) => (
                    <div key={`${log.timestamp}-${i}`} className="p-2 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{log.username} - {log.chemical_name}</p>
                          <p className="text-xs text-gray-600">Bottle: {log.bottle_number || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${log.action === 'withdraw' || log.action === 'add' ? 'text-red-600' : 'text-green-600'}`}>
                            {log.action.toUpperCase()} {log.quantity}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Stock Change: {log.previous_quantity} → {log.new_quantity}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
  <h2 className="text-lg font-semibold mb-4 flex items-center">
    <Calendar className="mr-2" size={20} />
    Toxic Reagent Reservations Management
  </h2>
  
  <div className="mb-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="font-semibold text-yellow-800">Pending</div>
        <div className="text-2xl font-bold text-yellow-600">
          {adminReservations.filter(r => r.status === 'pending').length}
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="font-semibold text-green-800">scheduled</div>
        <div className="text-2xl font-bold text-green-600">
          {adminReservations.filter(r => r.status === 'approved').length}
        </div>
      </div>
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="font-semibold text-red-800">Rejected</div>
        <div className="text-2xl font-bold text-red-600">
          {adminReservations.filter(r => r.status === 'rejected').length}
        </div>
      </div>
    </div>
  </div>
{!adminReservations || adminReservations.length === 0 ? (
  <p className="text-gray-500 text-center py-4">No reservations found.</p>
) : (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date & Time</th>
          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Reagent</th>
          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {adminReservations.map((reservation) => (
          <tr key={reservation.id} className="border-t">
            <td className="px-4 py-2 text-sm">
              <div>
                <div className="font-medium">{reservation.full_name}</div>
                <div className="text-gray-500 text-xs">ID: {reservation.user_id_no}</div>
              </div>
            </td>
            <td className="px-4 py-2 text-sm">
              <div>{reservation.date}</div>
              <div className="text-gray-500 text-xs">{reservation.time_slot}</div>
            </td>
            <td className="px-4 py-2 text-sm">{reservation.reagent_name}</td>
            <td className="px-4 py-2 text-sm">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  reservation.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : reservation.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : reservation.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {reservation.status}
              </span>
            </td>
            <td className="px-4 py-2 text-sm">
              {reservation.status === "pending" && (
                <button
                  onClick={() => {
                    setSelectedReservationForView(reservation);
                    setShowAdminViewModal(true);
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                >
                  <Eye size={14} /> View
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {/* Render the AdminViewReservationModal when needed */}
    {showAdminViewModal && <AdminViewReservationModal />}
  </div>
)}
            </div>
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Activity className="mr-2" size={20} />
                  Chemical Usage Reports
                </h2>
                <button
                  onClick={() => setShowReportsSection(!showReportsSection)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {showReportsSection ? 'Hide Reports' : 'Show Reports'}
                </button>
              </div>

              {showReportsSection && (
                <div className="space-y-6">
                  <div className="flex space-x-4 border-b pb-4">
                    <button
                      onClick={() => setReportType('monthly')}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        reportType === 'monthly' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Monthly Report
                    </button>
                    <button
                      onClick={() => setReportType('yearly')}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        reportType === 'yearly' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Yearly Report
                    </button>
                  </div>

                  {reportType === 'monthly' && (
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold">Monthly Chemical Usage Report</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Chemical</label>
                          <select
                            value={selectedReportChemical}
                            onChange={(e) => setSelectedReportChemical(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Select Chemical</option>
                            {allChemicalsForReports.map(chemical => (
                              <option key={chemical.id} value={chemical.id}>
                                {chemical.name} ({chemical.cabinet_type === 'toxic' ? 'Toxic' : 'General'})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                          <select
                            value={reportMonth}
                            onChange={(e) => setReportMonth(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                          <select
                            value={reportYear}
                            onChange={(e) => setReportYear(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            {Array.from({ length: 5 }, (_, i) => (
                              <option key={i} value={new Date().getFullYear() - i}>
                                {new Date().getFullYear() - i}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={generateMonthlyReport}
                            disabled={!selectedReportChemical || loading}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {loading ? 'Generating...' : 'Generate Report'}
                          </button>
                        </div>
                      </div>

                      {monthlyReportData && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold">
                              Monthly Report: {monthlyReportData.chemical_name} 
                              ({monthlyReportData.month}/{monthlyReportData.year})
                            </h4>
                            <button
                              onClick={() => downloadPDF(monthlyReportData, `monthly_report_${monthlyReportData.chemical_name}_${monthlyReportData.month}_${monthlyReportData.year}.json`)}
                              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                            >
                              Download PDF
                            </button>
                          </div>

                          <div className="mb-6">
                            <h5 className="font-semibold mb-2">Transactions</h5>
                            <div className="max-h-60 overflow-y-auto">
                              <table className="min-w-full bg-white border">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="px-4 py-2 text-left">Bottle No.</th>
                                    <th className="px-4 py-2 text-left">Chemical/Reagent Name</th>
                                    <th className="px-4 py-2 text-left">Lending Date & Time</th>
                                    <th className="px-4 py-2 text-left">Return Date & Time</th>
                                    <th className="px-4 py-2 text-left">Action</th>
                                    <th className="px-4 py-2 text-left">Quantity</th>
                                    <th className="px-4 py-2 text-left">Username</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {monthlyReportData.transactions.map((transaction, i) => (
                                    <tr key={i} className="border-t">
                                      <td className="px-4 py-2 text-sm">{transaction.bottle_number}</td>
                                      <td className="px-4 py-2 text-sm">{monthlyReportData.chemical_name}</td>
                                      <td className="px-4 py-2 text-sm">
                                        {new Date(transaction.timestamp).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        {transaction.actual_return ? new Date(transaction.actual_return).toLocaleString() : 'N/A'}
                                      </td>
                                      <td className="px-4 py-2 text-sm">{transaction.action}</td>
                                      <td className="px-4 py-2 text-sm">{transaction.quantity}</td>
                                      <td className="px-4 py-2 text-sm">{transaction.username}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {reportType === 'yearly' && (
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold">Yearly Chemical Usage Report</h3>
                      <div className="flex space-x-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                          <select
                            value={reportYear}
                            onChange={(e) => setReportYear(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          >
                            {Array.from({ length: 5 }, (_, i) => (
                              <option key={i} value={new Date().getFullYear() - i}>
                                {new Date().getFullYear() - i}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={generateYearlyReport}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {loading ? 'Generating...' : 'Generate Yearly Report'}
                        </button>
                      </div>

                      {yearlyReportData && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold">Yearly Report: {yearlyReportData.year}</h4>
                            <button
                              onClick={() => downloadPDF(yearlyReportData, `yearly_report_${yearlyReportData.year}.json`)}
                              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                            >
                              Download PDF
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="px-4 py-2 text-left">Reagent Name</th>
                                  <th className="px-4 py-2 text-left">Safety Level</th>
                                  <th className="px-4 py-2 text-left">Storage Amount</th>
                                  <th className="px-4 py-2 text-left">Use Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {yearlyReportData.chemicals.map((chemical, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="px-4 py-2 text-sm font-medium">{chemical.reagent_name}</td>
                                    <td className="px-4 py-2 text-sm">
                                      <span className={`px-2 py-1 rounded text-xs ${getSafetyColor(chemical.species)}`}>
                                        {chemical.species}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm">{chemical.storage_amount}</td>
                                    <td className="px-4 py-2 text-sm">{chemical.use_amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      
        {showAddUserForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-8 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Add New User</h2>
      <form onSubmit={handleAddUser}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
          <input
            type="text"
            value={newUser.username}
            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
          <input
            type="text"
            value={newUser.full_name}
            onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Name in Katakana (フリガナ)</label>
          <input
            type="text"
            value={newUser.name_katakana}
            onChange={(e) => setNewUser({...newUser, name_katakana: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="タナカ タロウ"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>
            <div className="mb-4">
  <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
  <input 
    type="email" 
    value={newUser.email} 
    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} 
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
    required 
  />
</div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">User ID</label>
          <input
            type="text"
            value={newUser.user_id}
            onChange={(e) => setNewUser({...newUser, user_id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="EMP001"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Affiliation (Department)</label>
          <select
            value={newUser.affiliation}
            onChange={(e) => setNewUser({...newUser, affiliation: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Select Department</option>
            <option value="Research & Development">Research & Development</option>
            <option value="Quality Control">Quality Control</option>
            <option value="Production">Production</option>
            <option value="Safety Department">Safety Department</option>
            <option value="Environmental Science">Environmental Science</option>
            <option value="Laboratory Services">Laboratory Services</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="general_user">General User</option>
            <option value="toxic_user">Toxic User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Add & Continue to Registration'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddUserForm(false);
              setNewUser({ username: '', password: '', full_name: '', name_katakana: '', user_id: '', affiliation: '', role: 'user' });
            }}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
  {showUSBScanForRegistration && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-8 rounded-lg w-96">
      <h2 className="text-2xl font-bold mb-6 text-center">Register ID Card</h2>
      <div className="text-center mb-6">
        <Shield className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <p className="text-gray-600 mb-4">
          Please scan your USB ID card to complete registration.
          This card will be used for lab and cabinet access.
        </p>
      </div>
      
      <div className="mb-6">
        <button
  onClick={() => {
    // Use the new device detection approach
    if (navigator.usb) {
      navigator.usb.requestDevice({ filters: [] })
        .then(device => {
          setAvailableUSBDevices([device]);
          setSelectedUSBDevice(device);
        })
        .catch(err => console.error('USB selection failed:', err));
    }
  }}
  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mb-4"
>
  <Usb className="w-5 h-5 inline mr-2" />
  Select USB Device for Registration
</button>

        
        {availableUSBDevices.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Select your ID card:</p>
            {availableUSBDevices.map((device, index) => (
              <button
                key={index}
                onClick={() => setSelectedUSBDevice(device)}
                className={`w-full text-left p-3 border rounded-lg ${
                  selectedUSBDevice === device 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">
                  {device.productName || 'USB Device'}
                </div>
                <div className="text-xs text-gray-500">
                  Vendor: {device.vendorId}, Product: {device.productId}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={handleUSBRegistration}
          disabled={!selectedUSBDevice || loading}
          className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register ID Card'}
        </button>
        <button
          onClick={() => {
            setShowUSBScanForRegistration(false);
            setSelectedUSBDevice(null);
            setAvailableUSBDevices([]);
          }}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
 
      
      
      </div>
    );
  }

  if (currentLocation === 'lab_room') {
    return (
      <>
        <CabinetSelection />
        {showReservationForm && <ReservationFormModal />}
        {showQRScanner && <QRScannerModal />}
        {showQRModal && (
      <QRCodeModal 
        qrCode={selectedQRCode} 
        onClose={() => setShowQRModal(false)} 
      />
    )}
      </>
    );
  }
  if (currentLocation === 'cabinet_open' && selectedCabinet !== 'toxic')  {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Package className="text-blue-600" size={32} />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Chemical Storage Cabinet</h1>
                <p className="text-sm text-gray-600">Status: UNLOCKED - Access Granted</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User size={20} className="text-gray-600" />
                <span className="text-sm font-medium">{user.full_name}</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Cabinet Access</span>
              </div>
              <button 
                onClick={() => handleCabinetAccess('lock')} 
                className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
              >
                <Lock size={16} />
                <span>Lock Cabinet</span>
              </button>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Package className="mr-2" size={20} />Chemical Inventory
            </h2>
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Search chemicals..." 
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                
  {/* Scan Barcode Button */}
  <button
    onClick={() => setShowBarcodeScanner(true)}
    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
  >
    <Barcode size={18} />
    <span>Scan Barcode to Add</span>
  </button>

 
</div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Total Chemicals</h3>
                  <p className="text-2xl font-bold text-blue-600">{chemicals.length}</p>
                  <p className="text-sm text-blue-600">In inventory</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">Low Stock Alerts</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {chemicals.filter(c => c.current_quantity <= c.minimum_threshold).length}
                  </p>
                  <p className="text-sm text-yellow-600">Items below threshold</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Available Bottles</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {chemicals.filter(c => c.current_quantity > 0).length}
                  </p>
                  <p className="text-sm text-green-600">Ready for use</p>
                </div>
              </div>

              {chemicals.filter(c => c.current_quantity <= c.minimum_threshold).length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Low Stock Warning</h4>
                  <div className="space-y-1">
                    {chemicals.filter(c => c.current_quantity <= c.minimum_threshold).map(chemical => (
                      <p key={chemical.id} className="text-sm text-yellow-700">
                        {chemical.name}: {chemical.current_quantity} {chemical.unit} (Min: {chemical.minimum_threshold} {chemical.unit})
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChemicals.map((chemical) => (
                <div key={chemical.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{chemical.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getSafetyColor(chemical.safety_level)}`}>
                      {chemical.safety_level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Formula: {chemical.chemical_formula}</p>
                  <p className="text-sm text-gray-600 mb-4">Bottle No: {chemical.bottle_number}</p>
                  
                  <div className="mb-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">Stock:</span>
                      <span className={`font-bold ${getQuantityStatus(chemical.current_quantity, chemical.minimum_threshold, chemical.maximum_capacity)}`}>
                        {chemical.current_quantity} {chemical.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div 
                        className={`h-2.5 rounded-full ${
                          chemical.current_quantity <= chemical.minimum_threshold 
                            ? 'bg-red-500' 
                            : chemical.current_quantity < chemical.maximum_capacity * 0.3 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                        }`} 
                        style={{ width: `${(chemical.current_quantity / chemical.maximum_capacity) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Min: {chemical.minimum_threshold}</span>
                      <span>Max: {chemical.maximum_capacity}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {bottleStatus[chemical.id]?.has_bottle ? (
                      <button 
                        onClick={() => handleBottleAction('return_bottle', chemical.id)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Return Bottle
                      </button>
                    ) : (
                      <button 
                        onClick={() => { 
                          setSelectedChemical(chemical); 
                          setShowAccessForm(true); 
                        }} 
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                        disabled={chemical.current_quantity <= 0}
                      >
                        Take Out Bottle
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {showAccessForm && selectedChemical && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">Take Out {selectedChemical.name}</h3>
              
              <form onSubmit={handleConfirmWithdrawal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity ({selectedChemical.unit})
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max={selectedChemical.current_quantity}
                    value={accessAction.quantity} 
                    onChange={(e) => setAccessAction({ ...accessAction, quantity: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">Available: {selectedChemical.current_quantity} {selectedChemical.unit}</p>
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="flex space-x-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Confirm'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { 
                      setShowAccessForm(false); 
                      setSelectedChemical(null); 
                      setError(''); 
                    }} 
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showBarcodeScanner && (
          <BarcodeScannerModal 
            onResult={handleBarcodeScanResult} 
            onClose={() => setShowBarcodeScanner(false)} 
          />
        )}
        {showAddChemicalForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">Add New Chemical</h3>
              <form onSubmit={handleAddChemical} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input 
                    type="text" 
                    value={newChemical.name} 
                    onChange={(e) => setNewChemical({ ...newChemical, name: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Formula</label>
                  <input 
                    type="text" 
                    value={newChemical.chemical_formula} 
                    onChange={(e) => setNewChemical({ ...newChemical, chemical_formula: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bottle No.</label>
                  <input 
                    type="text" 
                    value={newChemical.bottle_number} 
                    onChange={(e) => setNewChemical({ ...newChemical, bottle_number: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={newChemical.current_quantity} 
                      onChange={(e) => setNewChemical({ ...newChemical, current_quantity: parseFloat(e.target.value) })} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                    <input 
                      type="text" 
                      value={newChemical.unit} 
                      onChange={(e) => setNewChemical({ ...newChemical, unit: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Threshold</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={newChemical.minimum_threshold} 
                      onChange={(e) => setNewChemical({ ...newChemical, minimum_threshold: parseFloat(e.target.value) })} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={newChemical.maximum_capacity} 
                      onChange={(e) => setNewChemical({ ...newChemical, maximum_capacity: parseFloat(e.target.value) })} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Safety Level</label>
                  <select 
                    value={newChemical.safety_level} 
                    onChange={(e) => setNewChemical({ ...newChemical, safety_level: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div className="flex space-x-4">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add Chemical'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { 
                      setShowAddChemicalForm(false); 
                      setError(''); 
                    }} 
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
if (selectedCabinet === 'toxic' && currentLocation === 'cabinet_open') {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <AlertTriangle className="text-red-600" size={32} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Toxic Reagents Cabinet</h1>
              <p className="text-sm text-gray-600">⚠️ HAZARDOUS MATERIALS - Handle with Extreme Caution</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User size={20} className="text-gray-600" />
              <span className="text-sm font-medium">{user.full_name}</span>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Toxic Access</span>
            </div>
            <button
              onClick={completeToxicSession}
              className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
            >
              <Usb size={16} />
              <span>Lock with ID Scan</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="mr-2 text-red-600" size={20} />
            Toxic Chemical Inventory
          </h2>

          <div className="flex-1 relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search toxic chemicals..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredToxicChemicals.map((chemical) => (
              <div key={chemical.id} className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h3 className="font-medium text-gray-900">{chemical.name}</h3>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-600">
                    {chemical.safety_level}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p><strong>Formula:</strong> {chemical.chemical_formula}</p>
                  <p><strong>Bottle No:</strong> {chemical.bottle_number}</p>
                  <p>
                    <strong>Available:</strong>{' '}
                    <span className={getQuantityStatus(
                      chemical.current_quantity,
                      chemical.minimum_threshold,
                      chemical.maximum_capacity
                    )}>
                      {chemical.current_quantity} {chemical.unit}
                    </span>
                  </p>
                </div>

                <div className="text-center">
                  <span className="text-red-600 font-medium text-sm">Handle with extreme caution</span>
                </div>

                {/* Bottle actions for toxic cabinet (no Quick Withdraw) */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {bottleStatus[chemical.id]?.has_bottle ? (
                    <button
                      onClick={() => handleBottleAction('return_bottle', chemical.id)}
                      disabled={loading}
                      className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Return Bottle
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedChemicalForBottle(chemical);
                        setSelectedCabinet('toxic');
                        setShowBottleActions(true);
                      }}
                      disabled={loading}
                      className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Take Bottle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottle action modal specifically for toxic cabinet */}
        {showBottleActions && selectedChemicalForBottle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Take Toxic Chemical Bottle</h3>
                <button
                  onClick={() => {
                    setShowBottleActions(false);
                    setSelectedChemicalForBottle(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Chemical:</strong> {selectedChemicalForBottle.name}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Formula:</strong> {selectedChemicalForBottle.chemical_formula}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Available:</strong> {selectedChemicalForBottle.current_quantity} {selectedChemicalForBottle.unit}
                </p>

                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-red-700 text-sm font-medium">
                      Toxic Chemical - Handle with extreme caution
                    </span>
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const quantity = parseFloat(e.currentTarget.quantity.value) || 0;
                  handleBottleAction(
                    'take_bottle',
                    selectedChemicalForBottle.id,
                    selectedChemicalForBottle.bottle_number,
                    quantity
                  );
                  setShowBottleActions(false);
                  setSelectedChemicalForBottle(null);
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity to withdraw (optional)
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    step="0.01"
                    min="0"
                    max={selectedChemicalForBottle.current_quantity}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBottleActions(false);
                      setSelectedChemicalForBottle(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50 bg-red-600 hover:bg-red-700"
                  >
                    {loading ? 'Processing...' : 'Take Bottle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
    
  
  {showReservationForm && <ReservationFormModal />}
  {showQRScanner && <QRScannerModal />}
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">System Error</h1>
        <p className="text-gray-600 mb-4">Invalid system state detected.</p>
        <button 
          onClick={logout} 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Reset and Logout
        </button>
      </div>
       
    </div>
  );
};
const ReservationFormModal = ({ 
  isOpen, 
  onClose, 
  reservationData, 
  setReservationData, 
  handleReservationSubmit, 
  loading, 
  error, 
  availableSlots, 
  loadAvailableSlots,
  toxicChemicals 
}) => {
  if (!isOpen) return null;

  // Find the selected chemical to display its details
  const selectedChemical = toxicChemicals.find(c => c.name === reservationData.reagent_name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">Toxic Reagent Reservation</h3>
        
        <form onSubmit={handleReservationSubmit} className="space-y-4">
          {/* Date and Time Slot Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input 
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                value={reservationData.date} 
                onChange={(e) => {
                  setReservationData({ ...reservationData, date: e.target.value });
                  if (e.target.value) loadAvailableSlots(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
              <select
                value={reservationData.time_slot}
                onChange={(e) => setReservationData({ ...reservationData, time_slot: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Time Slot</option>
                {availableSlots.map(slot => (
                  <option key={slot.time_slot} value={slot.time_slot} disabled={!slot.available}>
                    {slot.time_slot} {!slot.available && '(Booked)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* User Info Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignment No.</label>
              <input 
                type="text" 
                value={reservationData.assignment_no} 
                onChange={(e) => setReservationData({ ...reservationData, assignment_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User ID No.</label>
              <input 
                type="text" 
                value={reservationData.user_id_no} 
                onChange={(e) => setReservationData({ ...reservationData, user_id_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User Affiliation</label>
            <input 
              type="text" 
              value={reservationData.user_affiliation} 
              onChange={(e) => setReservationData({ ...reservationData, user_affiliation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
          
          {/* Chemical Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reagent/Poison Substance Name</label>
              <select
                value={reservationData.reagent_name}
                onChange={(e) => {
                  const selected = toxicChemicals.find(c => c.name === e.target.value);
                  setReservationData({ 
                    ...reservationData, 
                    reagent_name: selected ? selected.name : '',
                    unit: selected ? selected.unit : ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">-- Select a Chemical --</option>
                {toxicChemicals.map(chem => (
                  <option key={chem.id} value={chem.name} disabled={chem.current_quantity <= 0}>
                    {chem.name} {chem.current_quantity <= 0 ? '(Out of Stock)' : ''}
                  </option>
                ))}
              </select>
              {selectedChemical && (
                <p className="text-sm text-gray-600 mt-1">
                  Available: {selectedChemical.current_quantity} {selectedChemical.unit}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Needed</label>
              <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max={selectedChemical ? selectedChemical.current_quantity : 0}
                  value={reservationData.amount_needed} 
                  onChange={(e) => setReservationData({ ...reservationData, amount_needed: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                  required 
                  disabled={!selectedChemical || selectedChemical.current_quantity <= 0}
                />
            </div>
          </div>
          
          {/* Purpose and Supervisor Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Purpose of Use</label>
            <textarea 
              value={reservationData.purpose} 
              onChange={(e) => setReservationData({ ...reservationData, purpose: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              required 
            />
          </div>
          
          
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {/* Submit and Cancel Buttons */}
          <div className="flex space-x-4">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Reservation'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

 


export default ChemicalStorageSystem;