README.md

# description react mobile client - v2 prizm


# 
cd pz2/client-agent/server
npm run build

# test
npm run dev
# or 
npm run server

#runs on 3000

# ----- client ----
cd pz2/client-agent/client
 npm run dev

http://localhost:5174/


# deploy 
Make sure the _redirects file exists in your build output: echo "/* /index.html 200" > dist/public/_redirects
Deploy using: netlify deploy --dir=dist/public --prod
