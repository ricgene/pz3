README.md

# React mobile client

remember that this is in part version 2, and before changes ~ 5/24/25, I expect that worked...

Will hack to work without the react part for now - don't delete anything that may be useful later.


# local test 

cd pz3/client-agent/server
npm run build
npm run server
# runs on port 3000

cd pz3/client-agent/client
npm run dev
# http://localhost:5174/

# what do with lang part:
   add to lang-pz3/README.md
   source .venv_py311/bin/activate
     pip install langgraph-cli
     pip install -r requirements.txt
     pip install -U "langgraph-cli[inmem]"
   langgraph dev
   deactivate
   
   poetry run langgraph dev
   or other .venv way.



# deploy 
Make sure the _redirects file exists in your build output: 
echo "/* /index.html 200" > dist/public/_redirects
Deploy using: 
   cd pz3/lient-agent
   netlify deploy --dir=dist/public --prod
