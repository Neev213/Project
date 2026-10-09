import CanvasRoot from "./three/CanvasRoot"
export default function App() {
  return (
    <>
      <CanvasRoot />
      <div className="relative z-10 p-6 text-white">
        <h1 className="text-2xl font-semibold">Weather App</h1>
      </div>
    </>
    
  )
}