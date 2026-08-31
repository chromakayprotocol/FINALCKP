import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { actEntryRoute } from "../lib/actRoutes";
import "./LaunchSequencePage.css";

const VIDEO_URL =
  "https://media.chromakeyprotocol.com/video/chroma_key_protocol_launch_sequence.mp4";

const TICKER_TEXT = "CHROMA KEY PROTOCOL   •   MUSIQ MATRIX MAINFRAME   •   ";

export default function LaunchSequencePage() {
  const navigate = useNavigate();
  const { actNumber } = useParams();
  const videoRef = useRef(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleEnded = () => {
      navigate(actEntryRoute(Number.parseInt(actNumber, 10) || 1));
    };

    vid.addEventListener("ended", handleEnded);

    // Attempt autoplay (may be blocked without muted on some browsers)
    vid.play().catch(() => {
      // If autoplay blocked, navigate anyway after 3s
      setTimeout(handleEnded, 3000);
    });

    return () => vid.removeEventListener("ended", handleEnded);
  }, [navigate, actNumber]);

  return (
    <div className="lseq-shell">
      {/* Neon frame borders */}
      <div className="lseq-frame">
        <div className="lseq-border lseq-border-top">
          <div className="lseq-ticker">
            {Array(8).fill(TICKER_TEXT).join("")}
          </div>
        </div>
        <div className="lseq-border lseq-border-bottom">
          <div className="lseq-ticker lseq-ticker-reverse">
            {Array(8).fill(TICKER_TEXT).join("")}
          </div>
        </div>
        <div className="lseq-border lseq-border-left">
          <div className="lseq-ticker lseq-ticker-vert">
            {Array(4).fill(TICKER_TEXT).join("")}
          </div>
        </div>
        <div className="lseq-border lseq-border-right">
          <div className="lseq-ticker lseq-ticker-vert lseq-ticker-reverse">
            {Array(4).fill(TICKER_TEXT).join("")}
          </div>
        </div>

        {/* Corner accents */}
        <div className="lseq-corner lseq-corner-tl" />
        <div className="lseq-corner lseq-corner-tr" />
        <div className="lseq-corner lseq-corner-bl" />
        <div className="lseq-corner lseq-corner-br" />
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        className="lseq-video"
        src={VIDEO_URL}
        autoPlay
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}
