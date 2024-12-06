import React from "react";

const Navbar = () => {
  return(
    <div className="navbar">
      <div className="logo">

      </div>

      <ul>
        <li>
          <a href="">Home</a>
        </li>
        <li>
          <a href="">About</a>
        </li>
        <li>
          <a href="">Features</a>
        </li>
      </ul>

      <div className="buttons">
        <a href="/login">
        <button type="submit" className="login">Login</button>
        </a>

        <a href="/signup">
        <button type="submit" className="signup">Signup</button>
        </a>
      </div>
    </div>
  )
};

export default Navbar;