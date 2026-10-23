"use client";

import { useEffect, useSyncExternalStore } from "react";

export type PerformancePreference = "auto" | "lite" | "full";
const KEY = "cl:performance-mode:v1";
const SIGNAL = "cl:performance-changed";
const CHANGE = "(max-width: 767px) and (pointer: coarse)";
const REDUCE = "(prefers-reduced-motion: reduce)";

function preference():PerformancePreference {
  try {
    const p=localStorage.getItem(KEY);
    return p==="lite"||p==="full"?p:"auto";
  } catch { return "auto"; }
}
function onChange(cb:()=>void){
  window.addEventListener(SIGNAL,cb);
  window.addEventListener("storage",cb);
  const media=[matchMedia(CHANGE),matchMedia(REDUCE)];
  media.forEach(m=>m.addEventListener("change",cb));
  return ()=>{
    window.removeEventListener(SIGNAL,cb);
    window.removeEventListener("storage",cb);
    media.forEach(m=>m.removeEventListener("change",cb));
  };
}
function lite():boolean{
  if(matchMedia(REDUCE).matches)return true;
  const p=preference();
  if(p==="lite")return true;
  if(p==="full")return false;
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  return matchMedia(CHANGE).matches||!!connection?.saveData||/^(slow-2g|2g)$/.test(connection?.effectiveType??"");
}
export function useLiteMode():boolean{
  return useSyncExternalStore(onChange,lite,()=>false);
}
export function usePerformancePreference():PerformancePreference{
  return useSyncExternalStore(onChange,preference,()=>"auto");
}
export function setPerformancePreference(p:PerformancePreference):void{
  try {localStorage.setItem(KEY,p);}catch{/* browser private storage */}
  window.dispatchEvent(new Event(SIGNAL));
}
/** Align static styles with the effective performance setting. */
export function PerformanceModeSync(){
  const isLite=useLiteMode();
  useEffect(()=>{
    document.documentElement.dataset.performance=isLite?"lite":"full";
    return ()=>{delete document.documentElement.dataset.performance;};
  },[isLite]);
  return null;
}
