import React from "react";

export default function Home() {
  return (
    <div>
      <h1>This is the main home page...</h1>

      <a href="/login">
        <button type="submit">Login</button>
      </a>

      <a href="/signup">
        <button type="submit">Singup</button>
      </a>
    </div>
  );
}
