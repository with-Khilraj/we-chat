import { Component } from "react";
import { AuthProvider } from "./context/AuthContext";
import { OnlineUsersProvider } from "./context/onlineUsersContext";

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <h1>Something went wrong.</h1>;
    return this.props.children;
  }
}

const App = () => (
  <AuthProvider>
    <OnlineUsersProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </OnlineUsersProvider>
  </AuthProvider>
);