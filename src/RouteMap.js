import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState, useCallback } from "react";
import L from "leaflet";
import io from "socket.io-client"; // 🔴 ADD
import "leaflet/dist/leaflet.css";
import { useRef } from "react";
import Swal from 'sweetalert2'
import axios from "axios";
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { PulseLoader } from 'react-spinners';
import { FaLayerGroup, FaTrashAlt, FaCheck, FaBus, FaExpand, FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaRoute, FaTrash, FaSave, FaPlus, FaClock, FaTrafficLight } from 'react-icons/fa';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;
// Animations
const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideOut = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
`;
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
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`;

const Header = styled.header`
  background: white;
  padding: 1px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Logo = styled.img`
  height: 85px;
  max-width: 100%;
  object-fit: contain;
`;


// Styled Components
const PanelContainer = styled.div`
  position: absolute;
  top: 8px;
  left: 50px;
  z-index: 1000;
  display: flex;
`;

const ToggleButton = styled.button`

  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 8px ;
  width: 32px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  
  &:hover {
    background: #f8f9fa;
  }
`;
const MapStyledContainer = styled.div`
  position: relative;
  flex-grow: 1;
  height: calc(100vh - 80px);
`;
const ControlPanel = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius:  8px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 290px;
  font-family: 'Segoe UI', Roboto, sans-serif;
  animation: ${props => props.isOpen ? slideIn : slideOut} 0.3s forwards;
  transform-origin: left center;
    @media (max-width: 380px) {
    width: 220px;
}
`;

const PanelSection = styled.div`
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? '#3498db' : props.danger ? '#e74c3c' : '#f8f9fa'};
  color: ${props => props.primary || props.danger ? 'white' : '#2c3e50'};
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background: ${props => props.primary ? '#2980b9' : props.danger ? '#c0392b' : '#e9ecef'};
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #ecf0f1;
    color: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  transition: all 0.2s;
  margin-bottom: 12px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const TrafficInfoCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const TrafficRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
`;

const TrafficLabel = styled.span`
  color: #7f8c8d;
  font-weight: 500;
`;

const TrafficValue = styled.span`
  font-weight: 600;
  color: ${props => {
    if (props.danger) return '#e74c3c';
    if (props.warning) return '#f39c12';
    if (props.success) return '#27ae60';
    return '#2c3e50';
  }};
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  padding: 8px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
  margin-top: 8px;
  font-size: 14px;
`;
const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
`;
const SwalStyles = createGlobalStyle`
  .swal-confirm-btn {
    background-color: #3498db !important;
    &:hover {
      background-color: #2980b9 !important;
    }
  }
  .swal-cancel-btn {
    background-color: #e74c3c !important;
    &:hover {
      background-color: #c0392b !important;
    }
  }
`;
// Socket connection here wrong becuse its effect by other components 
//const socket = io(process.env.REACT_APP_BACKEND_BASEURL);

// Custom icons
const createCustomIcon = (color, letter,iconSize, borderColor = 'white') => new L.DivIcon({
  html: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="${borderColor}" stroke-width="2"/>
      <text x="12" y="16" font-size="12" text-anchor="middle" fill="white" font-weight="bold">${letter}</text>
    </svg>
  `,
  className: "",
  iconSize: [iconSize, iconSize],
  iconAnchor: [12, 12]
});

