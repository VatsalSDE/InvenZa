import "./App.css";
import Adminroutes from "./routes/Adminroutes";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Adminroutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
