import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { actEntryRoute } from "../../lib/actRoutes";

const sidebarNav = [
  { id: "home", label: "Dashboard", icon: "\u229E", path: "/dashboard" },
  {
    id: "listen",
    label: "Immersion Protocol",
    icon: "\u266B",
    path: "/listen",
  },
];

const acts = [
  {
    num: "I",
    title: "Fractured Veil",
    element: "Earth",
    status: "In Progress",
    glyph: "\u2295",
    cls: "sa-i",
    colorVar: "--g3",
    path: actEntryRoute(1),
  },
  {
    num: "II",
    title: "Reflection Chamber",
    element: "Water",
    status: "Available",
    glyph: "\u224B",
    cls: "sa-ii",
    colorVar: "--b3",
    path: actEntryRoute(2),
  },
  {
    num: "III",
    title: "Reclamation",
    element: "Fire",
    status: "Locked",
    glyph: "\u25B3",
    cls: "sa-iii",
    colorVar: "--r3",
    path: actEntryRoute(3),
    locked: true,
  },
  {
    num: "IV",
    title: "Crucible Code",
    element: "Air",
    status: "Sealed",
    glyph: "\u2726",
    cls: "sa-iv",
    colorVar: "--y3",
    locked: true,
  },
];

const states = [
  { name: "Observer", level: 0 },
  { name: "Participant", level: 1 },
  { name: "Decoder", level: 2 },
  { name: "Architect", level: 3 },
];

const MOBILE_BP = 900;

