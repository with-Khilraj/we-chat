import React from "react";
import { Search } from "lucide-react";

const SidebarSearch = ({ search, onSearchChange }) => {
    return (
        <div className="search-container">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Search messages..."
                    className="search-input pl-10"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
        </div>
    );
};

export default SidebarSearch;
