import {getPlatformContext} from "../../context/platform.js";

export async function initLocation(root=document){
  const el=root.querySelector("[data-location-widget]");
  if(!el)return;
  const {community}=await getPlatformContext();
  const name=community.name||"Dalimgari";
  const detail=[community.region,community.country].filter(Boolean).join(", ");
  el.querySelector("[data-location-name]").textContent=name;
  el.querySelector("[data-location-detail]").textContent=detail||community.timezone||"—";
  const marker=el.querySelector("[data-location-marker]");
  const label=el.querySelector("[data-location-map-label]");
  const coordinates=el.querySelector("[data-location-coordinates]");
  if(label)label.textContent=name;
  const lat=Number(community.latitude);
  const lon=Number(community.longitude);
  const hasCoordinates=Number.isFinite(lat)&&Number.isFinite(lon);
  if(coordinates)coordinates.textContent=hasCoordinates ? "Latitude "+lat.toFixed(5)+" · Longitude "+lon.toFixed(5) : "Set latitude and longitude in Community settings to position the marker.";
  if(marker)marker.hidden=!hasCoordinates;
}