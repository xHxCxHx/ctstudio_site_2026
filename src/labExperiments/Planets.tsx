// src/labExperiments/Planets.tsx
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type WheelEvent,
} from "react";
import * as THREE from "three";

const LAB_ASSET_MODULES = import.meta.glob("./assets/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23020510'/%3E%3Ccircle cx='600' cy='400' r='180' fill='%2315274a'/%3E%3Ctext x='600' y='420' text-anchor='middle' fill='%23ffffff' font-family='Arial' font-size='44'%3EAsset Missing%3C/text%3E%3C/svg%3E";

function getLabAsset(relativePath: string) {
  const cleanPath = relativePath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^assets\//, "");

  const exactKey = `./assets/${cleanPath}`;
  if (LAB_ASSET_MODULES[exactKey]) return LAB_ASSET_MODULES[exactKey];

  const lowerCleanPath = cleanPath.toLowerCase();
  const foundKey = Object.keys(LAB_ASSET_MODULES).find((key) =>
    key.toLowerCase().endsWith(lowerCleanPath)
  );

  return foundKey ? LAB_ASSET_MODULES[foundKey] : PLACEHOLDER_IMAGE;
}

/* ───────── تنظیمات ───────── */
const TWEAKS = {
  dprMax: 1.75,

  camFov: 40,
  camNear: 0.1,
  camFar: 100,
  camZ: 18,

  cols: 5,
  rowYGap: 6.0,
  colXGap: 3.9,

  ambientIntensity: 1.5,
  keyLightIntensity: 2.4,
  rimLightIntensity: 3.6,

  // ردیف پایین: گروه زحل/اورانوس/نپتون/پلوتو (سه‌بعدی و اوورلی)
  bottomPlanetGroupOffsetX: 0.0, // [3D] شِفت این چهار سیاره روی X
  bottomPlanetOverlayOffsetXPercent: 0, // [Overlay] شِفت متن همین‌ها روی X (درصد)

  // خورشید: مستقل
  sunRadius: 9.5,
  sunOffsetX: 10.5, // [3D] گوشه‌ی خورشید داخل کادر
  sunOverlayOffsetXPercent: 0, // [Overlay] شِفت متن خورشید

  texMercury: getLabAsset("textures/solar_texture/MERCURY_texture.jpg"),
  texVenus: getLabAsset("textures/solar_texture/Venus.jpg"),
  texEarth: getLabAsset("textures/earth_texture/cloudy_earth.jpg"),
  texMars: getLabAsset("textures/solar_texture/2k_mars.jpg"),
  texJupiter: getLabAsset("textures/solar_texture/2k_jupiter.jpg"),
  texSaturn: getLabAsset("textures/solar_texture/2k_saturn.jpg"),
  texUranus: getLabAsset("textures/solar_texture/2k_uranus.jpg"),
  texNeptune: getLabAsset("textures/solar_texture/2k_neptune.jpg"),
  texPluto: getLabAsset("textures/solar_texture/PlutoColour.jpg"),
  texSun: getLabAsset("textures/solar_texture/2k_sun.jpg"),

  /* —— تنظیمات پنل متن (برای هم‌خوانی با بقیه صفحات) —— */
  headingFontSize: 34, // ← سایز تیتر بزرگ (TITLE) – اگر درشت است این را کم کن
  subheadingFontSize: 18, // ← سایز زیرتیتر "Introduction"
  introFontSize: 22, // ← سایز متن مقدمه بالای تصویر
  bodyFontSize: 20, // ← سایز متن بدنه‌ی طولانی
  textMaxWidth: 560, // ← حداکثر عرض باکس متن در پنل راست (برای پر کردن فضای خالی، این را زیاد/کم کن)
  imageBoxHeight: 320, // ← ارتفاع ثابت باکس تصویر (همه منوها یکسان شود)
};

/* ───────── دیتا ───────── */
type PlanetKey =
  | "Mercury"
  | "Venus"
  | "Earth"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto"
  | "Sun";

type PlanetDef = {
  key: PlanetKey;
  label: string;
  texture: string;
  radius: number;
  tiltDeg: number;
  dayHours: number;
  yearDays: number;
};

const PLANETS: PlanetDef[] = [
  {
    key: "Mercury",
    label: "MERCURY",
    texture: TWEAKS.texMercury,
    radius: 0.7,
    tiltDeg: 0.034,
    dayHours: 1407,
    yearDays: 88,
  },
  {
    key: "Venus",
    label: "VENUS",
    texture: TWEAKS.texVenus,
    radius: 0.95,
    tiltDeg: 177.3,
    dayHours: 5832,
    yearDays: 224.7,
  },
  {
    key: "Earth",
    label: "EARTH",
    texture: TWEAKS.texEarth,
    radius: 1.0,
    tiltDeg: 23.26,
    dayHours: 23.9,
    yearDays: 365.2,
  },
  {
    key: "Mars",
    label: "MARS",
    texture: TWEAKS.texMars,
    radius: 0.85,
    tiltDeg: 25.2,
    dayHours: 24.6,
    yearDays: 687,
  },
  {
    key: "Jupiter",
    label: "JUPITER",
    texture: TWEAKS.texJupiter,
    radius: 1.6,
    tiltDeg: 3.1,
    dayHours: 9.9,
    yearDays: 4331,
  },
  {
    key: "Saturn",
    label: "SATURN",
    texture: TWEAKS.texSaturn,
    radius: 1.5,
    tiltDeg: 26.7,
    dayHours: 10.7,
    yearDays: 10747,
  },
  {
    key: "Uranus",
    label: "URANUS",
    texture: TWEAKS.texUranus,
    radius: 1.1,
    tiltDeg: 97.8,
    dayHours: 17.2,
    yearDays: 30589,
  },
  {
    key: "Neptune",
    label: "NEPTUNE",
    texture: TWEAKS.texNeptune,
    radius: 1.1,
    tiltDeg: 28.3,
    dayHours: 16.1,
    yearDays: 59800,
  },
  {
    key: "Pluto",
    label: "PLUTO",
    texture: TWEAKS.texPluto,
    radius: 0.8,
    tiltDeg: 122.5,
    dayHours: 153.3,
    yearDays: 90560,
  },
  {
    key: "Sun",
    label: "SUN",
    texture: TWEAKS.texSun,
    radius: TWEAKS.sunRadius,
    tiltDeg: 0,
    dayHours: 600,
    yearDays: 0,
  },
];

const PLANET_ARROW: Record<PlanetKey, string> = {
  Mercury: "→",
  Venus: "←",
  Earth: "↘",
  Mars: "↘",
  Jupiter: "→",
  Saturn: "↘",
  Uranus: "↓",
  Neptune: "↘",
  Pluto: "↙",
  Sun: "→",
};

type PlanetContent = {
  title: string;
  intro: string;
  bodyHtml: string;
  imageSrc: string;
};

const PLANET_CONTENT: Record<PlanetKey, PlanetContent> = {
  Mercury: {
    title: "MERCURY",
    intro:
      "Gray planet Mercury with craters and rays of material ejected by impactors like asteroids. Mercury's crater Debussy can be seen toward the bottom of this image from NASA's MESSENGER spacecraft.\n\nMercury's surface temperatures are both extremely hot and cold. Because the planet is so close to the Sun, day temperatures can reach highs of 800°F (430°C). Without an atmosphere to retain that heat at night, temperatures can dip as low as -290°F (-180°C).\n\nDespite its proximity to the Sun, Mercury is not the hottest planet in our solar system – that title belongs to nearby Venus, thanks to its dense atmosphere. But Mercury is the fastest planet, zipping around the Sun every 88 Earth days.",
    bodyHtml: `
<strong>Namesake</strong><br/>
Mercury is appropriately named for the swiftest of the ancient Roman gods.<br/><br/>

<strong>Potential for Life</strong><br/>
Mercury's environment is not conducive to life as we know it. The temperatures and solar radiation that characterize this planet are most likely too extreme for organisms to adapt to.<br/><br/>

<strong>Size and Distance</strong><br/>
With a radius of 1,516 miles (2,440 kilometers), Mercury is a little more than 1/3 the width of Earth. If Earth were the size of a nickel, Mercury would be about as big as a blueberry.<br/><br/>
From an average distance of 36 million miles (58 million kilometers), Mercury is 0.4 astronomical units away from the Sun. One astronomical unit (abbreviated as AU), is the distance from the Sun to Earth. From this distance, it takes sunlight 3.2 minutes to travel from the Sun to Mercury.<br/><br/>

<strong>Orbit and Rotation</strong><br/>
Mercury's highly eccentric, egg-shaped orbit takes the planet as close as 29 million miles (47 million kilometers) and as far as 43 million miles (70 million kilometers) from the Sun. It speeds around the Sun every 88 days, traveling through space at nearly 29 miles (47 kilometers) per second, faster than any other planet.<br/><br/>
Mercury spins slowly on its axis and completes one rotation every 59 Earth days. But when Mercury is moving fastest in its elliptical orbit around the Sun (and it is closest to the Sun), each rotation is not accompanied by sunrise and sunset like it is on most other planets. The morning Sun appears to rise briefly, set, and rise again from some parts of the planet's surface. The same thing happens in reverse at sunset for other parts of the surface. One Mercury solar day (one full day-night cycle) equals 176 Earth days – just over two years on Mercury.<br/><br/>
Mercury's axis of rotation is tilted just 2 degrees with respect to the plane of its orbit around the Sun. That means it spins nearly perfectly upright and so does not experience seasons as many other planets do.<br/><br/>

<strong>Moons</strong><br/>
Mercury doesn't have moons.<br/><br/>

<strong>Rings</strong><br/>
Mercury doesn't have rings.<br/><br/>

<strong>Formation</strong><br/>
Mercury formed about 4.5 billion years ago when gravity pulled swirling gas and dust together to form this small planet nearest the Sun. Like its fellow terrestrial planets, Mercury has a central core, a rocky mantle, and a solid crust.<br/><br/>

<strong>Structure</strong><br/>
Mercury is the second densest planet, after Earth. It has a large metallic core with a radius of about 1,289 miles (2,074 kilometers), about 85% of the planet's radius. There is evidence that it is partly molten or liquid. Mercury's outer shell, comparable to Earth's outer shell (called the mantle and crust), is only about 400 kilometers (250 miles) thick.<br/><br/>

<strong>Surface</strong><br/>
Mercury's surface resembles that of Earth's Moon, scarred by many impact craters resulting from collisions with meteoroids and comets. Craters and features on Mercury are named after famous deceased artists, musicians, or authors, including children's author Dr. Seuss and dance pioneer Alvin Ailey.<br/><br/>
Very large impact basins, including Caloris (960 miles or 1,550 kilometers in diameter) and Rachmaninoff (190 miles, or 306 kilometers in diameter), were created by asteroid impacts on the planet's surface early in the solar system's history. While there are large areas of smooth terrain, there are also cliffs, some hundreds of miles long and soaring up to a mile high. They rose as the planet's interior cooled and contracted over the billions of years since Mercury formed.<br/><br/>
Most of Mercury's surface would appear greyish-brown to the human eye. The bright streaks are called "crater rays." They are formed when an asteroid or comet strikes the surface. The tremendous amount of energy that is released in such an impact digs a big hole in the ground, and also crushes a huge amount of rock under the point of impact. Some of this crushed material is thrown far from the crater and then falls to the surface, forming the rays. Fine particles of crushed rock are more reflective than large pieces, so the rays look brighter. The space environment – dust impacts and solar-wind particles – causes the rays to darken with time.<br/><br/>
Temperatures on Mercury are extreme. During the day, temperatures on the surface can reach 800 degrees Fahrenheit (430 degrees Celsius). Because the planet has no atmosphere to retain that heat, nighttime temperatures on the surface can drop to minus 290 degrees Fahrenheit (minus 180 degrees Celsius).<br/><br/>
Mercury may have water ice at its north and south poles inside deep craters, but only in regions in permanent shadows. In those shadows, it could be cold enough to preserve water ice despite the high temperatures on sunlit parts of the planet.<br/><br/>

<strong>Atmosphere</strong><br/>
Instead of an atmosphere, Mercury possesses a thin exosphere made up of atoms blasted off the surface by the solar wind and striking meteoroids. Mercury's exosphere is composed mostly of oxygen, sodium, hydrogen, helium, and potassium.<br/><br/>

<strong>Magnetosphere</strong><br/>
Mercury's magnetic field is offset relative to the planet's equator. Though Mercury's magnetic field at the surface has just 1% the strength of Earth's, it interacts with the magnetic field of the solar wind to sometimes create intense magnetic tornadoes that funnel the fast, hot solar wind plasma down to the surface of the planet. When the ions strike the surface, they knock off neutrally charged atoms and send them on a loop high into the sky.
    `,
    imageSrc: getLabAsset("pictures/solar_pictures/Mercury.jpg"),
  },

  Venus: {
    title: "VENUS",
    intro:
      "Venus is the second planet from the Sun, and Earth's closest planetary neighbor. Venus is the third brightest object in the sky after the Sun and Moon. Venus spins slowly in the opposite direction from most planets.\n\nVenus is similar in structure and size to Earth, and is sometimes called Earth's evil twin. Its thick atmosphere traps heat in a runaway greenhouse effect, making it the hottest planet in our solar system with surface temperatures hot enough to melt lead. Below the dense, persistent clouds, the surface has volcanoes and deformed mountains.",
    bodyHtml: `
<strong>Namesake</strong><br/>
The ancient Romans could easily see seven bright objects in the sky: the Sun, the Moon, and the five brightest planets: Mercury, Venus, Mars, Jupiter, and Saturn. They named the objects after their most important gods.<br/><br/>
Venus is named for the ancient Roman goddess of love and beauty, who was known as Aphrodite to the ancient Greeks. Most features on Venus are named for women. It’s the only planet named after a female god.<br/><br/>

<strong>Potential for Life</strong><br/>
Thirty miles up (about 50 kilometers) from the surface of Venus temperatures range from 86 to 158 Fahrenheit (30 to 70 Celsius). This temperature range could accommodate Earthly life, such as “extremophile” microbes. And atmospheric pressure at that height is similar to what we find on Earth’s surface.<br/><br/>
At the tops of Venus’ clouds, whipped around the planet by winds measured as high as 224 mph (360 kph), we find another transformation. Persistent, dark streaks appear. Scientists are so far unable to explain why these streaks remain stubbornly intact, even amid hurricane-force winds. They also have the odd habit of absorbing ultraviolet radiation.<br/><br/>
The most likely explanations focus on fine particles, ice crystals, or even a chemical compound called iron chloride. Although it's much less likely, another possibility considered by scientists who study astrobiology is that these streaks could be made up of microbial life, Venus-style. Astrobiologists note that ring-shaped linkages of sulfur atoms, known to exist in Venus’ atmosphere, could provide microbes with a kind of coating that would protect them from sulfuric acid. These handy chemical cloaks would also absorb potentially damaging ultraviolet light and re-radiate it as visible light.<br/><br/>
Some of the Russian Venera probes did, indeed, detect particles in Venus’ lower atmosphere about a micron in length – roughly the same size as a bacterium on Earth.<br/><br/>
None of these findings provide compelling evidence for the existence of life in Venus’ clouds. But the questions they raise, along with Venus’ vanished ocean, its violently volcanic surface, and its hellish history, make a compelling case for missions to investigate our temperamental sister planet. There is much, it would seem, that she can teach us.<br/><br/>

<strong>Size and Distance</strong><br/>
Venus orbits the Sun from an average distance of 67 million miles (108 million kilometers), or 0.72 astronomical units. One astronomical unit (abbreviated as AU), is the distance from the Sun to Earth. From this distance, it takes sunlight about six minutes to travel from the Sun to Venus.<br/><br/>
Earth's nearness to Venus is a matter of perspective. The planet is nearly as big around as Earth. Its diameter at its equator is about 7,521 miles (12,104 kilometers), versus 7,926 miles (12,756 kilometers) for Earth. From Earth, Venus is the brightest object in the night sky after our own Moon. The ancients, therefore, gave it great importance in their cultures, even thinking it was two objects: a morning star and an evening star. That’s where the trick of perspective comes in.<br/><br/>
Because Venus’ orbit is closer to the Sun than ours, the two of them – from our viewpoint – never stray far from each other. The ancient Egyptians and Greeks saw Venus in two guises: first in one orbital position (seen in the morning), then another (your “evening” Venus), just at different times of the year.<br/><br/>
At its nearest to Earth, Venus is about 24 million (about 38 million kilometers) away. But most of the time the two planets are farther apart. The maximum distance between Venus and Earth is about 162 million miles (261 million kilometers). Mercury, the innermost planet, actually spends more time in Earth’s proximity than Venus.<br/><br/>
One more trick of perspective: how Venus looks through binoculars or a telescope. Keep watch over many months, and you’ll notice that Venus has phases, just like our Moon – full, half, quarter, etc. The complete cycle, however, new to full, takes 584 days, while our Moon takes just a month. And it was this perspective, the phases of Venus first observed by Galileo through his telescope, that provided the key scientific proof for the Copernican heliocentric nature of the solar system.<br/><br/>

<strong>Orbit and Rotation</strong><br/>
Spending a day on Venus would be quite a disorienting experience – that is, if your spacecraft or spacesuit could protect you from temperatures in the range of 900 degrees Fahrenheit (475 Celsius). For one thing, your “day” would be 243 Earth days long – longer even than a Venus year (one trip around the Sun), which takes only 225 Earth days. For another, because of the planet's extremely slow rotation, sunrise to sunset would take 117 Earth days. And by the way, the Sun would rise in the west and set in the east, because Venus spins backward compared to Earth.<br/><br/>
While you’re waiting, don’t expect any seasonal relief from the unrelenting temperatures. On Earth, with its spin axis tilted by about 23 degrees, we experience summer when our part of the planet (our hemisphere) receives the Sun’s rays more directly – a result of that tilt. In winter, the tilt means the rays are less direct. No such luck on Venus: Its very slight tilt is only three degrees, which is too little to produce noticeable seasons.<br/><br/>

<strong>Moons</strong><br/>
Venus is one of only two planets in our solar system that doesn't have a moon, but it does have a quasi-satellite that has officially been named Zoozve. This object was discovered on Nov. 11, 2002, by Brian Skiff at the Lowell Observatory Near-Earth-Object Search (LONEOS) in Flagstaff, Arizona, a project funded by NASA that ended in February 2008.<br/><br/>
Quasi-satellites, sometimes called quasi-moons, are asteroids that orbit the Sun while staying close to a planet. A quasi-satellite’s orbit usually is more oblong and less stable than the planet's orbit. In time, the shape of a quasi-satellite’s orbit may change and it may move away from the planet.<br/><br/>
According to the International Astronomical Union (IAU), the organization that names space objects, Zoozve is the first-identified quasi-satellite of a major planet. Earth also has quasi-satellites, including a small asteroid discovered in 2016.<br/><br/>
Based on its brightness, scientists at NASA’s Jet Propulsion Laboratory (JPL) estimate Zoozve ranges in size from 660 feet (200 meters) to 1,640 feet (500 meters) across.<br/><br/>
Interestingly, Zoozve also orbits relatively close to Earth but does not pose a threat to our planet. For the next 175 years, the closest Zoozve will get to Earth is in the year 2149 when it will be about 2.2 million miles (3.5 million kilometers) away, or about 9 times the distance from Earth to the Moon.<br/><br/>
After the discovery in 2002, Skiff reported his finding to the Minor Planet Center. At that time, it was given the provisional name 2002 VE68. Skiff said he didn’t realize the asteroid’s importance and forgot about the object until a radio show host reached out to him in 2023 about naming it Zoozve.<br/><br/>
Soon after Skiff’s discovery, a team of astronomers determined that the object was the first of its kind to be discovered. They think that Zoozve may have been a companion to Venus for at least 7,000 years, and that Earth’s gravity helped push Zoozve into its present orbit. The name Zoozve comes from a child's poster of the solar system and a misreading of “2002 VE” as “Zoozve.”<br/><br/>

<strong>Rings</strong><br/>
Venus has no rings.<br/><br/>

<strong>Formation</strong><br/>
The close similarities of early Venus and Earth, and their very different fates, provide a kind of test case for scientists who study planet formation. Similar size, similar interior structure, both harboring oceans in their younger days. Yet one is now an inferno, while the other is the only known world to host abundant life. The factors that set these planets on almost opposite paths began, most likely, in the swirling disk of gas and dust from which they were born, 4.6 billion years ago.<br/><br/>

<strong>Structure</strong><br/>
If we could slice Venus and Earth in half, pole to pole, and place them side by side, they would look remarkably similar. Each planet has an iron core enveloped by a hot-rock mantle; the thinnest of skins forms a rocky, exterior crust. On both planets, this thin skin changes form and sometimes erupts into volcanoes in response to the ebb and flow of heat and pressure deep beneath.<br/><br/>
On Earth, the slow movement of continents over thousands and millions of years reshapes the surface, a process known as “plate tectonics.” Something similar might have happened on Venus early in its history. Today a key element of this process could be operating: subduction, or the sliding of one continental “plate” beneath another, which can also trigger volcanoes.<br/><br/>

<strong>Surface</strong><br/>
Photos snapped by Soviet Venera landers show a barren, dim, and rocky landscape, and a sky that is likely some shade of sulfur yellow. Volcanoes and tectonic forces appear to have erased most traces of the early surface of Venus. The average age of surface features could be as young as 150 million years. Venus has valleys and high mountains dotted with thousands of volcanoes, pancake domes, tick domes, tesserae terrains, and large highland areas such as Ishtar Terra and Aphrodite Terra.<br/><br/>

<strong>Atmosphere</strong><br/>
Venus’ atmosphere is one of extremes. With the hottest surface in the solar system, apart from the Sun itself, Venus is hotter even than Mercury. The atmosphere is mostly carbon dioxide with clouds composed of sulfuric acid. At the surface, the hot, high-pressure carbon dioxide behaves in a corrosive fashion. Higher up in the atmosphere, temperatures and pressure begin to ease.<br/><br/>

<strong>Magnetosphere</strong><br/>
Even though Venus is similar in size to Earth and has a similar-sized iron core, the planet does not have its own internally generated magnetic field. Instead, Venus has an induced magnetic field created by the interaction of the Sun's magnetic field and the planet's outer atmosphere. This induced magnetic field envelops the planet and is shaped like an extended teardrop, or the tail of a comet, as the solar wind blows past Venus and outward into the solar system.
    `,
    imageSrc: getLabAsset("pictures/solar_pictures/Venus.jpeg"),
  },

  Earth: {
    title: "EARTH",
    intro:
      "While Earth is only the fifth largest planet in the solar system, it is the only planet in our solar system with liquid water on the surface. Just slightly larger than nearby Venus, Earth is the biggest of the four planets closest to the Sun, all of which are made of rock and metal.\n\nEarth is the only planet in the solar system whose English name does not come from Greek or Roman mythology. The name was taken from Old English and Germanic. It simply means \"the ground.\" There are, of course, many names for our planet in the thousands of languages spoken by the people of the third planet from the Sun.",
    bodyHtml: `
<strong>Namesake</strong><br/>
The name Earth is about 1,000 years old. All of the planets, except for Earth, were named after Greek and Roman gods and goddesses. However, the name Earth is a Germanic word, which simply means “the ground.”<br/><br/>

<strong>Potential for Life</strong><br/>
Earth has a very hospitable temperature and mix of chemicals that have made life abundant here. Most notably, Earth is unique in that most of our planet is covered in liquid water, since the temperature allows liquid water to exist for extended periods of time. Earth's vast oceans provided a convenient place for life to begin about 3.8 billion years ago.<br/><br/>
Some of the features of our planet that make it great for sustaining life are changing due to the ongoing effects of climate change.<br/><br/>

<strong>Size and Distance</strong><br/>
With an equatorial diameter of 7,926 miles (12,756 kilometers), Earth is the biggest of the terrestrial planets and the fifth largest planet in our solar system.<br/><br/>
From an average distance of 93 million miles (150 million kilometers), Earth is exactly one astronomical unit away from the Sun because one astronomical unit (abbreviated as AU) is the distance from the Sun to Earth. This unit provides an easy way to quickly compare planets' distances from the Sun.<br/><br/>
It takes about eight minutes for light from the Sun to reach our planet.<br/><br/>

<strong>Orbit and Rotation</strong><br/>
As Earth orbits the Sun, it completes one rotation every 23.9 hours. It takes 365.25 days to complete one trip around the Sun. That extra quarter of a day presents a challenge to our calendar system, which counts one year as 365 days. To keep our yearly calendars consistent with our orbit around the Sun, every four years we add one day. That day is called a leap day, and the year it's added to is called a leap year.<br/><br/>
Earth's axis of rotation is tilted 23.4 degrees with respect to the plane of Earth's orbit around the Sun. This tilt causes our yearly cycle of seasons. During part of the year, the northern hemisphere is tilted toward the Sun, and the southern hemisphere is tilted away. Six months later, the situation is reversed. When spring and fall begin, both hemispheres receive roughly equal amounts of heat from the Sun.<br/><br/>

<strong>Moons</strong><br/>
Earth is the only planet in our solar system with only one moon. Our Moon is the brightest and most familiar object in the night sky. It stabilizes our planet's wobble, which has made the climate less variable over thousands of years.<br/><br/>
Earth sometimes temporarily hosts orbiting asteroids or large rocks. They are typically trapped by Earth's gravity for a few months or years before returning to an orbit around the Sun. Some asteroids will be in a long “dance” with Earth as both orbit the Sun.<br/><br/>
Some moons are bits of rock that were captured by a planet's gravity, but our Moon is likely the result of a collision billions of years ago. When Earth was a young planet, a large chunk of rock smashed into it, displacing a portion of Earth's interior. The resulting chunks clumped together and formed our Moon.<br/><br/>

<strong>Rings</strong><br/>
Earth has no rings.<br/><br/>

<strong>Formation</strong><br/>
When the solar system settled into its current layout about 4.5 billion years ago, Earth formed when gravity pulled swirling gas and dust in to become the third planet from the Sun. Like its fellow terrestrial planets, Earth has a central core, a rocky mantle, and a solid crust.<br/><br/>

<strong>Structure</strong><br/>
Earth is composed of four main layers, starting with an inner core at the planet's center, enveloped by the outer core, mantle, and crust.<br/><br/>
The inner core is a solid sphere made of iron and nickel metals about 759 miles (1,221 kilometers) in radius. Surrounding the inner core is the outer core, about 1,400 miles (2,300 kilometers) thick, made of iron and nickel fluids. Above that lies the mantle, about 1,800 miles (2,900 kilometers) thick, and the outermost crust, 19 miles (30 kilometers) deep on average on land and about 3 miles (5 kilometers) beneath the ocean floor.<br/><br/>

<strong>Surface</strong><br/>
Like Mars and Venus, Earth has volcanoes, mountains, and valleys. Earth's lithosphere, which includes the crust and upper mantle, is divided into huge plates that are constantly moving. Earthquakes result when plates grind past one another, ride up over one another, collide to make mountains, or split and separate.<br/><br/>
Earth's global ocean, which covers about 71% of the planet's surface, has an average depth of about 2.3 miles (3.6 kilometers) and contains 97% of Earth's water. Almost all of Earth's volcanoes are hidden under these oceans. Earth's longest mountain range is also underwater and is four times longer than the Andes, Rockies and Himalayas combined.<br/><br/>

<strong>Atmosphere</strong><br/>
Near the surface, Earth has an atmosphere that consists of 78% nitrogen, 21% oxygen, and 1% other gases such as argon, carbon dioxide, and neon. The atmosphere affects Earth's long-term climate and short-term local weather and shields us from much of the harmful radiation coming from the Sun. It also protects us from meteoroids, most of which burn up in the atmosphere before they can strike the surface.<br/><br/>

<strong>Magnetosphere</strong><br/>
Our planet's rapid rotation and molten nickel-iron core give rise to a magnetic field, which the solar wind distorts into a teardrop shape in space. When charged particles from the solar wind become trapped in Earth's magnetic field, they collide with air molecules above our planet's magnetic poles, creating aurorae, or the northern and southern lights.<br/><br/>
The magnetic field is what causes compass needles to point to the North Pole. The geologic record tells scientists that a magnetic reversal takes place about every 300,000 years on average, but the timing is irregular.<br/><br/>

<strong>8 Need-to-Know Things About Our Home Planet</strong><br/>
Measuring Up: If the Sun were as tall as a typical front door, Earth would be the size of a nickel.<br/>
We're On It: Earth is a rocky planet with a solid and dynamic surface of mountains, canyons, plains and more. Most of our planet is covered in water.<br/>
Breathe Easy: Earth's atmosphere is 78% nitrogen, 21% oxygen and 1% other ingredients – the perfect balance for us to breathe and live.<br/>
Our Cosmic Companion: Earth has one moon.<br/>
Ringless: Earth has no rings.<br/>
Orbital Science: Many orbiting spacecraft study the Earth from above as a whole system — observing the atmosphere, ocean, glaciers, and the solid earth.<br/>
Home, Sweet Home: Earth is the perfect place for life as we know it.<br/>
Protective Shield: Our atmosphere protects us from incoming meteoroids, most of which break up in our atmosphere before they can strike the surface.\n\n
    `,
    imageSrc: getLabAsset("pictures/solar_pictures/Earth.jpg"),
  },

  Mars: {
    title: "MARS",
    intro:
      "Mars is one of the most explored bodies in our solar system, and it's the only planet where we've sent rovers to roam the alien landscape. NASA missions have found lots of evidence that Mars was much wetter and warmer, with a thicker atmosphere, billions of years ago.",
    bodyHtml: `
<strong>Namesake</strong><br/>
Mars was named by the ancient Romans for their god of war because its reddish color was reminiscent of blood. Other civilizations also named the planet for this attribute – for example, the Egyptians called it "Her Desher," meaning "the red one." Even today, it is frequently called the "Red Planet" because iron minerals in the Martian dirt oxidize, or rust, causing the surface to look red.<br/><br/>

<strong>Potential for Life</strong><br/>
Scientists don't expect to find living things currently thriving on Mars. Instead, they're looking for signs of life that existed long ago, when Mars was warmer and covered with water.<br/><br/>

<strong>Size and Distance</strong><br/>
With a radius of 2,106 miles (3,390 kilometers), Mars is about half the size of Earth. If Earth were the size of a nickel, Mars would be about as big as a raspberry.<br/><br/>
From an average distance of 142 million miles (228 million kilometers), Mars is 1.5 astronomical units away from the Sun. From this distance, it takes sunlight 13 minutes to travel from the Sun to Mars.<br/><br/>

<strong>Orbit and Rotation</strong><br/>
As Mars orbits the Sun, it completes one rotation every 24.6 hours, very similar to one day on Earth. Martian days are called sols. A year on Mars lasts 669.6 sols, or 687 Earth days.<br/><br/>
Mars' axis of rotation is tilted 25 degrees with respect to the plane of its orbit around the Sun, similar to Earth's 23.4 degrees, giving Mars distinct seasons that last longer than those on Earth.<br/><br/>

<strong>Moons</strong><br/>
Mars has two small moons, Phobos and Deimos, that may be captured asteroids. They're potato-shaped because they have too little mass for gravity to make them spherical.<br/><br/>
Phobos, the innermost and larger moon, is heavily cratered, with deep grooves on its surface. It is slowly moving towards Mars and will crash into the planet or break apart in about 50 million years.<br/><br/>
Deimos is about half as big as Phobos and orbits two and a half times farther away from Mars. Loose dirt often fills the craters on its surface, making it appear smoother than Phobos.<br/><br/>

<strong>Rings</strong><br/>
Mars has no rings. However, in 50 million years when Phobos crashes into Mars or breaks apart, it could create a dusty ring around the Red Planet.<br/><br/>

<strong>Formation</strong><br/>
When the solar system settled into its current layout about 4.5 billion years ago, Mars formed when gravity pulled swirling gas and dust in to become the fourth planet from the Sun. Mars has a central core, a rocky mantle, and a solid crust.<br/><br/>

<strong>Structure</strong><br/>
Mars has a dense core between 930 and 1,300 miles (1,500 to 2,100 kilometers) in radius, made of iron, nickel, and sulfur. Surrounding the core is a rocky mantle between 770 and 1,170 miles (1,240 to 1,880 kilometers) thick, and above that, a crust between 6 and 30 miles (10 to 50 kilometers) deep.<br/><br/>

<strong>Surface</strong><br/>
The Red Planet is actually many colors. At the surface, we see brown, gold, and tan. The reason Mars looks reddish is due to oxidization – or rusting – of iron in the rocks, regolith, and dust of Mars. Dust storms can lift this dust into the atmosphere and make the whole planet appear red.<br/><br/>
Mars’ volcanoes, impact craters, crustal movement, and atmospheric conditions have created some of the solar system's most interesting topographical features.<br/><br/>
A large canyon system called Valles Marineris is long enough to stretch from California to New York – more than 3,000 miles (4,800 kilometers), up to 200 miles (320 kilometers) wide and 4.3 miles (7 kilometers) deep – about 10 times the size of Earth's Grand Canyon.<br/><br/>
Mars is home to the largest volcano in the solar system, Olympus Mons, three times taller than Earth's Mount Everest, with a base the size of the state of New Mexico.<br/><br/>
Mars appears to have had a watery past, with ancient river valley networks, deltas, and lakebeds, as well as rocks and minerals that could only have formed in liquid water. Today, water on Mars exists mainly as ice at the poles and in briny flows on some hillsides.<br/><br/>

<strong>Atmosphere</strong><br/>
Mars has a thin atmosphere made up mostly of carbon dioxide, nitrogen, and argon. The sky would be hazy and red because of suspended dust. The sparse atmosphere offers little protection from impacts or temperature swings.<br/><br/>
The temperature on Mars can be as high as 70°F (20°C) or as low as about -225°F (-153°C). The thin atmosphere allows heat to escape easily, causing large temperature differences between day and night.<br/><br/>
Occasionally, winds on Mars are strong enough to create dust storms that cover much of the planet. These storms can last for weeks or even months.<br/><br/>

<strong>Magnetosphere</strong><br/>
Mars has no global magnetic field today, but areas of the Martian crust in the southern hemisphere are highly magnetized, indicating traces of a magnetic field from 4 billion years ago.
    `,
    imageSrc: getLabAsset("pictures/solar_pictures/Mars.jpg"),
  },

  Jupiter: {
    title: "JUPITER",
    intro:
      "Jupiter's signature stripes and swirls are actually cold, windy clouds of ammonia and water, floating in an atmosphere of hydrogen and helium. The dark orange stripes are called belts, while the lighter bands are called zones, and they flow east and west in opposite directions. Jupiter’s iconic Great Red Spot is a giant storm bigger than Earth that has raged for hundreds of years.\n\nThe king of planets was named for Jupiter, king of the gods in Roman mythology. Most of its moons are also named for mythological characters associated with Jupiter or his Greek counterpart, Zeus.",
    bodyHtml: `
<strong>Namesake</strong><br/>
Jupiter, being the biggest planet, gets its name from the king of the ancient Roman gods.<br/><br/>

<strong>Potential for Life</strong><br/>
Jupiter’s environment is probably not conducive to life as we know it. The temperatures, pressures, and materials that characterize this planet are most likely too extreme and volatile for organisms to adapt to.<br/><br/>
While planet Jupiter is an unlikely place for living things to take hold, the same is not true of some of its many moons. Europa is one of the likeliest places to find life elsewhere in our solar system. There is evidence of a vast ocean just beneath its icy crust, where life could possibly be supported.<br/><br/>

<strong>Size and Distance</strong><br/>
With a radius of 43,440.7 miles (69,911 kilometers), Jupiter is 11 times wider than Earth. If Earth were the size of a grape, Jupiter would be about as big as a basketball.<br/><br/>
From an average distance of 484 million miles (778 million kilometers), Jupiter is 5.2 astronomical units away from the Sun. From this distance, it takes sunlight 43 minutes to travel from the Sun to Jupiter.<br/><br/>

<strong>Orbit and Rotation</strong><br/>
Jupiter has the shortest day in the solar system. One day on Jupiter takes 9.9 hours, and Jupiter makes a complete orbit around the Sun in about 12 Earth years (4,333 Earth days). Its equator is tilted by just 3 degrees, so Jupiter does not have extreme seasons.<br/><br/>

<strong>Moons</strong><br/>
With four large moons and many smaller moons, Jupiter forms a kind of miniature solar system. Jupiter has 95 moons officially recognized by the IAU. The four largest – Io, Europa, Ganymede, and Callisto – are known as the Galilean satellites and are among the most fascinating destinations in our solar system.<br/><br/>

<strong>Rings</strong><br/>
Discovered in 1979 by NASA's Voyager 1 spacecraft, Jupiter's rings are composed of small, dark particles and are difficult to see except when backlit by the Sun. They may be formed by dust kicked up as meteoroids smash into the planet's small inner moons.<br/><br/>

<strong>Formation</strong><br/>
Jupiter took shape along with rest of the solar system about 4.6 billion years ago. Gravity pulled swirling gas and dust together to form this gas giant. Jupiter took most of the mass left over after the formation of the Sun, ending up with more than twice the combined material of the other bodies in the solar system.<br/><br/>

<strong>Structure</strong><br/>
The composition of Jupiter is similar to that of the Sun – mostly hydrogen and helium. Deep in the atmosphere, pressure and temperature increase, compressing hydrogen gas into a liquid. This gives Jupiter the largest ocean in the solar system – an ocean made of hydrogen instead of water. At greater depths, hydrogen becomes metallic and conducts electricity, generating Jupiter's powerful magnetic field.<br/><br/>

<strong>Surface</strong><br/>
As a gas giant, Jupiter doesn’t have a true surface. The planet is mostly swirling gases and liquids. A spacecraft would have nowhere to land and would be crushed and vaporized by the extreme pressures and temperatures deep inside.<br/><br/>

<strong>Atmosphere</strong><br/>
Jupiter's appearance is a tapestry of colorful stripes and spots – cloud bands and cyclonic storms. Its clouds likely form three main layers of ammonia ice, ammonium hydrosulfide, and water. Fast jet streams separate dark belts and bright zones. Storms like the Great Red Spot can extend hundreds of miles deep and last for centuries.<br/><br/>

<strong>Magnetosphere</strong><br/>
The Jovian magnetosphere is the region of space influenced by Jupiter's powerful magnetic field. It balloons far toward the Sun and stretches beyond Saturn's orbit in the opposite direction. Jupiter's magnetic field is 16 to 54 times as powerful as Earth's and creates intense radiation belts that can damage spacecraft. It also powers some of the solar system's most spectacular aurorae at the planet's poles.
    `,
    imageSrc: getLabAsset("pictures/solar_pictures/Jupiter.jpg"),
  },

  Saturn: {
    title: "SATURN",
    intro:
      "Like fellow gas giant Jupiter, Saturn is a massive ball made mostly of hydrogen and helium. Saturn is not the only planet to have rings, but none are as spectacular or as complex as Saturn's. Saturn also has dozens of moons.\n\nFrom the jets of water that spray from Saturn's moon Enceladus to the methane lakes on smoggy Titan, the Saturn system is a rich source of scientific discovery and still holds many mysteries.",
    bodyHtml: `
<strong>Namesake</strong><br/>
The farthest planet from Earth discovered by the unaided human eye, Saturn has been known since ancient times. The planet is named for the Roman god of agriculture and wealth, who was also the father of Jupiter.<br/><br/>

<strong>Potential for Life</strong><br/>
Saturn's environment is not conducive to life as we know it. The temperatures, pressures, and materials that characterize this planet are most likely too extreme and volatile for organisms to adapt to.<br/><br/>
While Saturn itself is unlikely to host life, some of its moons, such as Enceladus and Titan, may have internal oceans that could possibly support life.<br/><br/>

<strong>Size and Distance</strong><br/>
With an equatorial diameter of about 74,897 miles (120,500 kilometers), Saturn is 9 times wider than Earth. If Earth were the size of a nickel, Saturn would be about as big as a volleyball.<br/><br/>
From an average distance of 886 million miles (1.4 billion kilometers), Saturn is 9.5 astronomical units away from the Sun. From this distance, it takes sunlight 80 minutes to travel from the Sun to Saturn.<br/><br/>

<strong>Orbit and Rotation</strong><br/>
Saturn has the second-shortest day in the solar system. One day on Saturn takes only 10.7 hours, and Saturn makes a complete orbit around the Sun in about 29.4 Earth years (10,756 Earth days). Its axis is tilted by 26.73 degrees, similar to Earth's tilt, so Saturn experiences seasons.<br/><br/>

<strong>Moons</strong><br/>
Saturn is home to a vast array of intriguing and unique worlds. As of June 8, 2023, Saturn has 146 moons in its orbit, with others awaiting confirmation and naming. Titan and Enceladus are especially interesting because of their potential subsurface oceans.<br/><br/>

<strong>Rings</strong><br/>
Saturn's rings are thought to be pieces of comets, asteroids, or shattered moons torn apart by Saturn's gravity. They are made of billions of chunks of ice and rock coated with dust. The ring particles mostly range from tiny, dust-sized grains to chunks as big as a house.<br/><br/>
Saturn's ring system extends up to 175,000 miles (282,000 kilometers) from the planet, yet the main rings are typically only about 30 feet (10 meters) thick. The rings are named alphabetically in the order they were discovered: D, C, B, Cassini Division, A, F, G, and E rings, plus the faint Phoebe ring much farther out.<br/><br/>

<strong>Formation</strong><br/>
Saturn took shape when the rest of the solar system formed about 4.5 billion years ago, when gravity pulled swirling gas and dust in to become this gas giant. About 4 billion years ago, Saturn settled into its current position as the sixth planet from the Sun. Like Jupiter, Saturn is mostly made of hydrogen and helium.<br/><br/>

<strong>Structure</strong><br/>
Like Jupiter, Saturn is made mostly of hydrogen and helium. At Saturn's center is a dense core of metals like iron and nickel surrounded by rocky materials and other compounds solidified by intense pressure and heat. This is enveloped by liquid metallic hydrogen inside a layer of liquid hydrogen.<br/><br/>
Saturn is the only planet in our solar system whose average density is less than water – it would float in a bathtub large enough to hold it.<br/><br/>

<strong>Surface</strong><br/>
As a gas giant, Saturn doesn’t have a true surface. The planet is mostly swirling gases and liquids deeper down. Any spacecraft trying to descend would be crushed, melted, and vaporized by increasing pressure and temperature.<br/><br/>

<strong>Atmosphere</strong><br/>
Saturn is blanketed with clouds that appear as faint stripes, jet streams, and storms. The planet is many different shades of yellow, brown, and gray. Winds in the upper atmosphere can reach up to 1,600 feet per second (500 meters per second).<br/><br/>
Saturn's north pole hosts a unique six-sided jet stream – a hexagon-shaped pattern first seen by Voyager 1 and later studied by Cassini. It spans about 20,000 miles (30,000 kilometers) with a massive rotating storm at the center.<br/><br/>

<strong>Magnetosphere</strong><br/>
Saturn's magnetic field is smaller than Jupiter's but still 578 times as powerful as Earth's. Saturn, its rings, and many of its satellites lie within Saturn's enormous magnetosphere. Aurorae occur when charged particles spiral into the atmosphere along magnetic field lines. Some of Saturn's aurorae are driven by particles from its moons and the rapid rotation of its magnetic field, not only by the solar wind.
    `,
    imageSrc: getLabAsset("pictures/solar_pictures/Saturn.jpg"),
  },

  Uranus: {
    title: "URANUS",
    intro:
      "Uranus is a very cold and windy world. The ice giant is surrounded by 13 faint rings and 28 small moons. Uranus rotates at a nearly 90-degree angle from the plane of its orbit. This unique tilt makes Uranus appear to spin sideways, orbiting the Sun like a rolling ball.\n\nUranus was the first planet found with the aid of a telescope. It was discovered in 1781 by astronomer William Herschel, although he originally thought it was either a comet or a star. It was two years later that the object was universally accepted as a new planet.",
    bodyHtml: `
<strong>Namesake</strong><br/>
William Herschel tried unsuccessfully to name his discovery Georgium Sidus after King George III. Instead, the planet was named for Uranus, the Greek god of the sky, as suggested by Johann Bode.<br/><br/>

<strong>Potential for Life</strong><br/>
Uranus' environment is not conducive to life as we know it. The temperatures, pressures, and materials that characterize this planet are most likely too extreme and volatile for organisms to adapt to.<br/><br/>

<strong>Size and Distance</strong><br/>
With an equatorial diameter of 31,763 miles (51,118 kilometers), Uranus is four times wider than Earth. If Earth was the size of a nickel, Uranus would be about as big as a softball.<br/><br/>
From an average distance of 1.8 billion miles (2.9 billion kilometers), Uranus is about 19 astronomical units away from the Sun. From this distance, it takes sunlight 2 hours and 40 minutes to travel from the Sun to Uranus.<br/><br/>

<strong>Orbit and Rotation</strong><br/>
One day on Uranus takes about 17 hours. Uranus makes a complete orbit around the Sun in about 84 Earth years (30,687 Earth days).<br/><br/>
Uranus' equator is tilted 97.77 degrees from its orbital plane, likely due to a long-ago collision with an Earth-sized object. This extreme tilt causes Uranus to have the most extreme seasons in the solar system. For nearly a quarter of each Uranian year, the Sun shines directly over one pole, leaving the other in 21 years of darkness.<br/><br/>

<strong>Moons</strong><br/>
Uranus has 28 known moons. Unlike most planetary systems where moons are named after mythological gods, Uranus' moons are named for characters from the works of William Shakespeare and Alexander Pope.<br/><br/>

<strong>Rings</strong><br/>
Uranus has two sets of rings. The inner system of nine rings consists mostly of narrow, dark grey rings. There are two outer rings: the innermost one is reddish and the outer ring is blue, similar to Saturn's E ring. In order of increasing distance from the planet, the rings are called Zeta, 6, 5, 4, Alpha, Beta, Eta, Gamma, Delta, Lambda, Epsilon, Nu, and Mu.<br/><br/>

<strong>Formation</strong><br/>
Uranus took shape when the rest of the solar system formed about 4.5 billion years ago. It likely formed closer to the Sun before moving outward to become the seventh planet from the Sun.<br/><br/>

<strong>Structure</strong><br/>
Uranus is one of two ice giants in the outer solar system (the other is Neptune). Most (80% or more) of the planet's mass is made up of a hot dense fluid of "icy" materials – water, methane, and ammonia – above a small rocky core. Near the core, it heats up to about 9,000°F (4,982°C). Uranus is slightly larger in diameter than Neptune but less massive, and is the second least dense planet after Saturn.<br/><br/>
Uranus gets its blue-green color from methane gas in its atmosphere, which absorbs red light and reflects blue and green.<br/><br/>

<strong>Surface</strong><br/>
As an ice giant, Uranus doesn’t have a true solid surface. The planet is mostly swirling fluids. Any spacecraft would be destroyed by the extreme pressures and temperatures long before it could reach a solid core.<br/><br/>

<strong>Atmosphere</strong><br/>
Uranus' atmosphere is mostly hydrogen and helium, with a small amount of methane and traces of water and ammonia. The methane gives Uranus its signature blue color. Minimum atmospheric temperatures can reach 49 K (-224.2°C), making it even colder than Neptune in some places.<br/><br/>
Wind speeds can reach up to 560 miles per hour (900 kilometers per hour). Winds are retrograde at the equator and prograde closer to the poles.<br/><br/>

<strong>Magnetosphere</strong><br/>
Uranus has an unusual, irregularly shaped magnetosphere. Its magnetic axis is tilted nearly 60 degrees from its rotation axis and is offset from the planet's center by one-third of the planet's radius. Uranus has auroras, but unlike Earth, Jupiter, and Saturn, they are not aligned with the poles due to the lopsided magnetic field.
    `,
    imageSrc: getLabAsset("pictures/solar_pictures/Uranus.jpg"),
  },

  Neptune: {
    title: "NEPTUNE",
    intro:
      "Dark, cold, and whipped by supersonic winds, ice giant Neptune is more than 30 times as far from the Sun as Earth. Neptune is the only planet in our solar system not visible to the naked eye. In 2011 Neptune completed its first 165-year orbit since its discovery in 1846.\n\nNeptune is so far from the Sun that high noon on the big blue planet would seem like dim twilight to us. The warm light we see here on our home planet is roughly 900 times as bright as sunlight on Neptune.",
    bodyHtml: `
<strong>Discovery and Namesake</strong><br/>
Galileo recorded Neptune as a fixed star in 1612 and 1613. More than 200 years later, the ice giant became the first planet located through mathematical predictions rather than by regular observations of the sky. Because Uranus didn't travel exactly as expected, French mathematician Urbain Le Verrier proposed the position and mass of an unknown planet that could cause the observed changes to Uranus' orbit. Johann Galle observed Neptune in 1846, almost exactly where predicted.<br/><br/>

<strong>Potential for Life</strong><br/>
Neptune's environment is not conducive to life as we know it. The temperatures, pressures, and materials that characterize this planet are too extreme and volatile for organisms to adapt to.<br/><br/>

<strong>Size and Distance</strong><br/>
With an equatorial diameter of 30,775 miles (49,528 kilometers), Neptune is about four times wider than Earth. If Earth were the size of a nickel, Neptune would be about as big as a baseball.<br/><br/>
From an average distance of 2.8 billion miles (4.5 billion kilometers), Neptune is 30 astronomical units away from the Sun. From this distance, it takes sunlight 4 hours to travel from the Sun to Neptune.<br/><br/>

<strong>Orbit and Rotation</strong><br/>
One day on Neptune takes about 16 hours. Neptune makes a complete orbit around the Sun in about 165 Earth years (60,190 Earth days). Neptune’s axis of rotation is tilted 28 degrees, similar to Mars and Earth, giving Neptune seasons that last over 40 years each.<br/><br/>

<strong>Moons</strong><br/>
Neptune has 16 known moons. Triton, its largest moon, orbits in a retrograde direction, suggesting that it may have been a captured Kuiper Belt object. Triton is extremely cold, with surface temperatures around -391°F (-235°C), yet Voyager 2 observed geysers spewing icy material several miles high.<br/><br/>

<strong>Rings</strong><br/>
Neptune has at least five main rings and four prominent ring arcs. Starting near the planet and moving outward, the main rings are named Galle, Leverrier, Lassell, Arago, and Adams. The rings are thought to be relatively young and short-lived. Peculiar arcs of dust – Liberté, Egalité, Fraternité, and Courage – reside in the outermost Adams ring, stabilized by the gravity of the nearby moon Galatea.<br/><br/>

<strong>Formation</strong><br/>
Neptune took shape about 4.5 billion years ago, when gravity pulled swirling gas and dust in to become this ice giant. Like Uranus, Neptune likely formed closer to the Sun and migrated outward to become the eighth planet.<br/><br/>

<strong>Structure</strong><br/>
Neptune is one of two ice giants in the outer solar system. Most of the planet's mass consists of a hot dense fluid of water, methane, and ammonia above a small rocky core. Neptune is the densest of the giant planets.<br/><br/>
Scientists think there might be an ocean of superhot water under Neptune's cold clouds, kept in a strange, high-pressure state that prevents it from boiling away.<br/><br/>

<strong>Surface</strong><br/>
Neptune has no solid surface. Its atmosphere gradually transitions into deeper layers of water and other “ices” over a heavier core about the same mass as Earth.<br/><br/>

<strong>Atmosphere</strong><br/>
Neptune's atmosphere is made up mostly of hydrogen and helium with a small amount of methane. Methane absorbs red light and reflects blue, giving Neptune and Uranus their blue color. Neptune is our solar system's windiest world, with winds reaching more than 1,200 miles per hour (2,000 kilometers per hour). Large dark storms, similar to Jupiter’s Great Red Spot, appear and disappear over time.<br/><br/>

<strong>Magnetosphere</strong><br/>
The main axis of Neptune's magnetic field is tilted by about 47 degrees compared with its rotation axis, leading to wild variations in the magnetosphere during each rotation. Neptune's magnetic field is about 27 times more powerful than Earth's.
    `,
    imageSrc: getLabAsset("pictures/solar_pictures/Neptune.jpg"),
  },

  Pluto: {
    title: "PLUTO",
    intro:
      "Pluto is a complex and mysterious world with mountains, valleys, plains, craters, and glaciers. It is located in the distant Kuiper Belt. \n\nPluto no longer a planet. Pluto was reclassified as a dwarf planet in 2006 by the International Astronomical Union because other objects might cross its orbit.\n\nDiscovered in 1930, Pluto was long considered our solar system's ninth planet. But after the discovery of similar worlds deeper in the Kuiper Belt, Pluto was reclassified as a dwarf planet in 2006 by the International Astronomical Union.",
    bodyHtml: `
<strong>Namesake</strong><br/>
Pluto was named by an 11-year-old girl, Venetia Burney of Oxford, England, who suggested the name of the Roman god of the underworld. The name was forwarded to the Lowell Observatory and selected.<br/><br/>

<strong>Potential for Life</strong><br/>
The surface of Pluto is extremely cold, so it's unlikely that life could exist there. At such cold temperatures, water, which is vital for life as we know it, is essentially rock-like. Pluto's interior is warmer, however, and some think there could even be an ocean deep inside.<br/><br/>

<strong>Size and Distance</strong><br/>
Pluto has an equatorial diameter of about 1,477 miles (2,377 kilometers), about one-fifth the width of Earth. From an average distance of about 3.7 billion miles (5.9 billion kilometers), Pluto is about 39 times farther away from the Sun than Earth is. From this distance, it takes sunlight 5.5 hours to reach Pluto.<br/><br/>

<strong>Orbit and Rotation</strong><br/>
Pluto's orbit around the Sun is highly elliptical and tilted. Its 248-year-long orbit can bring it as close as 30 AU and as far as 49.3 AU from the Sun. From 1979 to 1999, Pluto was closer to the Sun than Neptune.<br/><br/>
One day on Pluto takes about 153 hours. Its axis of rotation is tilted 57 degrees with respect to its orbital plane, so it spins almost on its side. Pluto also rotates in a retrograde direction, like Venus and Uranus.<br/><br/>

<strong>Moons</strong><br/>
Pluto has five known moons: Charon, Nix, Hydra, Kerberos, and Styx. Charon is about half the size of Pluto itself, making it the largest moon relative to its planet in the solar system. Pluto and Charon are often referred to as a double planet. Charon is tidally locked to Pluto, and Pluto always shows the same face to Charon as well.<br/><br/>

<strong>Rings</strong><br/>
There are no known rings around Pluto.<br/><br/>

<strong>Formation</strong><br/>
Pluto is a member of the Kuiper Belt, a disc-like zone of icy bodies beyond Neptune. These Kuiper Belt objects formed early in the history of the solar system about 4.5 billion years ago.<br/><br/>

<strong>Structure</strong><br/>
Pluto is about two-thirds the diameter of Earth's Moon and probably has a rocky core surrounded by a mantle of water ice. Its surface is coated with ices of nitrogen, methane, and carbon monoxide. Due to its lower density, Pluto's mass is about one-sixth that of Earth's Moon.<br/><br/>

<strong>Surface</strong><br/>
Pluto's surface has mountains, valleys, plains, and craters. The temperature can be as cold as -375 to -400°F (-226 to -240°C). Tall mountains of water ice rise several kilometers high and may be coated with nitrogen, methane, or carbon monoxide ices. Some regions show few craters, indicating relatively recent geologic activity.<br/><br/>

<strong>Atmosphere</strong><br/>
Pluto has a thin, tenuous atmosphere that expands when it is closer to the Sun and collapses as it moves farther away. The main component is molecular nitrogen, with methane and carbon monoxide also present. As Pluto approaches the Sun, surface ices sublime into gas; as it recedes, the atmosphere may freeze and fall as snow back to the surface.<br/><br/>

<strong>Magnetosphere</strong><br/>
It is not known whether Pluto has a magnetic field, but its small size and slow rotation suggest little or none.
    `,
    imageSrc: getLabAsset("pictures/solar_pictures/Pluto.png"),
  },

  Sun: {
    title: "SUN",
    intro:
      "From our vantage point on Earth, the Sun may appear like an unchanging source of light and heat in the sky. But the Sun is a dynamic star, constantly changing and sending energy out into space. The science of studying the Sun and its influence throughout the solar system is called heliophysics.\n\nThe Sun is the largest object in our solar system. Its gravity holds the solar system together, keeping everything from the biggest planets to the smallest bits of debris in orbit around it.",
    bodyHtml: `
<strong>Namesake</strong><br/>
The Latin word for Sun is “sol,” which is the root of words like solar. Helios, the Sun god in ancient Greek mythology, lends his name to many Sun-related terms such as heliosphere and helioseismology.<br/><br/>

<strong>Potential for Life</strong><br/>
The Sun could not harbor life as we know it because of its extreme temperatures and radiation. Yet life on Earth is only possible because of the Sun’s light and energy.<br/><br/>

<strong>Size and Distance</strong><br/>
Our Sun is a medium-sized star with a radius of about 435,000 miles (700,000 kilometers). It is far more massive than Earth: it would take more than 330,000 Earths to match the Sun’s mass, and about 1.3 million Earths to fill its volume.<br/><br/>
The Sun is about 93 million miles (150 million kilometers) from Earth. Its nearest stellar neighbors are in the Alpha Centauri system, more than 4 light-years away.<br/><br/>

<strong>Orbit and Rotation</strong><br/>
The Sun is located in a spiral arm of the Milky Way called the Orion Spur. It orbits the center of the galaxy at about 450,000 miles per hour (720,000 kilometers per hour), taking roughly 230 million years to complete one revolution. The Sun also rotates on its axis: about 25 days at the equator and 36 days at the poles.<br/><br/>

<strong>Formation</strong><br/>
The Sun formed about 4.6 billion years ago in a collapsing cloud of gas and dust called the solar nebula. Most of the nebula’s material condensed into the Sun, which holds 99.8% of the solar system’s mass. The remaining material formed planets, moons, asteroids, and comets.<br/><br/>

<strong>Structure</strong><br/>
The Sun is a huge ball of hydrogen and helium held together by gravity. Its interior is composed of the core, radiative zone, and convection zone. The core, where nuclear fusion converts hydrogen into helium, reaches about 27 million°F (15 million°C). Energy then travels outward through the radiative and convection zones before reaching the surface.<br/><br/>

<strong>Surface</strong><br/>
The “surface” we see is the photosphere, about 250 miles thick, with temperatures around 10,000°F (5,500°C). Above it lie the chromosphere, transition region, and corona – the Sun’s outer atmosphere, which can reach millions of degrees.<br/><br/>

<strong>Atmosphere and Activity</strong><br/>
The Sun’s atmosphere hosts sunspots, solar flares, and coronal mass ejections. The corona extends far out into space, producing the solar wind, a stream of charged particles that fills the heliosphere – a vast bubble encompassing the planets. The Sun’s activity varies over an approximately 11-year solar cycle, from quiet periods to solar maximum with many sunspots and flares.<br/><br/>

<strong>Magnetosphere</strong><br/>
The Sun’s magnetic field extends outward with the solar wind to form the interplanetary magnetic field. This rotating magnetic field, shaped into a Parker spiral, drives space weather throughout the solar system. Strong solar storms can disturb Earth’s magnetosphere, generating brilliant auroras but also potentially disrupting satellites, communications, and power grids.
    `,
    imageSrc: getLabAsset("pictures/solar_pictures/Sun.jpg"),
  },
};

/* ───────── استایل کلی صفحه ───────── */
const sectionStyle: CSSProperties = {
  width: "100%",
  height: "100dvh",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 10% -10%, #111b43 0%, #050b22 40%, #020510 80%)",
  color: "#ffffff",
};

const wrapperStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  height: "100dvh",
  overflow: "hidden",
};

