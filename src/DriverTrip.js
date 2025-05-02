import axios from "axios";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Swal from 'sweetalert2'
import styled, { keyframes,createGlobalStyle } from 'styled-components';
import { PulseLoader } from 'react-spinners';

//const socket = io(process.env.REACT_APP_BACKEND_BASEURL);


// Styled Components
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  
  body {
    font-family: 'Poppins', sans-serif;
    margin: 0;
    padding: 0;
    background: #f5f7fa;
  }
`;
const Logo = styled.img`
  display: block;
  margin: 0 auto 1rem;
  max-width: 150px;
  height: auto;
`;
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.5s ease-out;
`;

const Title = styled.h2`
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 1rem;
  background-color: #f9f9f9;
  transition: all 0.3s;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Button = styled.button`
  background: ${props => props.primary ? '#3498db' : '#e74c3c'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.primary ? '#2980b9' : '#c0392b'};
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  margin: 1rem 0;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const TripIndicator = styled.div`
  height: 10px;
  width: 100%;
  background: ${props => props.active ? 'linear-gradient(90deg, #2ecc71, #27ae60)' : '#ecf0f1'};
  border-radius: 5px;
  margin: 1.5rem 0;
  transition: all 0.5s;
`;


const DriverTrip = () => {
  const socketRef = useRef(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [tripStarted, setTripStarted] = useState(false);
  const [tripId, setTripId] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef(null);
  const saveCounterRef = useRef(0);

  const backend_baseurl = process.env.REACT_APP_BACKEND_BASEURL;
  const busId = "68069b59272293206bf1a445";

  const localStorageKey = tripId
    ? `trip-${busId}-${selectedRoute}-${tripId}`
    : null;
    const showAlert = (status='error',text='Someting Went Wrong.') => {
      Swal.fire({
        //title: 'Alert',
        text: text,
        icon:status,
        /*showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        position: 'top-end',
        timer: 1500*/
      })
    }
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

  const startTrip = async () => {
    if (!selectedRoute) return showAlert('warning', 'Please select a route before starting the trip.');
    try {
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
      showAlert('error' ,`error while starting a Trip : ${error}`)
    }
  };

  const endTrip = async () => {
    if (!tripId) return;
setIsLoading(true)
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
      //alert("Trip ended and data saved.");
      showAlert('success' ,`Trip ended Successfully`)
    } catch (e) {
      //alert("Error ending trip");
       console.log(e);
      showAlert('error' ,`Error ending trip : ${e}`)
    } finally{
      setIsLoading(false)
    }
  };

  useEffect(() => {
    if (tripStarted && tripId) {
      if ("geolocation" in navigator) {
         // Connect socket
    socketRef.current = io(process.env.REACT_APP_BACKEND_BASEURL);
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const timestamp = new Date().toISOString();
            const point = { lat: latitude, lng: longitude, timestamp };

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
          },
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 5000 }
        );
      } else {
        //alert("Geolocation is not supported by your browser.");
        showAlert('error' ,`Geolocation is not supported by your browser.`)
      }
    }
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
  
  return (
    <>
    <GlobalStyle />
    <Container>
      <Logo src="/logo.png" alt="Company Logo" />
      <Title>
        <span role="img" aria-label="bus">🚍</span> DRIVER TRIP APP
      </Title>
      
      <TripIndicator active={tripStarted} />
      
      <Select
        onChange={(e) => setSelectedRoute(e.target.value)}
        value={selectedRoute}
        disabled={tripStarted}
      >
        <option value="" disabled>
          Select a Route...
        </option>
        {routes.map((route) => (
          <option key={route._id} value={route._id}>
            {route.name}
          </option>
        ))}
      </Select>

      {!tripStarted ? (
        <Button 
          primary 
          onClick={startTrip}
          disabled={!selectedRoute}
        >
          Start Trip
        </Button>
      ) : isLoading ? (
        <StatusMessage>
          <PulseLoader color="#3498db" size={8} />
          <span>Processing trip completion...</span>
        </StatusMessage>
      ) : (
        <Button onClick={endTrip}>
          End Current Trip
        </Button>
      )}
      
      {tripStarted && !isLoading && (
        <StatusMessage>
          <span role="img" aria-label="active">🔴</span> 
          Trip in progress - Tracking location...
        </StatusMessage>
      )}
    </Container>
    </>
  );
};

export default DriverTrip;