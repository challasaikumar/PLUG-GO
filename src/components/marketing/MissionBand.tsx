import Image from "next/image";
import { marketingAssets } from "@/content/marketingAssets";

export function MissionBand({ title, body }: { title: string; body: string }) {
  return (
    <section className="mission-band" aria-labelledby="mission-heading">
      <Image
        className="mission-band__media"
        src={marketingAssets.missionBand}
        alt=""
        fill
        sizes="100vw"
        unoptimized
      />
      <div className="mission-band__inner">
        <h2 id="mission-heading" className="type-h2" style={{ margin: "0 0 12px" }}>
          {title}
        </h2>
        <p className="type-body-lg" style={{ margin: 0, maxWidth: "42rem" }}>
          {body}
        </p>
      </div>
    </section>
  );
}
