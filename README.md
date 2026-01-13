
  # projet_velib

  Velo station analysis

  ## Running the code

  Run `npm i` to install the dependencies.

    Run `npm run dev` to start the development server.

    ## Google/Facebook login (optional)

    Social login needs app credentials (there is no way to enable Google/Facebook without creating an OAuth app).

    1) Copy `.env.example` to `.env.local` (same folder as `package.json`).
    2) Fill in:
      - `VITE_GOOGLE_CLIENT_ID`
      - `GOOGLE_CLIENT_ID` (same value as above)
      - `VITE_FACEBOOK_APP_ID`
    3) Restart dev servers: `npm.cmd run start:all`

    Notes for Google Cloud Console:
    - Create OAuth Client ID (Web application)
    - Authorized JavaScript origins: `http://localhost:3000`
  