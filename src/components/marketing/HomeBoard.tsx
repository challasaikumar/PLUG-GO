import { copy } from "@/content/copy";
import { JourneyLoop } from "./JourneyLoop";

export function HomeBoard() {
  const home = copy.home;
  return (
    <section className="home-board" aria-labelledby="how-heading">
      <div className="home-board__head">
        <p className="home-board__kicker">Find, arrive, then charge</p>
        <h2 id="how-heading" className="home-board__heading">
          {home.howTitle}
        </h2>
        <p className="home-board__lead">{home.howIntro}</p>
      </div>
      <JourneyLoop />
    </section>
  );
}
