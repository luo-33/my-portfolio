import React from "react";
import { Composition } from "remotion";
import { HeroAnimation, heroSchema } from "./HeroAnimation";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroAnimation"
        component={HeroAnimation}
        durationInFrames={360}
        fps={30}
        width={1280}
        height={720}
        schema={heroSchema}
        defaultProps={{
          accentColor: "#e8514d",
          baseDelay: 0,
        }}
      />
    </>
  );
};

export const Root = RemotionRoot;
