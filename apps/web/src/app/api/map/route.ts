import { env } from "~/env";

export function GET() {
  const key = env.GOOGLE_MAPS_WEB_KEY;
  if (!key)
    return new Response("Google Maps JavaScript is not configured.", {
      status: 503,
    });

  const script = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=marker&loading=async&callback=initializeRideMateMap`;
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RideMate ride map</title>
  <style>html,body,#map{height:100%;margin:0}body{font-family:system-ui}</style>
</head>
<body>
<div id="map"></div>
<script>
  const send = (message) => window.ReactNativeWebView?.postMessage(JSON.stringify(message));
  const coordinate = (point) => ({lat: point.latitude, lng: point.longitude});
  window.gm_authFailure = () => send({type:"error"});
  window.initializeRideMateMap = () => {
    const map = new google.maps.Map(document.getElementById("map"), {
      center: {lat: 25.16, lng: 75.81}, zoom: 13, mapId:"DEMO_MAP_ID",
      mapTypeControl:false, streetViewControl:false, fullscreenControl:false,
      gestureHandling:"greedy",
    });
    let markers = [];
    let line;
    let centered = false;
    let lastFocus;
    map.addListener("click", (event) => send({type:"pin",latitude:event.latLng.lat(),longitude:event.latLng.lng()}));
    window.setRideMateMap = ({center, markers: pins, route, focus}) => {
      for (const marker of markers) marker.map = null;
      if (line) line.setMap(null);
      markers = pins.map((pin) => new google.maps.marker.AdvancedMarkerElement({
        map, position:coordinate(pin), title:pin.label,
      }));
      if (route.length > 1) line = new google.maps.Polyline({map,path:route.map(coordinate),strokeColor:"#176447",strokeWeight:5});
      if (focus && focus !== lastFocus && pins.length + route.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        [...route,...pins].forEach((point) => bounds.extend(coordinate(point)));
        map.fitBounds(bounds,36);
      } else if (!centered && center) {
        map.setCenter(coordinate(center));
        centered = true;
      }
      lastFocus = focus;
    };
    send({type:"ready"});
  };
</script>
<script async src="${script}"></script>
</body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
