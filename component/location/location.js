import {getPlatformContext} from "../../context/platform.js";

export async function initLocation(root=document){
  const el=root.querySelector("[data-location-widget]");
  if(!el)return;
  const {community}=await getPlatformContext();
  const name=community.name||"Dalimgari";
  const detail=[community.region,community.country].filter(Boolean).join(", ");
  el.querySelector("[data-location-name]").textContent=name;
  el.querySelector("[data-location-detail]").textContent=detail||community.timezone||"—";
  const frame=el.querySelector("[data-location-map-frame]");
  const fallback=el.querySelector("[data-location-map-fallback]");
  const coordinates=el.querySelector("[data-location-coordinates]");
  const open=el.querySelector("[data-location-open]");
  const lat=Number(community.latitude),lon=Number(community.longitude);
  const valid=Number.isFinite(lat)&&Number.isFinite(lon);
  if(valid){
    const q=encodeURIComponent(lat+","+lon);
    const mapsUrl="https://www.google.com/maps/search/?api=1&query="+q;
    if(frame)frame.src="https://www.google.com/maps?q="+q+"&z=15&output=embed";
    if(open){open.href=mapsUrl;open.hidden=false;open.textContent="Open in Google Maps";}
    if(coordinates)coordinates.textContent="Google Maps · "+lat.toFixed(5)+", "+lon.toFixed(5);
  }else{
    const q=encodeURIComponent([name,community.region,community.country].filter(Boolean).join(", "));
    if(frame)frame.src="https://www.google.com/maps?q="+q+"&output=embed";
    if(open){open.href="https://www.google.com/maps/search/?api=1&query="+q;open.hidden=false;open.textContent="Search on Google Maps";}
    if(coordinates)coordinates.textContent="Set community latitude and longitude for an exact map marker.";
  }
  if(fallback)fallback.hidden=false;
}