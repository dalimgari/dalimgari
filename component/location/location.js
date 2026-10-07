import {getPlatformContext} from "../../context/platform.js";

export async function initLocation(root=document){
  const el=root.querySelector("[data-location-widget]");
  if(!el)return;
  const {community}=await getPlatformContext();
  const name=community.name||"Dalimgari";
  const detail=[community.region,community.country].filter(Boolean).join(", ");
  el.querySelector("[data-location-name]").textContent=name;
  el.querySelector("[data-location-detail]").textContent=detail||community.timezone||"—";
  const map=el.querySelector("[data-location-map]");
  const label=el.querySelector("[data-location-map-label]");
  const coordinates=el.querySelector("[data-location-coordinates]");
  const lat=Number(community.latitude),lon=Number(community.longitude);
  const valid=Number.isFinite(lat)&&Number.isFinite(lon);
  if(label)label.textContent=name;
  if(coordinates)coordinates.textContent=valid?"Interactive map ready · "+lat.toFixed(5)+", "+lon.toFixed(5):"Set community latitude and longitude to enable the interactive map.";
  if(map){
    map.dataset.mapUrl=valid?"https://www.openstreetmap.org/?mlat="+encodeURIComponent(lat)+"&mlon="+encodeURIComponent(lon)+"#map=15/"+encodeURIComponent(lat)+"/"+encodeURIComponent(lon):"https://www.openstreetmap.org/search?query="+encodeURIComponent([name,community.region,community.country].filter(Boolean).join(", "));
    map.setAttribute("role","link");
    map.setAttribute("tabindex","0");
    map.setAttribute("aria-label","Open community location in OpenStreetMap");
    const open=()=>window.open(map.dataset.mapUrl,"_blank","noopener,noreferrer");
    map.addEventListener("click",open);
    map.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
  }
}