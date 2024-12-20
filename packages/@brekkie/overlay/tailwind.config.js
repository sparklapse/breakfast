/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "../../../node_modules/@brekkie/io/{dist,src}/**/*.svelte",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
