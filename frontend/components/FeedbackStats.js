import Link from "next/link";
import { CalendarCheck, ShieldCheck, Star, UsersRound } from "lucide-react";
import { AnimatedCounter, HoverCard, Reveal, StaggerContainer, StaggerItem } from "./homepage/HomeMotion";

const stats = [
  { value: 4.8, decimals: 1, suffix: "/5", label: "Average Client Rating", icon: Star },
  { value: 50, suffix: "+", label: "Interviews Arranged", icon: CalendarCheck },
  { value: 40, suffix: "+", label: "Successful Placements", icon: ShieldCheck },
  { value: 92, suffix: "%", label: "Repeat Clients", icon: UsersRound },
];

export default function FeedbackStats() {
  return (
    <section className="fj-section fj-home-section--grid fj-feedback-stats" style={{ paddingTop: "20px", paddingBottom: "20px" }}>
      <div className="fj-container">
        {/* Stats count once on entry to keep the section lively without hurting performance. */}
        <StaggerContainer
          as="div"
          className="grid-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "40px" }}
        >
          {stats.map((stat) => (
            <StaggerItem as="div" key={stat.label}>
              <HoverCard
                className="fj-stat-card fj-stat-card--animated"
                style={{
                  background: "var(--surface)",
                  padding: "32px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--line)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                  height: "100%",
                }}
              >
                <div
                  className="fj-stat-icon"
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "var(--lime)",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <stat.icon size={28} color="#000" />
                </div>
                <strong className="fj-stat-value" style={{ fontSize: "2.5rem", fontWeight: "900", lineHeight: "1" }}>
                  <AnimatedCounter
                    value={stat.value}
                    decimals={stat.decimals || 0}
                    suffix={stat.suffix || ""}
                    className="fj-stat-counter"
                  />
                </strong>
                <span style={{ color: "var(--muted)", fontWeight: "600" }}>{stat.label}</span>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <Reveal as="div" direction="up" distance={28} duration={0.78}>
          <div style={{ marginTop: "72px" }}>
            <div
              className="feedback-banner"
              style={{
                background: "var(--surface-strong)",
                padding: "var(--banner-padding, 64px 80px)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--line)",
                boxShadow: "var(--soft-shadow)",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "32px",
                flexWrap: "wrap",
                minHeight: "220px",
              }}
            >
              <div style={{ flex: "1 1 450px", textAlign: "left" }}>
                <h3 style={{ fontSize: "2rem", marginBottom: "14px", fontWeight: "900", lineHeight: "1.2" }}>
                  How was our <span className="heading-mark">service?</span>
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "1.15rem", lineHeight: "1.7", margin: 0, maxWidth: "550px" }}>
                  Let us know how satisfied you are with 9Jobs&apos; hiring process. Your experience helps us fine-tune our recruitment and support services.
                </p>
                <p style={{ color: "var(--muted)", fontSize: "0.98rem", lineHeight: "1.7", margin: "14px 0 0", maxWidth: "560px" }}>
                  Had a recent hiring discussion with our team? You can also share client interview feedback to help us improve candidate coordination and follow-up.
                </p>
              </div>
              <div style={{ flexShrink: 0, width: "var(--btn-wrapper-width, auto)", display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
                <Link
                  href="/client-service-feedback"
                  className="fj-button fj-button--dark fj-button--shine"
                  style={{
                    display: "inline-flex",
                    whiteSpace: "var(--btn-whitespace, nowrap)",
                    padding: "16px 36px",
                    fontSize: "1rem",
                    fontWeight: "700",
                    border: "none",
                    width: "var(--btn-width, auto)",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  Share Service Experience
                </Link>
                <Link
                  href="/client-interview-feedback"
                  className="fj-button fj-button--ghost fj-button--shine"
                  style={{
                    display: "inline-flex",
                    whiteSpace: "var(--btn-whitespace, nowrap)",
                    padding: "16px 30px",
                    fontSize: "1rem",
                    fontWeight: "700",
                    width: "var(--btn-width, auto)",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  Client Interview Feedback
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
