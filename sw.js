let cache = "converter";
let version = "1.0.0";
let cacheName = `${cache}_${version}`;
let filesToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/materialize.min.css",
  "./js/materialize.min.js",
  "./js/main.js",
  "./js/idb.js",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://code.jquery.com/jquery-2.1.1.min.js",
  "https://use.fontawesome.com/releases/v5.1.0/css/solid.css",
  "https://use.fontawesome.com/releases/v5.1.0/css/fontawesome.css",
  "https://free.currencyconverterapi.com/api/v5/currencies"
];



self.addEventListener("install", event => {
  console.log("[Service Worker] installing ");

  event.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log("[Service Worker] caching all files");
      cache.addAll(filesToCache);
    }).then(() => self.skipWaiting()).catch(err => console.log("error occured while caching files: ",err))
  );
});

self.addEventListener("fetch", event => {
  console.log(event.request.url)

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      Promise.all(
        keyList.map(key => {
          if (key !== cacheName) {
            caches.delete(key);
            console.log(`deleted ${key}`)
          }
        })
      );
    })
  );
});
