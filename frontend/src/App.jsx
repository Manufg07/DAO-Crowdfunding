import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./Pages/Home";
import Market from "./Pages/Market";
import Docs from "./Pages/Docs";
import Navbar from "./Component/Navbar";
import Governance from "./Pages/Governance/App";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  
    const location = useLocation();
    
    const hideNavbarRoutes = ["/governance"];


    return (
      <div className="bg-black text-white w-screen h-screen">
        {!hideNavbarRoutes.some((route) =>
          location.pathname.startsWith(route)
        ) && <Navbar />}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/governance/*" element={<Governance />} />
          <Route path="/market" element={<Market />} />
          <Route path="/docs" element={<Docs />} />
        </Routes>
        <ToastContainer />
      </div>
    );
};

export default App;
