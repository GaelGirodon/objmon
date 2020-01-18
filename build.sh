#
# build.sh
#

# Install dependencies
if [ ! -d "./node_modules" ]; then
  npm install
fi

# Copy assets
assets="./web/assets"
if [ ! -d "$assets" ]; then
  mkdir -p "$assets"
else
  rm "$assets/"*
fi

cp ./node_modules/@fortawesome/fontawesome-free/js/fontawesome.min.js "$assets/"
cp ./node_modules/@fortawesome/fontawesome-free/js/solid.min.js "$assets/fontawesome.solid.min.js"
cp ./node_modules/axios/dist/axios.min.js "$assets/"
cp ./node_modules/vue/dist/vue.min.js "$assets/"
cp ./node_modules/normalize.css/normalize.css "$assets/"
cp ./node_modules/milligram/dist/milligram.min.css "$assets/"
