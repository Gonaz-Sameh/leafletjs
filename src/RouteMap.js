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
import { FaLayerGroup, FaTrashAlt,FaArrowRight, FaCheck, FaBus, FaExpand, FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaRoute, FaTrash, FaSave, FaPlus, FaClock, FaTrafficLight } from 'react-icons/fa';
import simplify from 'simplify-js';
import * as turf from "@turf/turf";
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
  top: 20px;
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
    width: 200px;
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


const BusStatusCard = styled.div`
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  border-radius: 16px;
  padding: 24px;
  color: white;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', sans-serif;
  max-width: 400px;
  margin: 20px auto;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const StatusText = styled.strong`
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${props => props.$onRoute ? "#4cff8f" : "#ff6b6b"};
`;

const StationInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 15px;
  align-items: center;
`;

const StationCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 10px;
  text-align: center;
`;

const StationLabel = styled.p`
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  opacity: 0.8;
`;

const StationName = styled.p`
  margin: 0;
  font-weight: bold;
  font-size: 1.1rem;
`;

const RouteArrow = styled.div`
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  justify-content: center;
`;
// Socket connection here wrong becuse its effect by other components 
//const socket = io(process.env.REACT_APP_BACKEND_BASEURL);

// Custom icons
const createCustomIcon = (color, letter, iconSize, iconAnchorSize, strokeWidth = 2) => {
  // Special case for bus live icon
  if (letter === 'B' && color === 'green') {
    return new L.DivIcon({
      html: `
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <!-- Glow effect (outer circle with opacity) -->
          <circle cx="16" cy="16" r="11" fill="rgba(76, 175, 80, 0.3)" stroke="rgba(76, 175, 80, 0.5)" stroke-width="10"/>
          
          <!-- Main green circle -->
          <circle cx="16" cy="16" r="10" fill="#4CAF50" stroke="white" stroke-width="${strokeWidth}"/>
          
          <!-- Bus icon -->
          <g transform="translate(10,10) scale(0.5)">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-5H6V6h12v6z" 
                  fill="white"/>
          </g>
        </svg>
      `,
      className: "bus-live-icon",
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconAnchorSize, iconAnchorSize]
    });
  }

  // Default case for other icons
  return new L.DivIcon({
    html: `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="${strokeWidth}"/>
        <text x="11.5" y="16.5" font-size="12" text-anchor="middle" fill="white" font-weight="bold">${letter}</text>
      </svg>
    `,
    className: "",
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconAnchorSize, iconAnchorSize]
  });
};

// Usage remains the same
const routeStartIcon = createCustomIcon('#3388ff', 'S',21 , 11,0);
const routeEndIcon = createCustomIcon('#3388ff', 'E', 21, 11,0);
const tripStartIcon = createCustomIcon('green', 'S', 25, 12,3);
const tripEndIcon = createCustomIcon('green', 'E', 25, 12,3);
//
const   busLiveIcon= createCustomIcon('green', 'B', 44, 24, 4);
const  stationsIcon = createCustomIcon('black', 'S', 26, 12);
const busOfflineIcon = createCustomIcon('#95a5a6', 'N', 24, 12);
const RouteMap = () => {
  const socketRef = useRef(null);
  const currentTripRef = useRef({ routeId: null, tripId: null , selectedRouteDetails:null ,selectedRouteStations:null ,routeStationsSortedByItsLocation:null });
  const [onRouteStatus, setOnRouteStatus] = useState('');
  const [stationInfo, setStationInfo] = useState({
    prev: "",
    current: "",
    next: ""
  });
  const backend_baseurl = process.env.REACT_APP_BACKEND_BASEURL;
  const TOMTOM_API_KEY = 'H1acEMeFQr8cJsAOgL0nT1drv7lyA2Fe'; //mosco
  const LOCATIONIQ_API_KEY='pk.430e64a0289ab733e075ea2f460c45f8';//mosco
  const OPENROUTESERVICE_API_KEY ="5b3ce3597851110001cf62480f88fa10836b4c6990030f5767fb9d71"; //mosco   
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
    completedTrip: 'green',
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

  //gecode
  const [locationInput, setLocationInput] = useState('');
  const [geocodeCoordinates, setGeocodeCoordinates] = useState(null);
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [errorGeocode, setErrorGeocode] = useState(null);


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
    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${from.lat},${from.lng}:${to.lat},${to.lng}/json?key=${apiKey}`;
      
      const res = await axios.get(url);
      const data = res.data;
  
      if (data.routes?.[0]) {
        const summary = data.routes[0].summary;
        return {
          distance: summary.lengthInMeters,
          time: summary.travelTimeInSeconds
        };
      }
      return null;
    } catch (error) {
      console.error("TomTom API error:", error);
      return null;
    }
  };
  
  const findNearestStations = async (userLat, userLng, apiKey) => {
    try {
      // Step 1: Get all stations from backend
      const response = await axios.get(`${backend_baseurl}/api/v1/stations`);
      const stations = response.data;
  
      if (!stations.length) return [];
  
      // Step 2: Calculate haversine distance for all stations and sort them
      const stationsWithHaversine = stations.map(station => ({
        ...station,
        haversineDistance: haversineDistance(userLat, userLng, station.lat, station.lng)
      })).sort((a, b) => a.haversineDistance - b.haversineDistance);
  
      // Step 3: Take top 3 closest by haversine (or less if not enough stations)
      const topStations = stationsWithHaversine.slice(0, 3);
  
      // Step 4: Get accurate walking routes from TomTom for these top stations
      const stationsWithWalkingInfo = [];
      
      for (const station of topStations) {
        try {
          const walkingRoute = await getWalkingRoute(
            { lat: userLat, lng: userLng },
            { lat: station.lat, lng: station.lng },
            apiKey
          );
  
          if (walkingRoute) {
            stationsWithWalkingInfo.push({
              ...station,
              walkingDistance: walkingRoute.distance,
              walkingTime: walkingRoute.time,
              isAccurate: true
            });
          } else {
            // If TomTom fails for this station, fall back to haversine
            stationsWithWalkingInfo.push({
              ...station,
              walkingDistance: station.haversineDistance,
              walkingTime: Math.round((station.haversineDistance / 1.4) * 1.3), // Estimated walking time (1.4m/s with 30% buffer)
              isAccurate: false
            });
          }
        } catch (error) {
          console.error(`Error processing station ${station.name || station._id}:`, error);
          // Fall back to haversine if TomTom fails
          stationsWithWalkingInfo.push({
            ...station,
            walkingDistance: station.haversineDistance,
            walkingTime: Math.round((station.haversineDistance / 1.4) * 1.3),
            isAccurate: false
          });
        }
  
        await delay(1000); // Wait 1s between requests
      }
  
      // Step 5: Sort by walking time (ascending - shortest time first)
      const sortedStations = stationsWithWalkingInfo.sort((a, b) => a.walkingTime - b.walkingTime);
  
      return sortedStations;
  
    } catch (error) {
      console.error("Error in findNearestStations:", error);
      return [];
    }
  };
 /* useEffect(() => {
    const fetchNearestStations = async () => {
      try {
        const userLat = 30.047130119453023;
        const userLng = 31.383423483194452;
        
        const nearestStations = await findNearestStations(userLat, userLng, TOMTOM_API_KEY);
        
        console.log("Nearest stations:", nearestStations);
        
        // You can set this to your state here
        // setStations(nearestStations);
      } catch (error) {
        console.error("Error fetching nearest stations:", error);
      }
    };

    fetchNearestStations();
  }, []);*/


