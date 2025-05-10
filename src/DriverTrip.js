import axios from "axios";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Swal from 'sweetalert2'
import styled, { keyframes,createGlobalStyle } from 'styled-components';
import { PulseLoader } from 'react-spinners';
import { FaBus, FaPlay, FaStop, FaRoute, FaMapMarkerAlt } from 'react-icons/fa';
import TripStorageInfoBox from "./utils/TripStorageInfoBox";
//const socket = io(process.env.REACT_APP_BACKEND_BASEURL);


const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;
// Styled Components
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  body {
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
    background: #f8fafc;
    color: #1e293b;
  }
  
  * {
    box-sizing: border-box;
  }
`;

const Container = styled.div`
  max-width: 480px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 14px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.4s ease-out;
`;

const AppHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  border-bottom:4px solid #F5F5F8;
  padding-bottom:10px;
`;

const Logo = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 0px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
`;

const BusIcon = styled.span`
  font-size: 1.8rem;
color: #224871;
`;

const TitleText = styled.span`
  background: #224871;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
font-size:22px;
`;

const TripStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 2rem;
  padding: 12px 16px;
  background: ${props => props.active ? '#f0fdf4' : '#f8fafc'};
  border-radius: 1px;
  border: 1px solid ${props => props.active ? '#dcfce7' : '#e2e8f0'};
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.active ? '#22c55e' : '#94a3b8'};
  box-shadow: 0 0 0 4px ${props => props.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)'};
`;

const StatusText = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.active ? '#166534' : '#475569'};
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const SelectLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 3px;
  font-size: 1rem;
  background-color: white;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 1em;
  
  &:focus {
    outline: none;
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
  }
  
  &:disabled {
    background-color: #f1f5f9;
    cursor: not-allowed;
  }
`;

const BaseButton = styled.button`
  border: none;
  padding: 14px 24px;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    transform: none;
  }
`;

const PrimaryButton = styled(BaseButton)`
  background: #224871;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
  
  &:hover:not(:disabled) {
    background: #224871;
    box-shadow: 0 6px 8px -1px rgba(99, 102, 241, 0.4);
  }
`;

const SecondaryButton = styled(BaseButton)`
  background: white;
  color: #ef4444;
  border: 1px solid #fecaca;
  
  &:hover:not(:disabled) {
    background: #fef2f2;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  }
`;

const ButtonIcon = styled.span`
  font-size: 1.2rem;
`;

const StatusMessage = styled.div`
  padding: 14px;
  background: #f8fafc;
  border-radius:6px;
  text-align: center;
  margin: 1.5rem 0;
  color: #64748b;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const ActiveIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
  }
