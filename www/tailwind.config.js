/** @type {import("tailwindcss").Config} */
export default {
  content: ["./{src,lib}/**/*.{js,jsx,ts,tsx}", "./{src,lib}/**/.lib/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};

// TODO: Setup safelists
// This means we can include a list of classes to force to be included in the build making some classes
// available for plugins to use consistently
// https://stackoverflow.com/questions/71186718/force-tailwind-to-include-some-classes-in-build-phase