useEffect(() => {
  const prepareSortedStations = (route, stations) => {
    const routeCoords = route;
    const stationsCoords = stations || [];

    if (!routeCoords || stationsCoords.length === 0) return [];

    const routeLine = turf.lineString(
      routeCoords.map(coord => [coord[1], coord[0]]) // [lng, lat]
    );

    return stationsCoords
      .map(station => {
        const pt = turf.point([station.lng, station.lat]);
        const snapped = turf.nearestPointOnLine(routeLine, pt, { units: "meters" });
        return {
          ...station,
          distAlongRoute: snapped.properties.location,
        };
      })
      .sort((a, b) => a.distAlongRoute - b.distAlongRoute);
  };

  currentTripRef.current = {
    routeId: selectedRouteId, //selected route id
    tripId: selectedTripId , // trip id that happend on selected route
    selectedRouteDetails:route, //selected route coordinates , [The first element in selectedRouteDetails is treated as the start of the route,and end elemnt is last ]
    selectedRouteStations:stations, //selected route stations coordinates [ the order determines "start → end"]
    routeStationsSortedByItsLocation:prepareSortedStations(route,stations) // sorted by its added location on map, becuse when i'm get it its be sorted by its id or time and its not logic
 
  };
  console.log("Sorted Stations:", currentTripRef.current.routeStationsSortedByItsLocation);
}, [selectedRouteId, selectedTripId, route, stations]);

