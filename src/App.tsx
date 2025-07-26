import "./App.css";
import { HandPoseDetection } from "./HandPoseDetection";
import { Scene } from "./Scene";

function App() {
  return (
    <>
      <HandPoseDetection />
      <Scene />
      <div className="masker">
        <div className="circle-1"></div>
        <div className="circle-2"></div>
      </div>
    </>
  );
}

export default App;