const leftPaneStyle: CSSProperties = {
  flex: "0 0 75%",
  position: "sticky",
  top: 0,
  height: "100dvh",
  borderRight: "1px solid rgba(255,255,255,0.14)",
  boxSizing: "border-box",
};

const leftInnerStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
};

const rightPaneStyle: CSSProperties = {
  flex: "0 0 25%",
  height: "100dvh",
  overflow: "hidden",
  boxSizing: "border-box",
  padding: "32px 24px 32px 24px",
  fontFamily: "Gotham, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const textBlockStyle: CSSProperties = {
  position: "relative",
  maxWidth: TWEAKS.textMaxWidth, // ← با این عرض فضای خالی سمت راست را کنترل کن
  width: "100%", // ← باکس متن کل پهنای پنل راست را می‌گیرد
  height: "calc(100dvh - 48px)", // ناحیه زرد
  margin: 0,
};

const scrollInnerStyle: CSSProperties = {
  height: "100%",
  overflowY: "auto", // ← اسکرول فقط در همین باکس
  paddingRight: 8,
  paddingBottom: 16,
  lineHeight: 1.7,
  scrollbarWidth: "none", // ← فایرفاکس – حذف نوار اسکرول
  msOverflowStyle: "none", // ← IE/Edge – حذف نوار اسکرول
  // نکته: برای WebKit (Chrome/Edge/Opera/Safari) در index.css این را اضافه کن:
  // ::-webkit-scrollbar { width: 0; height: 0; }
};