useEffect(() => {
  socketRef.current = io(process.env.REACT_APP_BACKEND_BASEURL);

  const TOLERANCE_METERS = 30;
  const STATION_TOLERANCE_METERS = 50;

  const handleBusUpdate = ({ tripId, routeId, busId, lat, lng }) => {
    const current = currentTripRef.current;
       //this not allowed becuse  selectedRouteId and  selectedTripId is still with deff values
       // if (routeId === selectedRouteId && tripId == selectedTripId) {
    if (routeId === current.routeId && tripId === current.tripId) {
      setBusPath([[lat, lng]]);

      try {
        const busPoint = turf.point([lng, lat]);
        const routeLine = turf.lineString(
          current.selectedRouteDetails.map(coord => [coord[1], coord[0]])
        );

        const distance = turf.pointToLineDistance(busPoint, routeLine, {
          units: "meters"
        });

        setOnRouteStatus(distance <= TOLERANCE_METERS ? "On Route ✅" : "Off Route ❌");
      } catch (e) {
        setOnRouteStatus(`error : ${e}`);
      }

      try {
        const stations = current.routeStationsSortedByItsLocation || [];
        const busPt = turf.point([lng, lat]);
        const routeLine = turf.lineString(
          current.selectedRouteDetails.map(coord => [coord[1], coord[0]])
        );

        // Project bus onto route to get its position along the route
        const snappedBus = turf.nearestPointOnLine(routeLine, busPt, { units: "meters" });
        const busPosition = snappedBus.properties.location;

        // Only consider stations ahead of the bus or very close behind
        const visibleStations = stations.filter(station => {
          return station.distAlongRoute >= busPosition ||
            Math.abs(station.distAlongRoute - busPosition) <= 0.001; // small tolerance
        });

        let currentIndex = -1;
        for (let i = 0; i < visibleStations.length; i++) {
          const station = visibleStations[i];
          const dist = haversineDistance(lat, lng, station.lat, station.lng);
          if (dist <= STATION_TOLERANCE_METERS) {
            currentIndex = i;
            break;
          }
        }

        if (currentIndex !== -1) {
          setStationInfo({
            prev: visibleStations[currentIndex - 1]?.name || "Not found",
            current: visibleStations[currentIndex].name,
            next: visibleStations[currentIndex + 1]?.name || "Not found"
          });
        } else {
          let foundBetween = false;
          for (let i = 0; i < visibleStations.length - 1; i++) {
            const s1 = visibleStations[i];
            const s2 = visibleStations[i + 1];
            const d1 = haversineDistance(lat, lng, s1.lat, s1.lng);
            const d2 = haversineDistance(lat, lng, s2.lat, s2.lng);
            const total = haversineDistance(s1.lat, s1.lng, s2.lat, s2.lng);

            if (d1 + d2 - total < STATION_TOLERANCE_METERS) {
              setStationInfo({
                prev: s1.name,
                current: "Between stations",
                next: s2.name
              });
              foundBetween = true;
              break;
            }
          }

          if (!foundBetween) {
            setStationInfo({
              prev: "Not found",
              current: "Not found",
              next: "Not found"
            });
          }
        }
      } catch (e) {
        setStationInfo({
          prev: "",
          current: "",
          next: ""
        });
      }
    }
  };

  socketRef.current.on("busLocationUpdate", handleBusUpdate);

  return () => {
    if (socketRef.current) {
      socketRef.current.off("busLocationUpdate", handleBusUpdate);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (currentTripRef.current) {
      currentTripRef.current = {
        routeId: null,
        tripId: null,
        selectedRouteDetails: null,
        selectedRouteStations: null,
        routeStationsSortedByItsLocation: null
      };
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
        showAlert('error', `Error loadingGeocode selected route : ${err}`)
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
   

    const simplifyPath = (path, tolerance = 0.0001, highQuality = false) => {
      // Convert to format simplify-js expects
      const points = path.map(p => ({x: p[1], y: p[0]})); // Note: lon,lat format
      
      // Simplify the points
      const simplified = simplify(points, tolerance, highQuality);
      
      // Convert back to Leaflet format
      return simplified.map(p => [p.y, p.x]);
    };
    const smoothPath = (path, iterations = 2) => {
      if (path.length < 3) return path;
      
      let smoothed = [...path];
      
      for (let i = 0; i < iterations; i++) {
        const newPath = [];
        
        // Add first point
        newPath.push(smoothed[0]);
        
        for (let j = 1; j < smoothed.length; j++) {
          const p0 = smoothed[j - 1];
          const p1 = smoothed[j];
          
          // Calculate 1/4 and 3/4 points between p0 and p1
          const q0 = [
            p0[0] * 0.75 + p1[0] * 0.25,
            p0[1] * 0.75 + p1[1] * 0.25
          ];
          
          const q1 = [
            p0[0] * 0.25 + p1[0] * 0.75,
            p0[1] * 0.25 + p1[1] * 0.75
          ];
          
          newPath.push(q0, q1);
        }
        
        // Add last point
        newPath.push(smoothed[smoothed.length - 1]);
        smoothed = newPath;
      }
      
      return smoothed;
    };
    const removeOutliers = (path, maxDistance = 0.01) => {
      if (path.length < 3) return path;
      
      const cleaned = [path[0]];
      
      for (let i = 1; i < path.length - 1; i++) {
        const prev = path[i - 1];
        const current = path[i];
        const next = path[i + 1];
        
        // Calculate distance between points
        const d1 = Math.sqrt(Math.pow(current[0] - prev[0], 2) + Math.pow(current[1] - prev[1], 2));
        const d2 = Math.sqrt(Math.pow(next[0] - current[0], 2) + Math.pow(next[1] - current[1], 2));
        
        if (d1 < maxDistance && d2 < maxDistance) {
          cleaned.push(current);
        }
      }
      
      cleaned.push(path[path.length - 1]);
      return cleaned;
    };
    let getSelectedTripDetails = async () => {
      try {
        const res = await axios.get(`${backend_baseurl}/api/v1/trips/${selectedTripId}`)
        let data = res.data
        // Convert trip coordinates to Leaflet format: [[lat, lng], ...]
        const path = data.coordinates.map((point) => [point.lat, point.lng]);
        
        console.log("path before : " , path);
        
        // simplifyPath(path, 0.0005);
        // smoothPath(path, 2);

        /*setTripPath(simplifyPath(path, 0.0005));
        console.log("path after : " , simplifyPath(path, 0.0005));*/
      
        //setTripPath(simplifyPath(path, 0.0005));
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
// State for tracking which service is being used
const [currentService, setCurrentService] = useState('LocationIQ');

const handleGeocode = async () => {
  if (!locationInput.trim()) {
    setErrorGeocode('Please enter a location');
    return;
  }

  setLoadingGeocode(true);
  setErrorGeocode(null);

  // Try LocationIQ first
  try {
    const response = await axios.get(
      `https://us1.locationiq.com/v1/search.php`,
      {
        params: {
          key: LOCATIONIQ_API_KEY,
          q: locationInput,
          format: 'json',
          limit: 1
        }
      }
    );

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      const newCoords = { latitude: lat, longitude: lon };
      setGeocodeCoordinates(newCoords);
      setCurrentService('LocationIQ');
      
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lon], 15);
      }
      setLoadingGeocode(false);
      return;
    }
  } catch (err) {
    console.log('LocationIQ geocoding failed, trying TomTom...');
  }

  // Fallback to TomTom if LocationIQ fails
  try {
    const response = await axios.get(
      `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(locationInput)}.json`,
      {
        params: {
          key: TOMTOM_API_KEY,
          limit: 1
        }
      }
    );

    if (response.data.results && response.data.results.length > 0) {
      const { lat, lon } = response.data.results[0].position;
      const newCoords = { latitude: lat, longitude: lon };
      setGeocodeCoordinates(newCoords);
      setCurrentService('TomTom');
      
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lon], 15);
      }
      setLoadingGeocode(false);
      return;
    }
  } catch (err) {
    console.log('TomTom geocoding failed, trying OpenRouteService...');
  }

  // Final fallback to OpenRouteService
  try {
    const response = await axios.get(
      `https://api.openrouteservice.org/geocode/search`,
      {
        params: {
          api_key: OPENROUTESERVICE_API_KEY,
          text: locationInput,
          size: 1
        },
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
        }
      }
    );

    if (response.data.features && response.data.features.length > 0) {
      const [lon, lat] = response.data.features[0].geometry.coordinates;
      const newCoords = { latitude: lat, longitude: lon };
      setGeocodeCoordinates(newCoords);
      setCurrentService('OpenRouteService');
      
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lon], 15);
      }
      setLoadingGeocode(false);
      return;
    }
  } catch (err) {
    console.error('All geocoding services failed:', err);
  }

  // If all services fail
  setErrorGeocode('Failed to geocode location (all services tried)');
  setGeocodeCoordinates(null);
  setLoadingGeocode(false);
};