`;


const DriverTrip = () => {
  const socketRef = useRef(null);
//
const LOCAL_STORAGE_KEY = "current_trip-driver123";

const getInitialTripState = () => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Invalid trip data:", e);
    }
  }
  return {
    routes:[],
    tripStarted: false,
    tripId: null,
    selectedRoute: null,
    coordinates: []
  };
};

const initialTrip = getInitialTripState();
const [routes, setRoutes] = useState(initialTrip.routes);
const [tripStarted, setTripStarted] = useState(initialTrip.tripStarted);
const [tripId, setTripId] = useState(initialTrip.tripId);
const [selectedRoute, setSelectedRoute] = useState(initialTrip.selectedRoute);
const [coordinates, setCoordinates] = useState(initialTrip.coordinates);

//
const [isEndTripLoading, setIsEndTripLoading] = useState(false);
const [isStartTripLoading, setIsStartTripLoading] = useState(false);
  const watchIdRef = useRef(null);
  const saveCounterRef = useRef(0);

  const backend_baseurl = process.env.REACT_APP_BACKEND_BASEURL;
  const busId = "68069b59272293206bf1a445";

  const localStorageKey = tripId
    ? `trip-${busId}-${selectedRoute}-${tripId}`
    : null;
    const showAlert = (status = 'error', text = 'Something went wrong.') => {
      const statusConfig = {
        error: {
          iconColor: '#ef4444',
          background: '#fee2e2',
          icon: 'error',
        },
        success: {
          iconColor: '#22c55e',
          background: '#dcfce7',
          icon: 'success',
        },
        warning: {
          iconColor: '#f59e0b',
          background: '#fef3c7',
          icon: 'warning',
        },
        info: {
          iconColor: '#3b82f6',
          background: '#dbeafe',
          icon: 'info',
        },
      };
    
      const config = statusConfig[status] || statusConfig.error;
    
      Swal.fire({
        text,
        icon: config.icon,
        background: 'white', // Modern dark background
        color: '#224871', // Light text
        iconColor: config.iconColor,
        showConfirmButton: false,
        position: 'top-end',
        width: '400px',
        backdrop: false,
        timer: 3000,
        customClass: {
          popup: 'animated-alert', // For custom animations
        },
        showClass: {
          popup: `
            animate__animated 
            animate__fadeInRight 
            animate__faster
          `,
        },
        hideClass: {
          popup: `
            animate__animated 
            animate__fadeOutRight 
            animate__faster
          `,
        },
        buttonsStyling: false,
        padding: '1.25rem',
        borderRadius: '12px',
      });
    };
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

//start persistance logic

useEffect(() => {
  const tripData = {
    routes,
    tripStarted,
    tripId,
    selectedRoute,
    coordinates
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tripData));
}, [routes,tripStarted, tripId, selectedRoute, coordinates]);

//end persisitance logic
  useEffect(() => {
    let getRoutes = async()=>{
      try{
        const res = await axios.get(`${backend_baseurl}/api/v1/routes`)
        setRoutes(res.data)
      }catch(err){
        console.log(err);
        //alert("error while getting routes",err )
        showAlert('error' ,`error while getting routes : ${err}`)
      }
    }
 
      getRoutes()
      
  }, []);
// External function to check GPS status
const checkGPSStatus = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser'));
    }

    // We'll use a timeout to handle cases where GPS might be enabled but not responding
    const timeoutId = setTimeout(() => {
      reject(new Error('GPS check timed out. Please ensure GPS is enabled.'));
    }, 5000); // 5 seconds timeout

    // Test geolocation with a simple getCurrentPosition call
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve(true);
      },
      (error) => {
        clearTimeout(timeoutId);
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'GPS permission denied. Please enable GPS to start the trip.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'GPS signal is unavailable. Please check your GPS connection.';
            break;
          case error.TIMEOUT:
            errorMessage = 'GPS request timed out. Please ensure GPS is enabled and try again.';
            break;
          default:
            errorMessage = 'Unknown GPS error occurred.';
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 4000 // 4 seconds for the GPS check itself
      }
    );
  });
};


  const startTrip = async () => {
    if (!selectedRoute) return showAlert('warning', 'Please select a route before starting the trip.');
    setIsStartTripLoading(true)
    try {
      await checkGPSStatus();
      const res = await axios.post(`${backend_baseurl}/api/v1/trips/start`,{ busId, routeId: selectedRoute })
      console.log(res);
      
      const data = res.data;
      setTripId(data.tripId);
      setTripStarted(true);
      setCoordinates([]);
      saveCounterRef.current = 0;
    //  alert("Trip started and data saved.");
      showAlert('success' ,`Trip started Successfully`)
    } catch (error) {
      console.error("Failed to start trip:", error);
      //alert(" error while starting a Trip ",error);
      showAlert('error' ,`Error While Starting A Trip : ${error}`)
    }finally{
      setIsStartTripLoading(false)
    }
  };

  const endTrip = async () => {
    if (!tripId) return;
setIsEndTripLoading(true)
    const finalCoordinates = [...coordinates];

    try {
      await axios.post(`${backend_baseurl}/api/v1/trips/end`,{ tripId , coordinates: finalCoordinates })
      if (localStorageKey) {
        localStorage.removeItem(localStorageKey);
      }

      setTripStarted(false);
      setTripId(null);
      setCoordinates([]);
      saveCounterRef.current = 0;

      //safty cleanup
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if(LOCAL_STORAGE_KEY){
        localStorage.removeItem(LOCAL_STORAGE_KEY); 
      }
      //alert("Trip ended and data saved.");
      showAlert('success' ,`Trip ended Successfully`)
    } catch (e) {
      //alert("Error ending trip");
       console.log(e);
      showAlert('error' ,`Error ending trip : ${e}`)
    } finally{
      setIsEndTripLoading(false)
    }
  };

// Kalman Filter Class Implementation
class GPSKalmanFilter {
  constructor() {
    this.R = 0.01; // Noise of measurement
    this.Q = 0.1; // Noise of process
    this.A = 1; // State transition
    this.B = 0; // Control input
    this.C = 1; // Measurement
    this.cov = NaN;
    this.x = NaN; // Estimated signal
  }

  filter(measurement) {
    if (isNaN(this.x)) {
      this.x = measurement;
      this.cov = this.Q;
    } else {
      // Prediction
      const predX = this.A * this.x;
      const predCov = this.A * this.cov * this.A + this.Q;

      // Kalman gain
      const K = predCov * this.C / (this.C * predCov * this.C + this.R);

      // Correction
      this.x = predX + K * (measurement - this.C * predX);
      this.cov = predCov - K * this.C * predCov;
    }
    return this.x;
  }
}

// Your tracking useEffect with all improvements
useEffect(() => {
  if (!tripStarted || !tripId) return;

  // Initialize filters and tracking variables
  const latFilter = new GPSKalmanFilter();
  const lngFilter = new GPSKalmanFilter();
  //let lastGoodPosition = null;
  let consecutiveBadAccuracyCount = 0;

  if ("geolocation" in navigator) {
   
    // Connect to socket
    socketRef.current = io(process.env.REACT_APP_BACKEND_BASEURL);
    console.log("login agin " , socketRef.current);
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        console.log("login agin 2 " , watchIdRef.current);
        // Accuracy threshold check (15 meters or better)
        if (pos.coords.accuracy > 15) {
          consecutiveBadAccuracyCount++;
          console.warn(`Ignoring position with accuracy ${pos.coords.accuracy}m`);
          
          // If we get too many bad readings in a row, warn the user
          if (consecutiveBadAccuracyCount >= 5) {
            showAlert('warning', 'Poor GPS accuracy detected. Please check your device location.');
            consecutiveBadAccuracyCount = 0;
          }
          return;
        }
        consecutiveBadAccuracyCount = 0;

        // Apply Kalman filtering
        const filteredLat = latFilter.filter(pos.coords.latitude);
        const filteredLng = lngFilter.filter(pos.coords.longitude);
        
        const point = {
          lat: filteredLat,
          lng: filteredLng,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toISOString()
        };

        // Speed validation if we have previous points
       /* if (lastGoodPosition) {
          const distance = haversineDistance(
            lastGoodPosition.lat,
            lastGoodPosition.lng,
            point.lat,
            point.lng
          );
          const timeDiff = (new Date(point.timestamp) - new Date(lastGoodPosition.timestamp)) / 1000;
          const speed = timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0; // km/h
          
          // Validate against reasonable bus speeds (0-120 km/h)
          if (speed > 120) {
            console.warn(`Implausible speed: ${speed.toFixed(1)} km/h - ignoring point`);
            return;
          }
        }

        // Update last good position
        lastGoodPosition = point;*/

        setCoordinates((prev) => {
          // FIRST COORDINATE: Store but don't emit yet
          if (prev.length === 0) {
            return [point];
          }

          // SECOND COORDINATE: Validate against first
          if (prev.length === 1) {
            const distance = haversineDistance(
              prev[0].lat,
              prev[0].lng,
              point.lat,
              point.lng
            );

            // Good start (<10m apart) - keep both
            if (distance < 10) {
              const updated = [...prev, point];
              // Now emit both
              socketRef.current.emit("locationUpdate", {
                tripId,
                routeId: selectedRoute,
                busId,
                lat: prev[0].lat,
                lng: prev[0].lng,
              });
              socketRef.current.emit("locationUpdate", {
                tripId,
                routeId: selectedRoute,
                busId,
                lat: point.lat,
                lng: point.lng,
              });
              return updated;
            }
            // Bad start (≥10m apart) - discard first, use second
            else {
              console.log("Discarded inaccurate first coordinate");
              // Only emit the second coordinate
              socketRef.current.emit("locationUpdate", {
                tripId,
                routeId: selectedRoute,
                busId,
                lat: point.lat,
                lng: point.lng,
              });
              return [point]; // Second coordinate becomes the first
            }
          }

          // NORMAL OPERATION (after first two points)
          const updated = [...prev];
          const lastPoint = updated[updated.length - 1];

          // Redundancy check
          if (lastPoint) {
            const isSameLocation =
              lastPoint.lat.toFixed(5) === point.lat.toFixed(5) &&
              lastPoint.lng.toFixed(5) === point.lng.toFixed(5);
            if (isSameLocation) {
              console.log("Ignored redundant location");
              return updated;
            }

            // Out of range check (>300m sudden jump)
            const distance = haversineDistance(
              lastPoint.lat,
              lastPoint.lng,
              point.lat,
              point.lng
            );
            if (distance > 300) {
              console.warn("Ignored jumpy location, distance:", distance);
              return updated;
            }
          }

          updated.push(point);

          // Save every 5 points
          saveCounterRef.current += 1;
          if (saveCounterRef.current >= 5) {
            if (localStorageKey) {
              localStorage.setItem(localStorageKey, JSON.stringify(updated));
              console.log("Saved to localStorage", updated.length, "points");
            }
            saveCounterRef.current = 0;
          }

          // Emit new position
          socketRef.current.emit("locationUpdate", {
            tripId,
            routeId: selectedRoute,
            busId,
            lat: point.lat,
            lng: point.lng,
          });

          return updated;
        });
      },
      (error) => {
        console.error("Location error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          showAlert('warning', ' [Location Permission Denied] Please Enable GPS access To Get All System Features.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          showAlert('warning', 'Location Position Unavailable. Please Check Your GPS Signal.');
        } else if (error.code === error.TIMEOUT) {
          showAlert('warning', 'GPS signal timed out. Please ensure good GPS reception.');
        } else {
          showAlert('warning', 'Unable To Retrieve Location.');
        }
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 0, 
        timeout: 10000 
      }
    );
  } else {
    showAlert('error', 'Geolocation is not supported by your browser.');
  }

  // Cleanup function
  return () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
}, [tripStarted, tripId]);
  //safty cleanup
  useEffect(() => {
    //in general
      // run when depandacy state change
  //run when component close
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);
 
  


  const [showInfoBox, setShowInfoBox] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const toggleInfoBox = () => {
    setRefreshKey(prev => prev + 1); // trigger fresh data
    setShowInfoBox(prev => !prev);
  };
  return (
    <>
    <GlobalStyle />
    <Container>
      <AppHeader>
        <Logo src="/logo.png" alt="Company Logo" />
        <Title>
          <BusIcon><FaBus size={23}/></BusIcon>
          <TitleText>DRIVER APP</TitleText>
        </Title>
      </AppHeader>
      
      <TripStatus active={tripStarted}>
        <StatusIndicator active={tripStarted} />
        <StatusText>
          {tripStarted ? 'TRIP IN PROGRESS' : 'TRIP NOT STARTED'}
        </StatusText>
      </TripStatus>
      
      <FormGroup>
        <SelectLabel>Select Route</SelectLabel>
        <Select
          onChange={(e) => setSelectedRoute(e.target.value)}
          value={selectedRoute}
          disabled={tripStarted}
        >
          <option value="" disabled>
            Choose a route...
          </option>
          {routes?.map((route) => (
            <option key={route._id} value={route._id}>
              {route.name}
            </option>
          ))}
        </Select>
      </FormGroup>
  
      {!tripStarted ? (
  isStartTripLoading ? (
    <StatusMessage>
      <PulseLoader color="#6366f1" size={10} />
      <span>Starting Trip...</span>
    </StatusMessage>
  ) : (
    <PrimaryButton 
      onClick={startTrip}
      disabled={!selectedRoute || isStartTripLoading}
    >
      <ButtonIcon><FaPlay /></ButtonIcon>
      Start Trip
    </PrimaryButton>
  )
) : isEndTripLoading ? (
  <StatusMessage>
    <PulseLoader color="#6366f1" size={10} />
    <span>Processing Trip Completion...</span>
  </StatusMessage>
) : (
  <SecondaryButton onClick={endTrip}>
    <ButtonIcon><FaStop /></ButtonIcon>
    End Current Trip
  </SecondaryButton>
)}

{tripStarted && !isEndTripLoading && !isStartTripLoading && (
  <StatusMessage>
    <ActiveIndicator />
    <span>Tracking location in real-time...</span>
  </StatusMessage>
)}

<div style={{ marginTop: "10px" }}>
      <button onClick={toggleInfoBox} style={{ padding: "10px 16px", background: "white", color: "#224871", border: "1px solid #6C757D", borderRadius: "3px" }}>
        {showInfoBox ? "Hide Trip Storage Info" : "Show Trip Storage Info"}
      </button>

      {showInfoBox && <TripStorageInfoBox refreshKey={refreshKey} />}
    </div>

    </Container>
  </>
  
  );
};

export default DriverTrip;