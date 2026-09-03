import { useEffect, useRef, useState } from 'react';
import type { Slide, SlideMaster } from '../types';
import { SlideRenderer } from './SlideRenderer';

const BASE_W=960;
const BASE_H=540;

export function SlideThumbnail({slide,master,assets,slideNumber,total}:{slide:Slide;master?:SlideMaster;assets:Record<string,string>;slideNumber:number;total:number}){
  const viewport=useRef<HTMLDivElement>(null);
  const [scale,setScale]=useState(.12);
  useEffect(()=>{
    const node=viewport.current;if(!node)return;
    const update=()=>{const r=node.getBoundingClientRect();setScale(Math.max(.01,Math.min(r.width/BASE_W,r.height/BASE_H)));};
    update();
    const ro=new ResizeObserver(update);ro.observe(node);return()=>ro.disconnect();
  },[]);
  return <div className="thumb-render-fixed" ref={viewport}><div className="thumb-render-stage" style={{width:BASE_W,height:BASE_H,transform:`scale(${scale})`}}><SlideRenderer slide={slide} master={master} assets={assets} slideNumber={slideNumber} total={total}/></div></div>;
}