const [suggestions, setSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);

const handleAutocomplete = async (query) => {
  if (!query.trim()) {
    setSuggestions([]);
    return;
  }

  // Try LocationIQ first
  try {
    const response = await axios.get(
      `https://us1.locationiq.com/v1/autocomplete.php`,
      {
        params: {
          key: LOCATIONIQ_API_KEY,
          q: query,
          format: 'json',
          limit: 5
        }
      }
    );

    setSuggestions(response.data || []);
    setShowSuggestions(true);
    setCurrentService('LocationIQ');
    return;
  } catch (err) {
    console.log('LocationIQ autocomplete failed, trying TomTom...');
  }

  // Fallback to TomTom
  try {
    const response = await axios.get(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json`,
      {
        params: {
          key: TOMTOM_API_KEY,
          limit: 5,
          typeahead: true
        }
      }
    );

    const tomtomSuggestions = response.data.results.map(result => ({
      display_name: result.address.freeformAddress,
      lat: result.position.lat,
      lon: result.position.lon
    }));

    setSuggestions(tomtomSuggestions);
    setShowSuggestions(true);
    setCurrentService('TomTom');
    return;
  } catch (err) {
    console.log('TomTom autocomplete failed, trying OpenRouteService...');
  }

  // Final fallback to OpenRouteService
  try {
    const response = await axios.get(
      `https://api.openrouteservice.org/geocode/autocomplete`,
      {
        params: {
          api_key: OPENROUTESERVICE_API_KEY,
          text: query,
          size: 5
        },
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
        }
      }
    );

    const orsSuggestions = response.data.features.map(feature => ({
      display_name: feature.properties.label,
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0]
    }));

    setSuggestions(orsSuggestions);
    setShowSuggestions(true);
    setCurrentService('OpenRouteService');
  } catch (err) {
    console.error('All autocomplete services failed:', err);
    setSuggestions([]);
  }
};

