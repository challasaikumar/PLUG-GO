import { Button } from "./Button";
import { IconSupport } from "./icons";

type SupportEscalationCardProps = {
  stationId?: string;
  phone?: string;
  email?: string;
  hours?: string;
  reportHref?: string;
  className?: string;
};

export function SupportEscalationCard({
  stationId,
  phone,
  email,
  hours,
  reportHref = "/support",
  className,
}: SupportEscalationCardProps) {
  return (
    <aside className={["help-card", className].filter(Boolean).join(" ")}>
      <div className="help-card__head">
        <span className="help-card__icon" aria-hidden="true">
          <IconSupport />
        </span>
        <h2 className="help-card__title">{stationId ? "Need help at this station?" : "Need help?"}</h2>
      </div>
      {stationId ? <p className="help-card__id">Station ID {stationId}</p> : null}
      {!phone && !email ? (
        <p className="help-card__body">
          Support contacts are not published yet. Use the form to report a problem.
        </p>
      ) : (
        <p className="help-card__body">
          {phone ? (
            <a className="png-link" href={`tel:${phone}`}>
              {phone}
            </a>
          ) : null}
          {phone && email ? " · " : null}
          {email ? (
            <a className="png-link" href={`mailto:${email}`}>
              {email}
            </a>
          ) : null}
          {hours ? (
            <>
              <br />
              {hours}
            </>
          ) : null}
        </p>
      )}
      <Button href={reportHref} variant="outline" block>
        Report a problem
      </Button>
    </aside>
  );
}