const AppShell = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BP);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const currentLevel = user?.level ?? 1;
  const currentAct = user?.current_act || 1;
  const completedActs = user?.completed_acts?.length || 0;
  const act3Unlocked = user?.act3_unlocked || false;
  const userName = user?.name || user?.full_name || "Seeker";
  const userEmail = user?.email || "";
  const userTier = user?.tier || "free";
  const tierLabels = { free: "Free", license: "License", full: "Full Access" };
  const tierColors = {
    free: "var(--muted)",
    license: "var(--gold)",
    full: "var(--act)",
  };

  const nextStep = useMemo(() => {
    if (user?.is_admin) {
      return { label: "Continue Your Path", path: actEntryRoute(currentAct) };
    }

    if (currentAct === 3 && !act3Unlocked) {
      return { label: "Unlock Act III", path: "/acts" };
    }

    if (currentAct >= 4 && completedActs >= 4) {
      return { label: "Enter Sovereign Mode", path: "/self-directed-sovereign-mode" };
    }

    return {
      label: `Resume Act ${["I", "II", "III", "IV"][Math.max(0, Math.min(currentAct - 1, 3))]}`,
      path: actEntryRoute(currentAct),
    };
  }, [user?.is_admin, currentAct, completedActs, act3Unlocked]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleActClick = (act) => {
    if (act.num === "IV" && !user?.is_admin) {
      navigate("/acts");
      return;
    }
    if (act.num === "III" && !act3Unlocked && !user?.is_admin) {
      navigate("/acts");
      return;
    }
    if (act.path) {
      navigate(act.path);
      setSidebarOpen(false);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const getActStatus = (act) => {
    if (act.num === "IV") return "Sealed";
    if (act.num === "III") return act3Unlocked ? "Available" : "Locked";
    return act.status;
  };

  const isActLocked = (act) => {
    if (user?.is_admin) return false;
    if (act.num === "IV") return true;
    if (act.num === "III") return !act3Unlocked;
    return false;
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        data-testid="topbar"
        style={{
          minHeight: 56,
          background: "rgba(6,6,4,0.96)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          flexWrap: isMobile ? "wrap" : "nowrap",
          padding: "8px 16px",
          gap: 12,
          flexShrink: 0,
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        {isMobile && (
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            style={{
              border: "1px solid var(--border)",
              background: "var(--panel)",
              color: "var(--white)",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              padding: "6px 8px",
              cursor: "pointer",
            }}
          >
            ☰
          </button>
        )}

        <div
          onClick={() => handleNavigate("/dashboard")}
          className="cursor-pointer"
          style={{
            fontFamily: "'Oxanium',serif",
            fontSize: 12,
            letterSpacing: "0.2em",
            color: "var(--act)",
            whiteSpace: "nowrap",
          }}
        >
          Balanced Elementals
        </div>

        {!isMobile && (
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
        )}

        <div
          style={{
            flex: 1,
            minWidth: isMobile ? "100%" : 220,
            position: "relative",
            order: isMobile ? 3 : 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              fontSize: 13,
            }}
          >
            &#x2315;
          </span>
          <input
            data-testid="global-search"
            placeholder="Search coming soon"
            readOnly
            aria-disabled="true"
            title="Search is temporarily disabled while the indexed search experience is being implemented."
            style={{
              width: "100%",
              background: "var(--panel)",
              border: "1px solid var(--border)",
              padding: "8px 14px 8px 32px",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: "var(--muted)",
              letterSpacing: "0.08em",
              outline: "none",
              opacity: 0.85,
              cursor: "not-allowed",
            }}
          />
        </div>

        <button
          data-testid="cta-continue"
          onClick={() => handleNavigate(nextStep.path)}
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "8px 12px",
            border: "1px solid var(--act)",
            background: "transparent",
            color: "var(--act)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {nextStep.label}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "radial-gradient(circle,var(--fog),var(--void))",
              border: "1px solid var(--act)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "var(--act)",
            }}
          >
            {user?.picture ? (
              <img
                src={user.picture}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              "\u25C8"
            )}
          </div>
          {!isMobile && (
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
              }}
            >
              <div style={{ color: "var(--white)", letterSpacing: "0.1em" }}>
                {userName} // Level {String(currentLevel).padStart(2, "0")}
              </div>
              <div style={{ color: "var(--muted)", letterSpacing: "0.08em" }}>
                {states[Math.min(currentLevel, 3)]?.name || "Observer"}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            data-testid="logout-btn"
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: "0.12em",
            }}
          >
            EXIT
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isMobile && sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              border: "none",
              zIndex: 9,
            }}
          />
        )}

        <div
          data-testid="sidebar"
          style={{
            width: isMobile ? 280 : 210,
            maxWidth: "82vw",
            background: "var(--surface)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflowY: "auto",
            position: isMobile ? "absolute" : "relative",
            zIndex: 10,
            top: 0,
            bottom: 0,
            left: isMobile ? (sidebarOpen ? 0 : "-100%") : 0,
            transition: "left 0.2s ease",
          }}
        >
          <div
            style={{
              padding: "14px 14px 12px",
              borderBottom: "1px solid var(--border)",
              background: "rgba(90,176,56,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: "radial-gradient(circle,var(--fog),var(--void))",
                  border: `1.5px solid ${tierColors[userTier]}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: tierColors[userTier],
                  boxShadow: `0 0 8px ${userTier === "full" ? "rgba(90,176,56,0.25)" : userTier === "license" ? "rgba(200,160,32,0.2)" : "transparent"}`,
                }}
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "\u25C8"
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  data-testid="profile-name"
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 10,
                    color: "var(--white)",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {userName}
                </div>
                <div
                  data-testid="profile-email"
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    color: "var(--muted)",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {userEmail}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                data-testid="profile-tier"
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 8,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  border: `1px solid ${tierColors[userTier]}`,
                  color: tierColors[userTier],
                  background: `${tierColors[userTier]}10`,
                }}
              >
                {tierLabels[userTier]}
              </span>
              <span
                data-testid="profile-level"
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 8,
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                }}
              >
                Level {String(currentLevel).padStart(2, "0")} ·{" "}
                {states[Math.min(currentLevel, 3)]?.name || "Observer"}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "10px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--muted)",
                padding: "0 14px 6px",
                display: "block",
              }}
            >
              Your Path
            </span>
            {sidebarNav
              .filter((item) => !item.adminOnly || user?.is_admin)
              .map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.id === "home" && location.pathname === "/dashboard");
                return (
                  <div
                    key={item.id}
                    data-testid={`nav-${item.id}`}
                    onClick={() => handleNavigate(item.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "10px 14px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontSize: 13,
                      fontWeight: 500,
                      color: isActive ? "var(--act)" : "var(--muted)",
                      background: isActive ? "var(--panel)" : "transparent",
                      borderLeft: `2px solid ${isActive ? "var(--act)" : "transparent"}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        width: 16,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                );
              })}
          </div>

          <div
            style={{
              padding: "10px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--muted)",
                padding: "0 14px 6px",
                display: "block",
              }}
            >
              Protocol Acts
            </span>
            {acts.map((act) => {
              const locked = isActLocked(act);
              const isActive = location.pathname === act.path;
              return (
                <div
                  key={act.num}
                  onClick={() => handleActClick(act)}
                  style={{
                    padding: "10px 14px",
                    cursor: locked ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    opacity: locked ? 0.7 : 1,
                    borderLeft: `2px solid ${isActive ? "var(--act)" : "transparent"}`,
                    background: isActive ? "var(--panel)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{ fontSize: 11, color: `var(${act.colorVar})` }}
                    >
                      {act.glyph}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 8,
                        letterSpacing: "0.2em",
                        color: `var(${act.colorVar})`,
                      }}
                    >
                      Act {act.num}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Oxanium',serif",
                        fontSize: 11,
                        fontWeight: 600,
                        color: `var(${act.colorVar})`,
                      }}
                    >
                      {act.title}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 8,
                      letterSpacing: "0.08em",
                      color: "var(--muted)",
                      paddingLeft: 18,
                    }}
                  >
                    {act.element} · {getActStatus(act)}
                  </div>
                  {locked && (
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 8,
                        color: "var(--gold)",
                        letterSpacing: "0.08em",
                        paddingLeft: 18,
                        marginTop: 3,
                      }}
                    >
                      {act.num === "III"
                        ? "Complete Act II to unlock"
                        : "Act IV coming soon"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 8,
                display: "block",
              }}
            >
              Your State
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {states.map((s, i) => {
                const isCurrent = i === Math.min(currentLevel, 3);
                const isUnlocked = i < currentLevel;
                const isLocked = i > currentLevel;
                return (
                  <div
                    key={s.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 8px",
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      color: isCurrent ? "var(--act)" : "var(--muted)",
                      opacity: isLocked ? 0.4 : 1,
                      background: isCurrent
                        ? "rgba(90,176,56,0.06)"
                        : "transparent",
                      border: isCurrent
                        ? "1px solid var(--act-dim)"
                        : "1px solid transparent",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: isCurrent
                          ? "var(--act)"
                          : isUnlocked
                            ? "var(--muted)"
                            : "var(--border2)",
                        boxShadow: isCurrent
                          ? "0 0 6px rgba(90,176,56,0.5)"
                          : "none",
                      }}
                    />
                    {s.name}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              marginTop: "auto",
              borderTop: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 8,
                display: "block",
              }}
            >
              Protocol Progress
            </span>
            <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    background:
                      i <= completedActs
                        ? "var(--act)"
                        : i === currentAct
                          ? "linear-gradient(90deg,var(--act),var(--border))"
                          : "var(--border)",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 9,
                color: "var(--act)",
                letterSpacing: "0.1em",
              }}
            >
              Act {["I", "II", "III", "IV"][currentAct - 1]} · {completedActs}{" "}
              of 4
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            marginLeft: isMobile ? 0 : undefined,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              animation: "sIn 0.3s ease both",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
