import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="w-full h-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    <Link to="/" className="flex items-center">
                        <h1 className="text-xl font-bold hover:text-green-500 cursor-pointer">
                            DAO
                        </h1>
                    </Link>

                    <button
                        className="md:hidden text-[#00D395]"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>

                    <div
                        className={`absolute top-20 left-0 w-full bg-white shadow-md md:static md:w-auto md:flex md:space-x-8 md:shadow-none md:bg-transparent ${
                            isOpen ? "block" : "hidden"
                        }`}
                    >
                        <Link
                            to="/market"
                            className="block px-6 py-4 text-md font-semibold hover:text-[#00D395] transition-colors md:inline"
                        >
                            Markets
                        </Link>
                        <Link
                            to="/governance/"
                            className="block px-6 py-4 text-md font-semibold hover:text-[#00D395] transition-colors md:inline"
                        >
                            Governance
                        </Link>
                        <Link
                            to="/docs"
                            className="block px-6 py-4 text-md font-semibold hover:text-[#00D395] transition-colors md:inline"
                        >
                            Docs
                        </Link>
                    </div>

                    <button className="hidden md:block border-2 border-[#00D395] text-[#00D395] hover:text-white px-6 py-2 rounded-full hover:bg-green-500 transition-colors">
                        App
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;