const headingStyle: CSSProperties = {
  fontSize: TWEAKS.headingFontSize, // ← سایز تیتر اصلی
  fontWeight: 800,
  letterSpacing: "0.12em",
  marginBottom: 12,
};

const subheadingStyle: CSSProperties = {
  fontSize: TWEAKS.subheadingFontSize, // ← سایز زیرتیتر "Introduction"
  fontWeight: 500,
  opacity: 0.8,
  marginBottom: 16,
};

const introTextStyle: CSSProperties = {
  fontSize: TWEAKS.introFontSize, // ← سایز متن مقدمه
  fontWeight: 400,
  lineHeight: 1.6,
  whiteSpace: "pre-line",
  marginBottom: 20,
};

const bodyTextWrapperStyle: CSSProperties = {
  fontSize: TWEAKS.bodyFontSize, // ← سایز متن بدنه
  fontWeight: 400,
  lineHeight: 1.6,
};

const imageBoxStyle: CSSProperties = {
  width: "100%",
  height: TWEAKS.imageBoxHeight, // ← ارتفاع ثابت برای همه تصاویر
  marginBottom: 20,
  overflow: "hidden",
  borderRadius: 14, // ← کمی نرم‌تر؛ اگر نمی‌خواهی 0 کن
  background: "rgba(255,255,255,0.04)", // ← پس‌زمینه‌ی ملایم اگر تصویر دیر لود شد
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover", // ← تصویر هر سایزی باشد این باکس را کامل پر می‌کند
  display: "block",
};

const scrollIndicatorStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 4,
  width: 2,
  height: 80,
  borderRadius: 999,
  transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.14)",
  pointerEvents: "none",
};

/* چک‌باکس توقف روتیشن */
const pauseToggleWrapperStyle: CSSProperties = {
  position: "absolute",
  top: 24,
  left: 32,
  zIndex: 5,
  pointerEvents: "auto",
};

const pauseLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  opacity: 0.95,
  cursor: "pointer",
  color: "#ffffff",
  fontFamily: "Gotham, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

/* ───────── Overlay ───────── */
const overlayContainerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  fontFamily: "Gotham, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const overlayItemStyleBase: CSSProperties = {
  position: "absolute",
  width: 280,
  transform: "translateX(-50%)",
  textAlign: "left",
};

const overlayNameStyle: CSSProperties = {
  fontSize: 18,
  letterSpacing: "0.14em",
  marginBottom: 8,
};

const overlayStatsStyle: CSSProperties = {
  fontSize: 14,
  opacity: 0.9,
  textTransform: "uppercase",
  lineHeight: 1.5,
};

/* ───────── Canvas سه‌بعدی ───────── */
type PlanetsCanvasProps = {
  selected: PlanetKey;
  onSelect: (planet: PlanetKey) => void;
  paused: boolean;
};