const startIcon = createCustomIcon('#00B0F0', 'S',25);
const endIcon = createCustomIcon('#00B0F0', 'E',25);
const busLiveIcon = createCustomIcon('green', 'B',28);
const stationsIcon = createCustomIcon('black', 'S',26);
const busOfflineIcon = createCustomIcon('#95a5a6', 'N',24);
const RouteMap = () => {
  const socketRef = useRef(null);
  const currentTripRef = useRef({ routeId: null, tripId: null });
  const backend_baseurl = process.env.REACT_APP_BACKEND_BASEURL;
  const TOMTOM_API_KEY = 'H1acEMeFQr8cJsAOgL0nT1drv7lyA2Fe';
  const showAlert = (status = 'error', text = 'Someting Went Wrong.') => {
    Swal.fire({
      //title: 'Alert',
      text: text,
      icon: status,
      /*showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      position: 'top-end',
      timer: 1500*/
    })
  }
  // Color scheme
  const colors = {
    plannedRoute: '#3388ff',
    //activeTrip: '#555',
    completedTrip: '#ff7800',
    liveBus: '#e53e3e',
    offlineBus: '#718096',
    station: '#38a169'
  };

  const [selectedTile, setSelectedTile] = useState('osm'); // Default to OpenStreetMap

  const tileLayers = {
    osm: {
      name: 'OpenStreetMap',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    },
    esri: {
      name: 'Esri World Imagery',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    }
  };
  const [route, setRoute] = useState([]);
  const [stations, setStations] = useState([]);
  const [isDrawing, setIsDrawing] = useState(true);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [isNewRoute, setIsNewRoute] = useState(true);

  const [busPath, setBusPath] = useState([]); 

  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [tripPath, setTripPath] = useState([]);
  const [tripCoordinatesTimestamp, setTripCoordinatesTimestamp] = useState([]);

  const mapRef = useRef(null);
  const [shouldFitBounds, setShouldFitBounds] = useState(false);

  const [tripLatestLiveCoordinates, setTripLatestLiveCoordinates] = useState([]);
  const [disabledDuringDrow, setDisabledDuringDrow] = useState(false);


  const [trafficInfo, setTrafficInfo] = useState(null);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  // Reset `shouldFitBounds` after fitting is complete
  const handleFitBoundsComplete = () => {
    setShouldFitBounds(false);
  };
 
 /* useEffect(() => {
    const socket = io(process.env.REACT_APP_BACKEND_BASEURL);
    console.log(socket);
    
    socket.on("busLocationUpdate", ({ tripId, routeId, busId, lat, lng }) => {
      console.log("socket");
      if (routeId === selectedRouteId && tripId == selectedTripId) {
        setBusPath([[lat, lng]]);
      }
    });
    return () => socket.disconnect();
  }, [selectedRouteId, selectedTripId]);*/

  const toRadians = (degrees) => degrees * (Math.PI / 180);

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getWalkingRoute = async (from, to, apiKey) => {
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${from.lng},${from.lat}:${to.lng},${to.lat}/json?key=${apiKey}&travelMode=pedestrian`;

  const res = await axios.get(url);
  const data =  res.data;

  if (data.routes?.[0]) {
    const summary = data.routes[0].summary;
    return {
      distance: summary.lengthInMeters,
      time: summary.travelTimeInSeconds
    };
  }
  return null;
};

const findNearestStationEfficiently = async (userLat, userLng, apiKey, limit = 3) => {
  try {
    const response = await axios.get(`${backend_baseurl}/api/v1/stations`);
    const stations = response.data;

    if (!stations.length) return [];

    // Step 1: Sort by Haversine distance
    const sortedByHaversine = stations
      .map(st => ({
        ...st,
        haversine: haversineDistance(userLat, userLng, st.lat, st.lng)
      }))
      .sort((a, b) => a.haversine - b.haversine);

    const closestStations = sortedByHaversine.slice(0, Math.min(limit, sortedByHaversine.length));

    // Step 2: Get walking route using TomTom API
    const tomTomResults = [];

    for (const station of closestStations) {
      try {
        const route = await getWalkingRoute(
          { lat: userLat, lng: userLng },
          { lat: station.lat, lng: station.lng },
          apiKey
        );

        if (route) {
          tomTomResults.push({
            ...station,
            walkingDistance: route.distance,
            walkingTime: route.time
          });
        }
      } catch (err) {
        console.error("TomTom error for station:", station.name || station._id, err);
        // Continue to next station
      }

      await delay(1000); // Wait 1s between requests
    }

    // Step 3: Return sorted by walking time
    if (tomTomResults.length) {
      return tomTomResults
        .sort((a, b) => a.walkingTime - b.walkingTime)
        .slice(0, 3);
    } else {
      // TomTom failed or returned nothing
      console.warn("TomTom failed, falling back to Haversine.");
      return closestStations.map(st => ({
        ...st,
        fallback: true,
        haversineDistanceInMeters: st.haversine
      }));
    }

  } catch (error) {
    console.error("Error in finding stations:", error);
    return [];
  }
};

// Example usage in React
useEffect(() => {
  const getNearest = async () => {
    const stations = await findNearestStationEfficiently(30.044710, 31.384037, TOMTOM_API_KEY);
    console.log("Top 3 nearest stations (walking or fallback):", stations);
  };

  getNearest();
}, []);

useEffect(() => {
  currentTripRef.current = { 
    routeId: selectedRouteId, 
    tripId: selectedTripId 
  };

}, [selectedRouteId, selectedTripId]);
  useEffect(() => {

    // Connect socket on component mount
    socketRef.current = io(process.env.REACT_APP_BACKEND_BASEURL);

    console.log(socketRef.current);
    // Listen to live bus updates
    const handleBusUpdate = ({ tripId, routeId, busId, lat, lng }) => {
      console.log({ tripId, routeId, busId, lat, lng });
      //this not allowed becuse  selectedRouteId and  selectedTripId is still with deff values
     // if (routeId === selectedRouteId && tripId == selectedTripId) {
        const current = currentTripRef.current;
        if (routeId === current.routeId && tripId === current.tripId) {
        setBusPath([[lat, lng]]);
      }
    };

    socketRef.current.on("busLocationUpdate", handleBusUpdate);

    return () => {
      // Clean up listeners and connection on unmount
      if (socketRef.current) {
        socketRef.current.off("busLocationUpdate", handleBusUpdate);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if(currentTripRef.current){
        currentTripRef.current ={ routeId: null, tripId: null }
      }
    };
  }, []);

  //get routes [main keys] to select route from dropdown ,
  useEffect(() => {

    let getRoutes = async () => {
      try {
        const res = await axios.get(`${backend_baseurl}/api/v1/routes`)
        setSavedRoutes(res.data)
      } catch (err) {
        console.log(err);
        //alert("error while getting routes",err )
        showAlert('error', `error while getting routes : ${err}`)
      }
    }

    getRoutes()
  }, []);


  //get one route [detailed keys] selected  from dropdown , and get its trips [main keys]
  useEffect(() => {
    if (!selectedRouteId) return;
    //clear old route selected data
    setBusPath([])
    setTrips([])
    setSelectedTripId(null)
    setTripPath([]);
    setTripCoordinatesTimestamp([]);
    setTripLatestLiveCoordinates([])
    //
    let getData = async () => {
      // Fetch route details
      try {
        const res = await axios.get(`${backend_baseurl}/api/v1/routes/${selectedRouteId}`)
        let data = res.data
        console.log(data);
        
        setRoute(data.coordinates.map(({ lat, lng }) => [lat, lng]));
        setStations(data.stations);
        setIsDrawing(false);
        setIsNewRoute(false);
        setShouldFitBounds(true);

         //start tomtom integration 


 let getRouteDistance = async (coordinates) => {
  try {
    // Coordinates must be in the format: [ [lon1, lat1], [lon2, lat2], ... ]
    const formattedCoords = coordinates.map(coord => coord.join(',')).join(':');
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${formattedCoords}/json?key=${TOMTOM_API_KEY}&traffic=true`;

    const response = await axios.get(url);
    const summary = response.data.routes[0].summary;
console.log(summary)
    return {
      distanceInMeters: summary.lengthInMeters,
      travelTimeInSeconds: summary.travelTimeInSeconds,
      trafficLengthInMeters:summary.trafficLengthInMeters,
      trafficDelayInSeconds:summary.trafficDelayInSeconds
    };
  } catch (error) {
    console.error('TomTom Route API error:', error);
    return null;
  }
};    