const [allRoutesStations, setAllRoutesStations] = useState([]);
const [nearestStation, setNearestStation] = useState(null);
const [currentNearestService, setCurrentNearestService] = useState('OpenRouteService');

// Fetch stations on component mount
useEffect(() => {
  const fetchStations = async () => {
    try {
      const response = await axios.get(`${backend_baseurl}/api/v1/stations`);
      setAllRoutesStations(response.data);
    } catch (err) {
      console.error('Failed to fetch stations:', err);
    }
  };
 fetchStations();
}, []);
// Utility function to calculate distance between two points in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
const findNearestStation = async (lat, lng) => {
  if (!allRoutesStations || allRoutesStations.length === 0) {
    throw new Error('No all Routes Stations available');
  }

  // First, find 3 nearest stations by straight-line distance
  const stationsWithDistance = allRoutesStations.map(station => ({
    station,
    distance: calculateDistance(lat, lng, station.lat, station.lng)
  })).sort((a, b) => a.distance - b.distance).slice(0, 3);

  let result = null;
  let serviceUsed = null;
  let routePolyline = null;

  // Try OpenRouteService first (best for walking)
  try {
    // First get the nearest station from matrix API
    const matrixResponse = await axios.post(
      `https://api.openrouteservice.org/v2/matrix/foot-walkingن`,
      {
        locations: [
          [lng, lat],
          ...stationsWithDistance.map(({ station }) => [station.lng, station.lat])
        ],
        metrics: ['distance', 'duration'],
        units: 'km'
      },
      {
        headers: {
          'Authorization': OPENROUTESERVICE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (matrixResponse.data.distances) {
      // Find nearest station index
      let minIndex = 0;
      for (let i = 1; i < stationsWithDistance.length; i++) {
        if (matrixResponse.data.distances[0][i+1] < matrixResponse.data.distances[0][minIndex+1]) {
          minIndex = i;
        }
      }

      // Now get the route polyline
      const directionsResponse = await axios.get(
        `https://api.openrouteservice.org/v2/directions/foot-walking`,
        {
          params: {
            api_key: OPENROUTESERVICE_API_KEY,
            start: `${lng},${lat}`,
            end: `${stationsWithDistance[minIndex].station.lng},${stationsWithDistance[minIndex].station.lat}`
          },
          headers: {
            'Accept': 'application/json, application/geo+json'
          }
        }
      );

      if (directionsResponse.data.features && directionsResponse.data.features.length > 0) {
        routePolyline = directionsResponse.data.features[0].geometry;
        result = {
          station: stationsWithDistance[minIndex].station,
          distance: matrixResponse.data.distances[0][minIndex+1],
          duration: matrixResponse.data.durations[0][minIndex+1],
          service: 'OpenRouteService',
          routePolyline
        };
        serviceUsed = 'OpenRouteService';
      }
    }
  } catch (err) {
    console.log('OpenRouteService failed, trying TomTom...', err);
  }

  // Fallback to TomTom if OpenRouteService fails
  if (!result) {
    try {
      for (const { station } of stationsWithDistance) {
        try {
          const response = await axios.get(
            `https://api.tomtom.com/routing/1/calculateRoute/${lat},${lng}:${station.lat},${station.lng}/json`,
            {
              params: {
                key: TOMTOM_API_KEY,
                travelMode: 'pedestrian',
                routeType: 'fastest',
                instructionsType: 'text'
              }
            }
          );

          if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            routePolyline = {
              type: "LineString",
              coordinates: route.legs[0].points.coordinates
            };
            
            result = {
              station,
              distance: route.summary.lengthInMeters / 1000,
              duration: route.summary.travelTimeInSeconds,
              service: 'TomTom',
              routePolyline
            };
            serviceUsed = 'TomTom';
            break;
          }
        } catch (err) {
          console.log(`TomTom failed for station ${station.name}`);
        }
      }
    } catch (err) {
      console.log('All TomTom attempts failed');
    }
  }

  // Final fallback - straight-line distance without polyline
  if (!result) {
    const nearest = stationsWithDistance[0];
    const estimatedDuration = nearest.distance / 5 * 3600;
    
    result = {
      station: nearest.station,
      distance: nearest.distance,
      duration: estimatedDuration,
      service: 'Straight-line distance (estimated)',
      isEstimated: true
    };
    serviceUsed = 'Straight-line distance (estimated)';
  }

  return {
    ...result,
    serviceUsed,
    isEstimated: result.service.includes('estimated') || result.service.includes('Straight-line')
  };
};
useEffect(() => {
  let getNearestStation = async()=>{
   // Now find nearest station with walking details
   try {
   /* const userLat = 30.047130119453023;
    const userLng = 31.383423483194452;*/ 
    //reaheb test 30.05312871805649, 31.50600299525917
    const nearestStationResult = await findNearestStation(30.05312871805649, 31.50600299525917);
    setNearestStation(nearestStationResult);
    setCurrentNearestService(`${nearestStationResult.serviceUsed}`);
    
  
  } catch (err) {
    showAlert('error', `Error finding nearest station ${err}`)
    console.error('Error finding nearest station:', err);
  }
}
  
geocodeCoordinates  && getNearestStation()
console.log("geocodeCoordinates : ",geocodeCoordinates);

}, [geocodeCoordinates]);
const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    }
  });
};
// In your component where you handle the map
// 1. Create the ref at the component level
const routeLayerRef = useRef(null);