function PlanetsCanvas({ selected, onSelect, paused }: PlanetsCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef<boolean>(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setClearColor(0x050b22, 1);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, TWEAKS.dprMax)
    );

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      TWEAKS.camFov,
      1,
      TWEAKS.camNear,
      TWEAKS.camFar
    );
    camera.position.set(0, 0, TWEAKS.camZ);

    const ambient = new THREE.AmbientLight(0xffffff, TWEAKS.ambientIntensity);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(
      0xffffff,
      TWEAKS.keyLightIntensity
    );
    keyLight.position.set(8, 10, 16);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(
      0xffffff,
      TWEAKS.rimLightIntensity
    );
    rimLight.position.set(-10, -6, -14);
    scene.add(rimLight);

    const group = new THREE.Group();
    scene.add(group);

    const texLoader = new THREE.TextureLoader();
    const pivots: THREE.Object3D[] = [];
    const meshes: THREE.Mesh[] = [];
    const spinSpeeds: number[] = [];
    const planetKeys: PlanetKey[] = [];

    const cols = TWEAKS.cols;
    const colGap = TWEAKS.colXGap;
    const rowGap = TWEAKS.rowYGap;

    const totalColsWidth = (cols - 1) * colGap;
    const startX = -totalColsWidth / 2;

    const rowYOffset = 0.8;
    const rowYs = [rowGap / 2 + rowYOffset, -rowGap / 2 + rowYOffset];

    const baseSpin = 0.08;

    PLANETS.forEach((planet, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      let x = startX + col * colGap;
      const y = rowYs[row] ?? 0;

      const isBottomRow = row === 1;
      const isBottomPlanetGroup =
        planet.key === "Saturn" ||
        planet.key === "Uranus" ||
        planet.key === "Neptune" ||
        planet.key === "Pluto";

      if (isBottomRow) {
        if (isBottomPlanetGroup) {
          x += TWEAKS.bottomPlanetGroupOffsetX;
        }
        if (planet.key === "Sun") {
          x += TWEAKS.sunOffsetX;
        }
      } else if (planet.key === "Sun") {
        x += TWEAKS.sunOffsetX;
      }

      const pivot = new THREE.Object3D();
      pivot.position.set(x, y, 0);
      group.add(pivot);

      const geo = new THREE.SphereGeometry(planet.radius, 64, 64);
      const tex = texLoader.load(planet.texture);
      tex.colorSpace = THREE.SRGBColorSpace;

      const isSun = planet.key === "Sun";

      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: isSun ? 0.45 : 0.85,
        metalness: isSun ? 0.05 : 0.02,
        emissive: isSun ? new THREE.Color(0xffb74d) : new THREE.Color(0x000000),
        emissiveIntensity: isSun ? 1.4 : 0.0,
      });

      const mesh = new THREE.Mesh(geo, mat);
      pivot.add(mesh);

      const baseAxisFactor = 3.4;
      const axisFactor =
        planet.key === "Jupiter" || planet.key === "Sun" ? 3.0 : baseAxisFactor;
      const axisHeight = planet.radius * axisFactor;

      const axisGeo = new THREE.CylinderGeometry(0.03, 0.03, axisHeight, 12);
      const axisMat = new THREE.MeshBasicMaterial({
        color: isSun ? 0xfff3c4 : 0xffffff,
        transparent: true,
        opacity: isSun ? 0.9 : 0.6,
      });
      const axisMesh = new THREE.Mesh(axisGeo, axisMat);
      pivot.add(axisMesh);

      // رینگ زحل
      if (planet.key === "Saturn") {
        const innerR = planet.radius * 1.4;
        const outerR = planet.radius * 1.9;

        const ringGeo = new THREE.RingGeometry(innerR, outerR, 256);

        const ringMat = new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.DoubleSide,
          uniforms: {
            innerR: { value: innerR },
            outerR: { value: outerR },
          },
          vertexShader: `
            varying vec2 vPos;
            void main() {
              vPos = position.xy;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            precision highp float;
            varying vec2 vPos;
            uniform float innerR;
            uniform float outerR;

            void main() {
              float r = length(vPos);
              float t = clamp((r - innerR) / max(outerR - innerR, 1e-5), 0.0, 1.0);

              if (t <= 0.0 || t >= 1.0) {
                discard;
              }

              float stripe1 = 0.5 + 0.5 * sin(80.0 * t);
              float stripe2 = 0.5 + 0.5 * sin(25.0 * t + 1.5);
              float stripe3 = 0.5 + 0.5 * sin(10.0 * t + 3.2);
              float mixStripe = (stripe1 * 0.4 + stripe2 * 0.4 + stripe3 * 0.2);

              vec3 innerCol = vec3(0.72, 0.68, 0.62);
              vec3 outerCol = vec3(0.32, 0.30, 0.28);
              vec3 col = mix(innerCol, outerCol, t);
              col *= 0.65 + 0.35 * mixStripe;

              float alphaInner = smoothstep(0.02, 0.08, t);
              float alphaOuter = 1.0 - smoothstep(0.92, 0.98, t);
              float alpha = alphaInner * alphaOuter * 0.95;

              gl_FragColor = vec4(col, alpha);
            }
          `,
        });

        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        pivot.add(ringMesh);
      }

      // رینگ اورانوس – آبی
      if (planet.key === "Uranus") {
        const innerR = planet.radius * 1.35;
        const outerR = planet.radius * 1.85;

        const ringGeo = new THREE.RingGeometry(innerR, outerR, 256);

        const ringMat = new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.DoubleSide,
          uniforms: {
            innerR: { value: innerR },
            outerR: { value: outerR },
          },
          vertexShader: `
            varying vec2 vPos;
            void main() {
              vPos = position.xy;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            precision highp float;
            varying vec2 vPos;
            uniform float innerR;
            uniform float outerR;

            void main() {
              float r = length(vPos);
              float t = clamp((r - innerR) / max(outerR - innerR, 1e-5), 0.0, 1.0);

              if (t <= 0.0 || t >= 1.0) {
                discard;
              }

              float repeat = 17.0;
              float local  = fract(t * repeat);
              float center = 0.5;
              float width  = 0.20;
              float d      = abs(local - center);
              float baseCore = smoothstep(width, 0.0, d);

              float idx = floor(t * repeat);

              float keep01 = step(-0.5, idx) * (1.0 - step(1.5, idx));  // [0,1]
              float keep45 = step(3.5, idx) * (1.0 - step(5.5, idx));   // [4,5]
              float keep89 = step(7.5, idx) * (1.0 - step(9.5, idx));   // [8,9]

              float mask = clamp(keep01 + keep45 + keep89, 0.0, 1.0);

              float core = baseCore * mask;

              vec3 innerCol = vec3(0.80, 0.90, 0.92);
              vec3 outerCol = vec3(0.45, 0.55, 0.58);
              vec3 col = mix(innerCol, outerCol, t);
              col *= 0.65 + 1.85 * core;

              float fadeInner = smoothstep(0.02, 0.10, t);
              float fadeOuter = 1.0 - smoothstep(0.90, 0.98, t);
              float alpha = fadeInner * fadeOuter * core * 0.75;

              if (alpha < 0.02) discard;

              gl_FragColor = vec4(col, alpha);
            }
          `,
        });

        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        pivot.add(ringMesh);
      }

      // رینگ نپتون – آبی با الگوی ۲+۲ و گپ
      if (planet.key === "Neptune") {
        const innerR = planet.radius * 1.4;
        const outerR = planet.radius * 1.95;

        const ringGeo = new THREE.RingGeometry(innerR, outerR, 256);

        const ringMat = new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.DoubleSide,
          uniforms: {
            innerR: { value: innerR },
            outerR: { value: outerR },
          },
          vertexShader: `
            varying vec2 vPos;
            void main() {
              vPos = position.xy;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            precision highp float;
            varying vec2 vPos;
            uniform float innerR;
            uniform float outerR;

            float band(float t, float center, float width) {
              float d = abs(t - center);
              return smoothstep(width, 0.0, d);
            }

            void main() {
              float r = length(vPos);
              float t = clamp((r - innerR) / max(outerR - innerR, 1e-5), 0.0, 1.0);

              if (t <= 0.0 || t >= 1.0) {
                discard;
              }

              float b1 = band(t, 0.18, 0.015);
              float b2 = band(t, 0.23, 0.015);

              float b3 = band(t, 0.58, 0.015);
              float b4 = band(t, 0.63, 0.015);

              float bands = b1 + b2 + b3 + b4;
              bands = clamp(bands, 0.0, 1.0);

              if (bands < 0.02) {
                discard;
              }

              vec3 innerCol = vec3(0.45, 0.78, 0.95);
              vec3 outerCol = vec3(0.18, 0.46, 0.80);
              vec3 col = mix(innerCol, outerCol, t);
              col *= 0.85 + 0.95 * bands;

              float fadeInner = smoothstep(0.02, 0.10, t);
              float fadeOuter = 1.0 - smoothstep(0.90, 0.98, t);
              float alpha = fadeInner * fadeOuter * 0.98 * bands;

              if (alpha < 0.02) discard;

              gl_FragColor = vec4(col, alpha);
            }
          `,
        });

        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        pivot.add(ringMesh);
      }

      const tiltRad = THREE.MathUtils.degToRad(planet.tiltDeg);
      pivot.rotation.z = tiltRad;

      let spin =
        planet.yearDays > 0
          ? baseSpin * (365 / planet.yearDays)
          : baseSpin * 0.2;
      if (planet.tiltDeg > 90) spin *= -1;

      spinSpeeds.push(spin);

      if (isSun) {
        const sunLight = new THREE.PointLight(0xffd27f, 4, 50);
        pivot.add(sunLight);
      }

      pivots.push(pivot);
      meshes.push(mesh);
      planetKeys.push(planet.key);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.set(x, y);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const idx = meshes.indexOf(intersects[0].object as THREE.Mesh);
        if (idx >= 0) onSelect(planetKeys[idx]);
      }
    };

    canvas.addEventListener("click", handleClick);

    const resize = () => {
      const w = container.clientWidth || window.innerWidth * 0.75;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, true);
    };

    resize();
    window.addEventListener("resize", resize);

    let frameId: number | null = null;

    const renderLoop = () => {
      pivots.forEach((pivot, i) => {
        if (!pausedRef.current) {
          pivot.rotation.y += spinSpeeds[i];
        }
      });

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const material = obj.material;
          if (Array.isArray(material)) {
            material.forEach((m) => {
              const mm = m as THREE.Material & { map?: THREE.Texture };
              if (mm.map) mm.map.dispose();
              mm.dispose();
            });
          } else {
            const mat = material as THREE.Material & { map?: THREE.Texture };
            mat.map?.dispose?.();
            mat.dispose();
          }
        }
      });
    };
  }, []); // ← فقط یک‌بار صحنه ساخته می‌شود؛ چک‌باکس دیگر همه‌چیز را ریست نمی‌کند

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