getRouteDistance(data.coordinates.map(({ lat, lng }) => [lng, lat])).then((result) => {
  if (result) {
    // Convert metrics
    const distanceKm = (result.distanceInMeters / 1000).toFixed(1);
    const travelTimeMin = Math.round(result.travelTimeInSeconds / 60);
    const delayMin = Math.round(result.trafficDelayInSeconds / 60);
    const congestionPercent = Math.round((result.trafficLengthInMeters / result.distanceInMeters) * 100);

    // Build message
    let message = `🚗 ROUTE SUMMARY 🚗\n` +
                 `• Total distance: ${distanceKm} km\n` +
                 `• Estimated time: ${travelTimeMin} min\n`;

    // Traffic details
    if (delayMin > 1 || congestionPercent > 10) {
      message += `• Traffic delay: ${delayMin} min\n` +
                 `• Congestion: ${congestionPercent}% of route\n`;
      
      if (delayMin > 15) message += "⚠️ Heavy traffic - consider alternatives";
      else if (delayMin > 5) message += "⏳ Moderate traffic - add extra time";
    } else {
      message += "✅ Light traffic - smooth journey";
    }

    showAlert('info', message);
  }
});
//end tomtom integration  
      } catch (err) {
        console.log(err);
        showAlert('error', `Error loading selected route : ${err}`)
      }

      // Fetch trips for that route
      try {
        const res = await axios.get(`${backend_baseurl}/api/v1/trips/by-route/${selectedRouteId}`)
        setTrips(res.data)
      } catch (err) {
        console.log(err);
        showAlert('error', `error while getting trips : ${err}`)
      }
    }
    getData();
  }, [selectedRouteId]);

  //get one trip [detailed keys]  selected  from dropdown ,
  useEffect(() => {
    if (!selectedTripId) return;

    //clear old trip data
    setBusPath([]);
    setTripPath([]);
    setTripCoordinatesTimestamp([]);
    setTripLatestLiveCoordinates([])

    let getSelectedTripDetails = async () => {
      try {
        const res = await axios.get(`${backend_baseurl}/api/v1/trips/${selectedTripId}`)
        let data = res.data
        // Convert trip coordinates to Leaflet format: [[lat, lng], ...]
        const path = data.coordinates.map((point) => [point.lat, point.lng]);
        setTripPath(path);
        const timestamp = data.coordinates.map((t) => [t.timestamp]);
        setTripCoordinatesTimestamp(timestamp);
        let latestLiveCoordinates = data.latestLiveCoordinates;
        if (latestLiveCoordinates && latestLiveCoordinates.lat && latestLiveCoordinates.lng) {
          setTripLatestLiveCoordinates([[latestLiveCoordinates.lat, latestLiveCoordinates.lng]])
        }
        //there is time of latestSyncedCoordinates
      } catch (err) {
        console.log(err);
        showAlert('error', `Error fetching trip data: : ${err}`)
      }
    }
    getSelectedTripDetails()
  }, [selectedTripId]);


  const handleMapClick = useCallback(
    (e) => {
      if (!isDrawing) return;
      const { lat, lng } = e.latlng;
      const last = route[route.length - 1];
      if (!last || last[0] !== lat || last[1] !== lng) {
        setRoute((prev) => [...prev, [lat, lng]]);
      }
    },
    [isDrawing, route]
  );

  const handleRightClick = useCallback(async(e) => {
    if (!isDrawing) return;
    //const name = prompt("Enter station name:");
    const { value: name } = await Swal.fire({
      title: 'Save Station',
      text: 'Enter a name for this Station:',
      input: 'text',
      inputPlaceholder: 'e.g., Nasr City Makkram Ebid',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a station name!';
        }
        if (value.length > 50) {
          return 'station name must be less than 50 characters!';
        }
      },
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      },
      background: '#f8f9fa'
    });
  

    if (name) {
      setStations((prev) => [
        ...prev,
        { name, lat: e.latlng.lat, lng: e.latlng.lng },
      ]);
    }
  }, [isDrawing]);

  const MapClickHandler = () => {
    useMapEvents({
      click: handleMapClick,
      contextmenu: handleRightClick,
    });
    return null;
  };

  const FitBoundsToRoute = ({ route, isDrawing, selectedRouteId, shouldFitBounds, onFitBoundsComplete }) => {
    const map = useMap();

    useEffect(() => {
      if (shouldFitBounds && !isDrawing && route.length > 0 && selectedRouteId) {
        const bounds = L.latLngBounds(route);
        map.fitBounds(bounds, { padding: [50, 50] });

        // Notify parent that fitting is complete
        onFitBoundsComplete();
      }
    }, [route, isDrawing, selectedRouteId, shouldFitBounds, map, onFitBoundsComplete]);

    return null;
  };
  const removeLastPoint = () => {
    setRoute((prev) => prev.slice(0, -1));
  };

  const finishRoute = () => {
    if (route.length < 2) return alert("At least two points required.");
    setIsDrawing(false);
  };

  const saveRoute = async () => {
    //const name = prompt("Route Name:");
    const { value: name } = await Swal.fire({
      title: 'Save Route',
      text: 'Enter a name for this Route:',
      input: 'text',
      inputPlaceholder: 'e.g., Nasr City - tahrir squire',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a Route name!';
        }
        if (value.length > 50) {
          return 'Route name must be less than 50 characters!';
        }
      },
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      },
      background: '#f8f9fa'
    });
    if (!name) return;
    try {
      const response = await axios.post(`${backend_baseurl}/api/v1/routes`, {
        name,
        coordinates: route.map(([lat, lng]) => ({ lat, lng })),
        stations,
      });

      const data = response.data
      showAlert('success', `Route Adding Successfully`)
      setSavedRoutes((prev) => [...prev, data]);
      setRoute([]);
      setStations([]);
      setIsDrawing(true);
      setIsNewRoute(true);
      setSelectedRouteId(null);
      setDisabledDuringDrow(false)
    } catch (err) {
      console.log(err);
      showAlert('error', `Error saving route: ${err}`)
    }
  };

  const startNewRoute = () => {
    setRoute([]);
    setStations([]);
    setIsDrawing(true);
    setSelectedRouteId(null);
    setSelectedTripId(null);
    setIsNewRoute(true);
    setBusPath([]);
    setTripPath([]);
    setTripCoordinatesTimestamp([]);
    setTripLatestLiveCoordinates([])
    setDisabledDuringDrow(true)
  };

  const estimateTravelTime = async () => {
    if (!selectedRouteId || route.length < 2) return;

    setIsLoadingTraffic(true);
    setError(null);

    try {
      console.log(route);

      // 1. Get base route from OpenRouteService
      const orsResponse = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': '5b3ce3597851110001cf62480f88fa10836b4c6990030f5767fb9d71'
        },
        body: JSON.stringify({
          coordinates: route.map(c => [c[1], c[0]]), // Convert to [lng, lat]
          instructions: false
        })
      });

      const orsData = await orsResponse.json();
      const baseDuration = orsData.routes[0].summary.duration; // in seconds

      // 2. Get traffic data from TomTom
      const tomTomResponse = await fetch(
        `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json` +
        `?key=H1acEMeFQr8cJsAOgL0nT1drv7lyA2Fe` +
        `&point=${route[0][0]},${route[0][1]}` + // Start point
        `&unit=KMPH`
      );

      const tomTomData = await tomTomResponse.json();
      const currentSpeed = tomTomData.flowSegmentData.currentSpeed;
      const freeFlowSpeed = tomTomData.flowSegmentData.freeFlowSpeed;

      // 3. Calculate adjusted time
      const congestionFactor = freeFlowSpeed / currentSpeed;
      const adjustedDuration = baseDuration * congestionFactor;

      setTrafficInfo({
        baseTime: Math.round(baseDuration / 60), // in minutes
        adjustedTime: Math.round(adjustedDuration / 60), // in minutes
        currentSpeed: Math.round(currentSpeed),
        freeFlowSpeed: Math.round(freeFlowSpeed),
        congestion: Math.round((1 - (currentSpeed / freeFlowSpeed)) * 100) // %
      });

    } catch (err) {
      setError("Failed to get traffic data. Using base estimation only.");
      console.error(err);
    } finally {
      setIsLoadingTraffic(false);
    }
  };

  return (
    <>
      <AppContainer>
        <Header>
          <Logo src="/logo.png" alt="Company Logo" />
          
        </Header>
        <MapStyledContainer>


          <MapContainer
            ref={mapRef}
            center={[30.0444, 31.2357]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={!isDrawing}
            doubleClickZoom={false}
          >
            <TileLayer
              attribution={tileLayers[selectedTile].attribution}
              url={tileLayers[selectedTile].url}
            />

            <MapClickHandler />
            <FitBoundsToRoute
              route={route}
              isDrawing={isDrawing}
              selectedRouteId={selectedRouteId}
              shouldFitBounds={shouldFitBounds}
              onFitBoundsComplete={handleFitBoundsComplete}
            />

            {/* Live Bus Marker */}
            {busPath.length > 0 && (
              <Marker position={busPath[0]} icon={busLiveIcon}>
                <Popup>Live Bus Location</Popup>
              </Marker>
            )}

            {/* Offline Bus Marker */}
            {tripLatestLiveCoordinates.length > 0 && (
              <Marker position={tripLatestLiveCoordinates[0]} icon={busOfflineIcon}>
                <Popup>Last Known Location</Popup>
              </Marker>
            )}

            {/* Trip Path */}
            {tripPath.length > 1 && (
              <Polyline
                positions={tripPath}
                color={colors.completedTrip}
                weight={5}
                opacity={0.8}
                dashArray={selectedTripId ? undefined : "5, 5"} // Dashed for completed trips
              />
            )}

            {/* Trip Start/End Markers */}
            {tripPath.length > 0 && (
              <>
                <Marker position={tripPath[0]} icon={startIcon}>
                  <Popup>Trip Start Point</Popup>
                </Marker>
                <Marker position={tripPath[tripPath.length - 1]} icon={endIcon}>
                  <Popup>Trip End Point</Popup>
                </Marker>
              </>
            )}

            {/* Planned Route */}
            {route.length > 1 && (
              <Polyline
                positions={route}
                color={trafficInfo ?
                  (trafficInfo.congestion < 30 ? '#4CAF50' :
                    trafficInfo.congestion < 70 ? '#FFC107' : '#F44336') :
                  colors.plannedRoute}
                weight={6}
                opacity={0.8}
              />
            )}

            {/* Route Start/End Markers */}
            {route.length > 0 && (
              <>
                <Marker position={route[0]} icon={startIcon}>
                  <Popup>Route Start Point</Popup>
                </Marker>
                <Marker position={route[route.length - 1]} icon={endIcon}>
                  <Popup>Route End Point</Popup>
                </Marker>
              </>
            )}

            {/* Incident Markers */}
            {trafficInfo?.incidents?.map((incident, i) => (
              <Marker
                key={`incident-${i}`}
                position={incident.coordinates}
                icon={new L.DivIcon({
                  html: `<div style="
                background: #ff4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-weight: bold;
              ">!</div>`,
                  className: '',
                  iconSize: [20, 20]
                })}
              >
                <Popup>
                  <strong>{incident.type}</strong><br />
                  {new Date(incident.startTime).toLocaleTimeString()} - {new Date(incident.endTime).toLocaleTimeString()}
                </Popup>
              </Marker>
            ))}
            {/* Stations */}
            {stations.map((station, idx) => (
              <Marker key={idx} position={[station.lat, station.lng]} icon={stationsIcon}>
                <Popup>
                  <strong>{station.name}</strong><br />
                  Station #{idx + 1}
                </Popup>
              </Marker>
            ))}

          </MapContainer>
          <PanelContainer>
            {isOpen && (
              <ControlPanel isOpen={isOpen}>
                {/* Map Style Selector */}
                <PanelSection>
                  <SectionTitle><FaLayerGroup /> Map Style</SectionTitle>
                  <StyledSelect
                    value={selectedTile}
                    onChange={(e) => setSelectedTile(e.target.value)}
                  >
                    <option value="osm">OpenStreetMap (Default)</option>
                    <option value="esri">Esri Satellite Imagery</option>
                  </StyledSelect>
                </PanelSection>

                {/* Drawing Controls */}
                <PanelSection>
                  <SectionTitle><FaRoute /> Route Drawing</SectionTitle>
                  <ButtonGroup>
                    <ActionButton
                      onClick={removeLastPoint}
                      disabled={!isDrawing || route.length === 0}
                      danger
                    >
                      <FaTrashAlt /> Remove Last
                    </ActionButton>
                    <ActionButton
                      onClick={finishRoute}
                      disabled={!isDrawing || route.length < 2}
                    >
                      <FaCheck /> Finish
                    </ActionButton>
                    <ActionButton
                      onClick={saveRoute}
                      disabled={!isNewRoute || isDrawing || route.length < 2}
                      primary
                    >
                      <FaSave /> Save
                    </ActionButton>
                    <ActionButton onClick={startNewRoute}>
                      <FaPlus /> New
                    </ActionButton>
                  </ButtonGroup>
                </PanelSection>

                {/* Route/Trip Selection */}
                {!disabledDuringDrow && (
                  <PanelSection>
                    <SectionTitle><FaMapMarkerAlt /> Route Selection</SectionTitle>
                    <StyledSelect
                      onChange={(e) => setSelectedRouteId(e.target.value)}
                      value={selectedRouteId || ""}
                    >
                      <option value="" disabled>Select a route</option>
                      {savedRoutes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}
                        </option>
                      ))}
                    </StyledSelect>

                    {trips.length > 0 && (
                      <>
                        <StyledSelect
                          onChange={(e) => setSelectedTripId(e.target.value)}
                          value={selectedTripId || ""}
                        >
                          <option value="" disabled>Select a trip</option>
                          {trips.map((trip) => (
                            <option key={trip._id} value={trip._id}>
                              {new Date(trip.startedAt).toLocaleString()} - {trip.endedAt ? new Date(trip.endedAt).toLocaleTimeString() : "ongoing"} 
                            </option>
                          ))}
                        </StyledSelect>
                        <ActionButton
                          onClick={() => setShouldFitBounds(true)}
                          disabled={!selectedRouteId}
                        >
                          <FaExpand /> Fit Bounds
                        </ActionButton>
                      </>
                    )}
                  </PanelSection>
                )}

                {/* Traffic Information */}
                {!disabledDuringDrow && selectedRouteId && (
                  <PanelSection>
                    <SectionTitle><FaTrafficLight /> Traffic Analysis</SectionTitle>
                    <ActionButton
                      onClick={estimateTravelTime}
                      disabled={isLoadingTraffic}
                      primary
                    >
                      {isLoadingTraffic ? (
                        <>
                          <FaClock /> Calculating...
                        </>
                      ) : (
                        <>
                          <FaTrafficLight /> Get Estimate
                        </>
                      )}
                    </ActionButton>

                    {trafficInfo && (
                      <TrafficInfoCard>
                        <TrafficRow>
                          <TrafficLabel>Base Time:</TrafficLabel>
                          <TrafficValue>{trafficInfo.baseTime} mins</TrafficValue>
                        </TrafficRow>
                        <TrafficRow>
                          <TrafficLabel>With Traffic:</TrafficLabel>
                          <TrafficValue
                            danger={trafficInfo.congestion > 70}
                            warning={trafficInfo.congestion > 30 && trafficInfo.congestion <= 70}
                            success={trafficInfo.congestion <= 30}
                          >
                            {trafficInfo.adjustedTime} mins
                          </TrafficValue>
                        </TrafficRow>
                        <TrafficRow>
                          <TrafficLabel>Current Speed:</TrafficLabel>
                          <TrafficValue>{trafficInfo.currentSpeed} km/h</TrafficValue>
                        </TrafficRow>
                        <TrafficRow>
                          <TrafficLabel>Congestion:</TrafficLabel>
                          <TrafficValue
                            danger={trafficInfo.congestion > 70}
                            warning={trafficInfo.congestion > 30 && trafficInfo.congestion <= 70}
                            success={trafficInfo.congestion <= 30}
                          >
                            {trafficInfo.congestion}%
                          </TrafficValue>
                        </TrafficRow>
                        {trafficInfo.incidents?.length > 0 && (
                          <>
                            <TrafficRow style={{ marginTop: '8px' }}>
                              <TrafficLabel>Incidents:</TrafficLabel>
                              <TrafficValue>{trafficInfo.incidents.length}</TrafficValue>
                            </TrafficRow>
                          </>
                        )}
                      </TrafficInfoCard>
                    )}

                    {error && (
                      <ErrorMessage>
                        {error}
                      </ErrorMessage>
                    )}
                  </PanelSection>
                )}
              </ControlPanel>
            )}
            <ToggleButton onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
            </ToggleButton>
          </PanelContainer>
        </MapStyledContainer>
      </AppContainer>
    </>
  );
};

export default RouteMap;