// 2. When drawing a new route
useEffect(() => {
  if (nearestStation?.routePolyline && mapRef.current) {
    // Clear previous route if exists
    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
    }
    
    // Create new polyline layer and store reference
    routeLayerRef.current = L.geoJSON(nearestStation.routePolyline, {
      color: '#4285F4',
      weight: 4,
      opacity: 0.7
    }).addTo(mapRef.current);
  }

  // 3. Cleanup on component unmount
  return () => {
    if (routeLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
    }
  };
}, [nearestStation]);
  return (
    <>
      <AppContainer>
        <Header>
          <Logo src="/logo.png" alt="Company Logo" />
          <h6>*Our System Is Until Now Has More Than %80 accuracy* </h6>
        </Header>
        <div style={{ 
  margin: "10px 50px",
  position: 'relative'
}}>
  {nearestStation && (
  <div style={{
    marginTop: '15px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  }}>
    <h4 style={{ margin: '0 0 8px 0' }}>Nearest Station (Walking)</h4>
    <div><strong>Name:</strong> {nearestStation.station.name}</div>
    <div><strong>Distance:</strong> {nearestStation.distance.toFixed(2)} km</div>
    {nearestStation.duration && (
      <div>
        <strong>Walking Time:</strong> 
        {Math.floor(nearestStation.duration / 60)} minutes {nearestStation.duration % 60} seconds
      </div>
    )}
    <div>
      <strong>Location:</strong> 
      {nearestStation.station.lat.toFixed(6)}, {nearestStation.station.lng.toFixed(6)}
    </div>
    <div style={{ fontSize: '0.8em', color: '#666', marginTop: '8px' }}>
      Routing via: {nearestStation.serviceUsed}
    </div>
  </div>
)}
   {/*<button 
  onClick={async () => {
    try {
      const location = await getUserLocation();
      const nearestStationResult = await findNearestStation(location.lat,location.lng);
      setNearestStation(nearestStationResult);
      setCurrentNearestService(`${nearestStationResult.serviceUsed}`);
      
    } catch (error) {
      showAlert('error', `${error}`)
      console.error('Error:', error);
    }
   
  }}
  style={{
    padding: '10px 15px',
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '10px 0'
  }}
>
  <span>📍</span>
  Get My Location
</button>*/}
  {/* Service indicator */}
  <div style={{ 
    textAlign: 'center',
    fontSize: '0.8em',
    color: '#666',
    marginBottom: '5px'
  }}>
    Powered by: {currentService}
  </div>

  <div style={{ 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
border:"1px solid lightgray",
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderRadius: '8px',

  }}>
 
    <input
      type="text"
      value={locationInput}
      onChange={(e) => {
        setLocationInput(e.target.value);
        handleAutocomplete(e.target.value);
      }}
      placeholder="Search for Your Current location..."
      style={{ 
        flex: 1, 
        padding: '12px 16px',
        border: 'none',
        outline: 'none',
        fontSize: '16px'
      }}
      onKeyPress={(e) => e.key === 'Enter' && handleGeocode()}
      onFocus={() => setShowSuggestions(true)}
      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
    />
    <button 
      onClick={handleGeocode}
      disabled={loadingGeocode}
      style={{ 
        padding: '12px 20px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background 0.3s',
        ':hover': {
          background: '#45a049'
        }
      }}
    >
      {loadingGeocode ? 'Searching...' : 'Search'}
    </button>
  </div>

  {/* Autocomplete suggestions dropdown */}
  {showSuggestions && suggestions.length > 0 && (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 5px)',
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      maxHeight: '300px',
      overflowY: 'auto'
    }}>
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          style={{
            padding: '10px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid #eee',
            ':hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
          onClick={() => {
            setLocationInput(suggestion.display_name);
            setGeocodeCoordinates({
              latitude: suggestion.lat,
              longitude: suggestion.lon
            });
            setShowSuggestions(false);
            if (mapRef.current) {
              mapRef.current.flyTo([suggestion.lat, suggestion.lon], 15);
            }
          }}
        >
          {suggestion.display_name}
        </div>
      ))}
    </div>
  )}

  {errorGeocode && (
    <div style={{ 
      color: 'red', 
      fontSize: '0.9em',
      padding: '8px',
      textAlign: 'center'
    }}>
      {errorGeocode}
    </div>
  )}

