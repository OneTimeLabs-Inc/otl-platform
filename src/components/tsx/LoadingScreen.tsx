import "../css/LoadingScreen.css";

type Props = {
  message?: string;
};

export default function LoadingScreen({
  message = "Loading...",
}: Props) {
  return (
    <main className="loading-screen">
      <div className="loading-card">
        <div className="loading-spinner" />

        <h2>OTLES</h2>

        <p>{message}</p>
      </div>
    </main>
  );
}