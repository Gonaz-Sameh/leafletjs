// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RouteMap from "./RouteMap";
import DriverTrip from "./DriverTrip";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RouteMap />} />
        <Route path="/driver" element={<DriverTrip />} />
      </Routes>
    </Router>
  );
}
export default App;
