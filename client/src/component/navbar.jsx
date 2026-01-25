import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="logo">

      </div>

      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/features">Features</Link>
        </li>
      </ul>

      <div className="buttons">
        <Link to="/login">
          <button type="button" className="login">Login</button>
        </Link>

        <Link to="/signup">
          <button type="button" className="signup">Signup</button>
        </Link>
      </div>
    </div>
  )
};

export default Navbar;