<BusStatusCard>
      <StatusIndicator>
        <FaBus size={24} />
        <StatusText $onRoute={onRouteStatus === "On Route"}>
          {onRouteStatus}
        </StatusText>
      </StatusIndicator>

      <StationInfoGrid>
        <StationCard>
          <StationLabel><FaMapMarkerAlt /> Previous</StationLabel>
          <StationName>{stationInfo.prev}</StationName>
        </StationCard>

        <RouteArrow>
          <FaArrowRight size={20} />
        </RouteArrow>

        <StationCard>
          <StationLabel><FaMapMarkerAlt /> Current</StationLabel>
          <StationName>{stationInfo.current}</StationName>
        </StationCard>

        <RouteArrow>
          <FaArrowRight size={20} />
        </RouteArrow>

        <StationCard>
          <StationLabel><FaMapMarkerAlt /> Next</StationLabel>
          <StationName>{stationInfo.next}</StationName>
        </StationCard>
      </StationInfoGrid>
    </BusStatusCard>

</div>
        <MapStyledContainer>
      
          <MapContainer
            ref={mapRef}
            center={
              geocodeCoordinates && geocodeCoordinates.latitude  && geocodeCoordinates.longitude ?
              [geocodeCoordinates.latitude , geocodeCoordinates.longitude ]
               :[30.0444, 31.2357]}
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
            <>
            {/* Stroke/Outline (wider line underneath) */}
            <Polyline
              positions={tripPath}
              color="white" // Stroke color
              weight={8}    // Slightly wider than main line
              opacity={0.8}
              dashArray={selectedTripId ? undefined : "5, 5"}
              lineCap="round"
              lineJoin="round"
            />
            
            {/* Main colored line */}
            <Polyline
              positions={tripPath}
              color={colors.completedTrip}
              weight={5}    // Slightly narrower than stroke
              opacity={0.8}
              dashArray={selectedTripId ? undefined : "5, 5"}
              lineCap="round"
              lineJoin="round"
            />
          </>
            )}

            {/* Trip Start/End Markers */}
            {tripPath.length > 0 && (
              <>
                <Marker position={tripPath[0]} icon={tripStartIcon}>
                  <Popup>Trip Start Point</Popup>
                </Marker>
                <Marker position={tripPath[tripPath.length - 1]} icon={tripEndIcon}>
                  <Popup>Trip End Point</Popup>
                </Marker>
              </>
            )}

            {/* Planned Route */}
            {route.length > 1 &&  ( <>
               {/* Stroke/Outline (wider line underneath) */}
               <Polyline
              positions={route}
              color="white" // Stroke color
              weight={8}    // Slightly wider than main line
              opacity={0.8}
           
              lineCap="round"
              lineJoin="round"
            />
             {/* Main colored line */}
              <Polyline
                positions={route}
                color={trafficInfo ?
                  (trafficInfo.congestion < 30 ? '#4CAF50' :
                    trafficInfo.congestion < 70 ? '#FFC107' : '#F44336') :
                  colors.plannedRoute}
                weight={5}
                opacity={0.8}
                   lineCap="round"
              lineJoin="round"
              />
            
            </>
            )}

            {/* Route Start/End Markers */}
            {route.length > 0 && (
              <>
                <Marker position={route[0]} icon={routeStartIcon}>
                  <Popup>Route Start Point</Popup>
                </Marker>
                <Marker position={route[route.length - 1]} icon={routeEndIcon}>
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