/* ───────── Overlay ───────── */
type OverlayProps = {
  selected: PlanetKey;
  onSelect: (planet: PlanetKey) => void;
};

function PlanetsOverlay({ selected, onSelect }: OverlayProps) {
  return (
    <div style={overlayContainerStyle}>
      {PLANETS.map((planet, index) => {
        const col = index % TWEAKS.cols;
        const row = Math.floor(index / TWEAKS.cols);

        let leftPercent = ((col + 0.5) / TWEAKS.cols) * 100;
        const isBottomRow = row === 1;
        const isBottomPlanetGroup =
          planet.key === "Saturn" ||
          planet.key === "Uranus" ||
          planet.key === "Neptune" ||
          planet.key === "Pluto";

        if (isBottomRow) {
          if (planet.key === "Sun") {
            leftPercent += TWEAKS.sunOverlayOffsetXPercent;
          } else if (isBottomPlanetGroup) {
            leftPercent += TWEAKS.bottomPlanetOverlayOffsetXPercent;
          }
        }

        const topPercent = row === 0 ? 40 : 86;

        const tiltText = `${planet.tiltDeg.toFixed(
          planet.tiltDeg < 1 ? 3 : 1
        )}°`;
        const dayText =
          planet.key === "Sun"
            ? `~${planet.dayHours} HOURS`
            : `${planet.dayHours.toLocaleString("en-US")} HOURS`;
        const yearText =
          planet.yearDays === 0
            ? "0 DAYS"
            : `${planet.yearDays.toLocaleString("en-US")} DAYS`;

        const isSelected = planet.key === selected;
        const arrowChar = PLANET_ARROW[planet.key];

        const overlayStyle: CSSProperties = {
          ...overlayItemStyleBase,
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          opacity: isSelected ? 1 : 0.9,
          background: isSelected
            ? "linear-gradient(135deg, rgba(18, 36, 92, 0.96), rgba(4, 10, 32, 0.96))"
            : "linear-gradient(135deg, rgba(4, 10, 32, 0.75), rgba(2, 6, 20, 0.72))",
          border: "1px solid transparent",
          boxShadow: isSelected
            ? "0 0 24px rgba(45, 127, 255, 0.75)"
            : "0 0 12px rgba(0, 0, 0, 0.85)",
          padding: 12,
          borderRadius: 18,
          transition:
            "background-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
          pointerEvents: "auto",
          cursor: "pointer",
        };

        return (
          <div
            key={planet.key}
            style={overlayStyle}
            onClick={() => onSelect(planet.key)}
          >
            <div style={overlayNameStyle}>{planet.label}</div>
            <div style={overlayStatsStyle}>
              <div>
                TILT <span style={{ opacity: 0.35 }}>──────────</span>{" "}
                <span
                  style={{
                    display: "inline-block",
                    fontWeight: 800,
                    fontSize: 22,
                    marginRight: 6,
                    fontFamily:
                      "Gotham, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                  }}
                >
                  {arrowChar}
                </span>
                <span>{tiltText}</span>
              </div>
              <div>
                DAY <span style={{ opacity: 0.35 }}>──────────</span>{" "}
                <span>{dayText}</span>
              </div>
              <div>
                YEAR <span style={{ opacity: 0.35 }}>─────────</span>{" "}
                <span>{yearText}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────── هندلر اسکرول متن ───────── */
/* وقتی موس داخل این div است:
   - فقط خود div اسکرول می‌شود
   - صفحه به اسکرول پاسخ نمی‌دهد */
const handleTextWheel = (e: WheelEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const delta = e.deltaY;

  const maxScrollTop = scrollHeight - clientHeight;

  e.preventDefault();
  e.stopPropagation();

  const next = Math.min(maxScrollTop, Math.max(0, scrollTop + delta));
  el.scrollTop = next;
};

/* ───────── صفحه اصلی ───────── */
export default function Planets() {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetKey>("Earth");
  const [pauseRotation, setPauseRotation] = useState(false);

  const content = PLANET_CONTENT[selectedPlanet];

  // اسکرول مخصوص متن
  const scrollInnerRef = useRef<HTMLDivElement | null>(null);

  // هر بار سیاره عوض شد، اسکرول متن برگردد بالا
  useEffect(() => {
    if (scrollInnerRef.current) {
      scrollInnerRef.current.scrollTop = 0;
    }
  }, [selectedPlanet]);

  // غیرفعال کردن راست‌کلیک در کل این صفحه
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <section id="image-21" style={sectionStyle}>
      <div style={wrapperStyle}>
        <div style={leftPaneStyle}>
          <div style={leftInnerStyle}>
            <div style={pauseToggleWrapperStyle}>
              <label style={pauseLabelStyle}>
                <input
                  type="checkbox"
                  checked={pauseRotation}
                  onChange={(e) => setPauseRotation(e.target.checked)}
                  style={{
                    width: 14,
                    height: 14,
                    accentColor: "#2d7fff",
                    cursor: "pointer",
                  }}
                />
                <span>Rotations</span>
              </label>
            </div>

            <PlanetsCanvas
              selected={selectedPlanet}
              onSelect={setSelectedPlanet}
              paused={pauseRotation}
            />
            <PlanetsOverlay
              selected={selectedPlanet}
              onSelect={setSelectedPlanet}
            />
          </div>
        </div>

        <div style={rightPaneStyle}>
          <article style={textBlockStyle}>
            <div
              ref={scrollInnerRef}
              style={scrollInnerStyle}
              onWheel={handleTextWheel}
            >
              <h2 style={headingStyle}>{content.title}</h2>
              <p style={subheadingStyle}>Introduction</p>

              <p style={introTextStyle}>{content.intro}</p>

              <div style={imageBoxStyle}>
                <img
                  src={content.imageSrc}
                  alt={content.title}
                  style={imageStyle}
                />
              </div>

              <div
                style={bodyTextWrapperStyle}
                dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
              />

              {/* فضای خالی انتهای متن برای اسکرول نرم */}
              <div style={{ height: 1000 }} />
            </div>

            <div style={scrollIndicatorStyle} />
          </article>
        </div>
      </div>
    </section>
  );
}
