// This is a minimal demo showing how to integrate Canvas into your app
import Canvas from "./components/Canvas/Canvas";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      {/* Canvas component is fully self-contained and manages its own state */}
      <Canvas />
    </main>
  );
}
