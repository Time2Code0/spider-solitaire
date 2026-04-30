"use client";

import { useEffect, useRef } from "react";

export function AsciiSignature() {
  const ref = useRef<boolean>(false);

  useEffect(() => {
    if (!ref.current) {
      console.log(`
$$$$$$$$\\ $$\\                          $$$$$$\\   $$$$$$\\                  $$\\
\\__$$  __|\\__|                        $$  __$$\\ $$  __$$\\                 $$ |
   $$ |   $$\\ $$$$$$\\$$$$\\   $$$$$$\\  \\__/  $$ |$$ /  \\__| $$$$$$\\   $$$$$$$ | $$$$$$\\
   $$ |   $$ |$$  _$$  _$$\\ $$  __$$\\  $$$$$$  |$$ |      $$  __$$\\ $$  __$$ |$$  __$$\\
   $$ |   $$ |$$ / $$ / $$ |$$$$$$$$ |$$  ____/ $$ |      $$ /  $$ |$$ /  $$ |$$$$$$$$ |
   $$ |   $$ |$$ | $$ | $$ |$$   ____|$$ |      $$ |  $$\\ $$ |  $$ |$$ |  $$ |$$   ____|
   $$ |   $$ |$$ | $$ | $$ |\\$$$$$$$\\ $$$$$$$$\\ \\$$$$$$  |\\$$$$$$  |\\$$$$$$$ |\\$$$$$$$\\
   \\__|   \\__|\\__| \\__| \\__| \\_______|\\________| \\______/  \\______/  \\_______| \\_______|


WEBSITE:    https://design-time2code.vercel.app
REPOSITORY: https://github.com/Time2Code0/spider-solitaire
      `);
      ref.current = true;
    }
  }, []);

  return null;
}
