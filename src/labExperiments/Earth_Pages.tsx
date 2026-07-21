// src/labExperiments/Earth_Pages.tsx
import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import * as THREE from "three";
import * as Matter from "matter-js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const earthColorTextureUrl = "/src/labExperiments/assets/textures/earth_texture/earth_color.jpg";
const earthNightTextureUrl = "/src/labExperiments/assets/textures/earth_texture/earth_nightlights_10K.jpg";
const earthCloudsTextureUrl = "/src/labExperiments/assets/textures/earth_texture/earth_clouds_8K.jpg";
const earthSpecularTextureUrl = "/src/labExperiments/assets/textures/earth_texture/specular_map%208k.jpg";
const earthTopographyTextureUrl = "/src/labExperiments/assets/textures/earth_texture/topography_5k.jpg";
const earthCloudyTextureUrl = "/src/labExperiments/assets/textures/earth_texture/cloudy_earth.jpg";

const EarthCutsScene = (() => {
// src/images/Image_13_Earthe_Cut.tsx

const SCREEN_OFFSET = { x: 1.0, y: 0.0, z: 0.0 };
const VIEW_SHIFT_PX = 650;
const MENU_OFFSET = { x: -1000, y: -10 };

const RED_AREA = { x: 264, y: 500, w: 600, h: 300 };
const SHOW_RED_DEBUG = false;
const TEXTBOX_INSET = 12;

const TEXT_POS = { dx: 0, dy: 0 };
const TITLE_STYLE = { size: 38, weight: 800 };
const BODY_STYLE = { size: 26, weight: 400, line: 1.6 };

const GOTHAM_STACK = `Gotham, "Gotham Book", "Gotham Medium", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const TEXT_CFG = {
  h1: <h1>The shape <br/> of the Earth</h1>,
  body: `The shape of the Earth is bulging at the Equator and flattened at the poles. This special shape of the Earth is called a geoid. The distance from the Equator to the Earth's center is about 21 km greater than the distance from the poles to the center. Therefore, the Equator is farther from the Earth's center compared to the poles. This means that the gravitational force acting on an object is stronger at the poles than at the Equator.`,
  h1Size: 36,
  bodySize: 16,
  lineHeight: 1.6,
  weightH1: 700,
  weightBody: 400,
  maxLines: 12,
};

const UI = { sliderBlue: "#2e7cff" };

const LABELS = { cut:"EARTH CUT", sunAz:"SUN X", sunEl:"SUN Y", clouds:"CLOUDS", move:"MOVEMENT" };
const TEX = {
  day:earthColorTextureUrl,
  night:earthNightTextureUrl,
  clouds:earthCloudsTextureUrl,
  specular:earthSpecularTextureUrl,
  bump:earthTopographyTextureUrl,
};
const P = {
  R:1, segW:128, segH:64,
  camFov:45, camPos:new THREE.Vector3(0,0.6,3),
  minDist:1.2, maxDist:8,
  rotEarthY:0.003, rotCloudsY:0.0036,
  hemiSky:0x5a7cff, hemiGround:0x0b0c1c, hemiIntensity:0.35,
  bg:"#020410",
  sunRadius:36, sunIntensity:2.2, sunColor:0xffffff,
  sunAzMinDeg:-120, sunAzMaxDeg:+120, sunAzInitDeg:70,
  sunElMinDeg:-90,  sunElMaxDeg:+90,  sunElInitDeg:10,
};
const LINE = { color:0x00ffff, radius:0.01 };
const TEXT_STR="6.357 km", TEXT_STR_AB="6.378 km";
const TEXT_SIZE_WORLD=0.27, TEXT_FONT_PX=70, TEXT_FONT_PX_AB=11, TEXT_STROKE_PX=1;
const TEXT_COLOR="#f01695ff", TEXT_STROKE="rgba(0,0,0,0.7)";
const TEXT_Y_OFFSET_WORLD=0.0, TEXT_X_OFFSET_WORLD=-0.15;
const AB_LEN=1.0, AB_AZ_DEG=90;
const abDirFromAz=()=>{ const a=THREE.MathUtils.degToRad(AB_AZ_DEG); return new THREE.Vector3(Math.cos(a),0,Math.sin(a)); };

const LABEL_GAP_V = 0.06;
const LABEL_GAP_H = 0.06;

function Image_06() {
  const hostRef = useRef<HTMLDivElement|null>(null);
  const cutRef=useRef<HTMLInputElement|null>(null);
  const sunAzRef=useRef<HTMLInputElement|null>(null);
  const sunElRef=useRef<HTMLInputElement|null>(null);
  const cloudsChkRef=useRef<HTMLInputElement|null>(null);
  const moveChkRef=useRef<HTMLInputElement|null>(null);

  const sunRef=useRef<THREE.DirectionalLight|null>(null);
  const sunTargetRef=useRef<THREE.Object3D|null>(null);

  const coreLineRef=useRef<THREE.Mesh|null>(null);
  const textRef=useRef<THREE.Sprite|null>(null);
  const abLineRef=useRef<THREE.Mesh|null>(null);
  const abTextRef=useRef<THREE.Sprite|null>(null);
  const cloudsMeshRef=useRef<THREE.Mesh|null>(null);
  const rotationOnRef=useRef<boolean>(true);
  const isVisible = true;

  useEffect(()=>{
    const host = hostRef.current;
    if (!host || !isVisible) return;
    const w=host.clientWidth, h=host.clientHeight;

    const renderer=new THREE.WebGLRenderer({antialias:true, alpha:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(w,h);
    renderer.setClearColor(P.bg,1);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.0;
    renderer.localClippingEnabled=true;
    host.appendChild(renderer.domElement);

    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(P.camFov, w/h, 0.1, 300);
    camera.position.copy(P.camPos);

    const controls=new OrbitControls(camera, renderer.domElement);
    controls.enablePan=false;
    controls.minDistance=P.minDist;
    controls.maxDistance=P.maxDist;
    controls.target.set(0,0,0);
    controls.update();

    scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiIntensity));

    const sun=new THREE.DirectionalLight(P.sunColor, P.sunIntensity);
    const sunTarget=new THREE.Object3D(); scene.add(sunTarget);
    sun.target=sunTarget; scene.add(sun); sunRef.current=sun; sunTargetRef.current=sunTarget;

    {
      const N = 4000, R = 90, pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(R * (0.8 + 0.2 * Math.random()));
        pos.set([v.x, v.y, v.z], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({ size: 0.06, sizeAttenuation: true, color: 0xffffff, depthWrite: false });
      scene.add(new THREE.Points(g, m));
    }

    const pX=new THREE.Plane(new THREE.Vector3(+1,0,0), P.R);
    const pY=new THREE.Plane(new THREE.Vector3(0,-1,0), P.R);
    const pZ=new THREE.Plane(new THREE.Vector3(0,0,-1), P.R);

    const earthMat=new THREE.MeshPhongMaterial({color:0xffffff, shininess:18, specular:0x335577, reflectivity:0.2, dithering:true, emissiveIntensity:1.0});
    (earthMat as any).onBeforeCompile=(shader:any)=>{
      shader.uniforms.uSunDir={value:new THREE.Vector3(1,0,0)};
      (earthMat as any).userData.shader=shader;
      shader.fragmentShader=shader.fragmentShader
        .replace("void main() {",`uniform vec3 uSunDir; void main(){`)
        .replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );",`
          vec3 sunDirV=normalize((viewMatrix*vec4(uSunDir,0.0)).xyz);
          vec3 N=normalize(normal);
          float ndotl=dot(N,sunDirV);
          float night=smoothstep(0.15,0.35,clamp(-ndotl,0.0,1.0));
          outgoingLight=(outgoingLight-totalEmissiveRadiance)+totalEmissiveRadiance*night;
          gl_FragColor=vec4(outgoingLight, diffuseColor.a);
        `);
    };
    const cloudsMat=new THREE.MeshPhongMaterial({transparent:true, opacity:0.9, depthWrite:false, blending:THREE.AdditiveBlending, color:0xffffff});
    const rimMat=new THREE.ShaderMaterial({
      side:THREE.BackSide, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:`varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:`varying vec3 vN; void main(){ float i=pow(clamp(1.0 - vN.z,0.0,1.0),4.0); gl_FragColor=vec4(0.25,0.55,1.0,1.0)*i*0.25; }`,
    });
    const mantleMat=new THREE.MeshStandardMaterial({color:0x9c6b2e, metalness:0.05, roughness:0.8});
    const outerCoreMat=new THREE.MeshStandardMaterial({color:0xe0a14a, metalness:0.08, roughness:0.7});
    const innerCoreMat=new THREE.MeshStandardMaterial({color:0xffd37a, metalness:0.1, roughness:0.6});

    const loader=new THREE.TextureLoader();
    loader.load(TEX.day, (t)=>{ t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; (earthMat as any).map=t; earthMat.needsUpdate=true; });
    const nightTex=loader.load(TEX.night,(t)=>{ t.colorSpace=THREE.SRGBColorSpace; });
    (earthMat as any).emissive=new THREE.Color(0xffffff); (earthMat as any).emissiveMap=nightTex;
    loader.load(TEX.specular,(t)=>{ t.colorSpace=THREE.LinearSRGBColorSpace; (earthMat as any).specularMap=t; earthMat.needsUpdate=true; });
    loader.load(TEX.bump,(t)=>{ t.colorSpace=THREE.LinearSRGBColorSpace; (earthMat as any).bumpMap=t; (earthMat as any).bumpScale=0.045; earthMat.needsUpdate=true; });
    loader.load(TEX.clouds,(t)=>{ t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; (cloudsMat as any).map=t; cloudsMat.needsUpdate=true; });

    const earthGroup=new THREE.Group(); scene.add(earthGroup);
    const earth=new THREE.Mesh(new THREE.SphereGeometry(P.R,P.segW,P.segH), earthMat);
    const clouds=new THREE.Mesh(new THREE.SphereGeometry(P.R*1.012,P.segW,P.segH), cloudsMat);
    const rim   =new THREE.Mesh(new THREE.SphereGeometry(P.R*1.06,64,32), rimMat);
    const mantle   =new THREE.Mesh(new THREE.SphereGeometry(P.R*0.82,96,48), mantleMat);
    const outerCore=new THREE.Mesh(new THREE.SphereGeometry(P.R*0.55,96,48), outerCoreMat);
    const innerCore=new THREE.Mesh(new THREE.SphereGeometry(P.R*0.32,96,48), innerCoreMat);
    earthGroup.add(earth, clouds, rim, mantle, outerCore, innerCore);
    cloudsMeshRef.current=clouds;

    const baseVec = camera.position.clone().sub(controls.target).normalize();
    const baseDist0 = camera.position.distanceTo(controls.target);
    const applyScreenOffset = () => {
      const xAxis=new THREE.Vector3(), yAxis=new THREE.Vector3(), zAxis=new THREE.Vector3();
      camera.matrixWorld.extractBasis(xAxis, yAxis, zAxis);
      const dist = Math.max(P.minDist, Math.min(P.maxDist, baseDist0 - SCREEN_OFFSET.z));
      const pivot = controls.target.clone();
      const camPos = pivot.clone().addScaledVector(baseVec, dist);
      camPos.addScaledVector(xAxis, SCREEN_OFFSET.x);
      camPos.addScaledVector(yAxis, SCREEN_OFFSET.y);
      camera.position.copy(camPos);
      camera.lookAt(pivot);
      controls.update();
    };
    applyScreenOffset();

    const applyViewShift = () => {
      const fullW = renderer.domElement.width / renderer.getPixelRatio();
      const fullH = renderer.domElement.height / renderer.getPixelRatio();
      camera.setViewOffset(fullW, fullH, -VIEW_SHIFT_PX, 0, fullW, fullH);
    };
    applyViewShift();

    const raycaster=new THREE.Raycaster(); const ndc=new THREE.Vector2();
    const hoverOnEarthRef={current:false};
    const pickables:[THREE.Object3D,THREE.Object3D]=[earth, clouds];
    const updateHover=(clientX:number, clientY:number)=>{
      const rect=renderer.domElement.getBoundingClientRect();
      ndc.set(((clientX-rect.left)/rect.width)*2-1, -((clientY-rect.top)/rect.height)*2+1);
      raycaster.setFromCamera(ndc, camera);
      hoverOnEarthRef.current=raycaster.intersectObjects(pickables,false).length>0;
    };
    const onPointerMove=(e:PointerEvent)=>updateHover(e.clientX,e.clientY);
    const onWheelCapture=(e:WheelEvent)=>{ updateHover((e as any).clientX??0,(e as any).clientY??0); (controls as any).enableZoom=hoverOnEarthRef.current; if(hoverOnEarthRef.current) e.preventDefault(); };
    renderer.domElement.addEventListener("pointermove", onPointerMove, {passive:true});
    renderer.domElement.addEventListener("wheel", onWheelCapture, {capture:true, passive:false});

    const cylGeom=new THREE.CylinderGeometry(LINE.radius,LINE.radius,1,16);
    const cylMat =new THREE.MeshBasicMaterial({color:LINE.color, depthTest:false, depthWrite:false});
    const makeTextSpriteV=(txt:string)=>{
      const c=document.createElement("canvas"); const ctx0=c.getContext("2d")!;
      ctx0.font=`${TEXT_FONT_PX}px ${GOTHAM_STACK}`; const w=Math.ceil(ctx0.measureText(txt).width), h=TEXT_FONT_PX, pad=24;
      c.width=h+pad*2; c.height=w+pad*2; const ctx=c.getContext("2d")!;
      ctx.translate(c.width/2,c.height/2); ctx.rotate(-Math.PI/2);
      ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.font=`${TEXT_FONT_PX}px ${GOTHAM_STACK}`;
      if (TEXT_STROKE_PX>0){ ctx.strokeStyle=TEXT_STROKE; ctx.lineWidth=TEXT_STROKE_PX; ctx.strokeText(txt,0,0); }
      ctx.fillStyle=TEXT_COLOR; ctx.fillText(txt,0,0);
      const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
      const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false,opacity:0});
      const s=new THREE.Sprite(mat); const aspect=c.width/c.height; s.scale.set(TEXT_SIZE_WORLD*aspect, TEXT_SIZE_WORLD, 1); s.visible=false; return s;
    };
    const makeTextSpriteH=(txt:string)=>{
      const c=document.createElement("canvas"); const ctx0=c.getContext("2d")!;
      ctx0.font=`${TEXT_FONT_PX_AB}px ${GOTHAM_STACK}`; const w=Math.ceil(ctx0.measureText(txt).width), h=TEXT_FONT_PX_AB, pad=24;
      const scale=4; c.width=(w+pad*2)*scale; c.height=(h+pad*2)*scale; const ctx=c.getContext("2d")!;
      ctx.scale(scale,scale); ctx.translate((c.width/scale)/2,(c.height/scale)/2);
      ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.font=`${TEXT_FONT_PX_AB}px ${GOTHAM_STACK}`;
      if (TEXT_STROKE_PX>0){ ctx.strokeStyle=TEXT_STROKE; ctx.lineWidth=TEXT_STROKE_PX; ctx.strokeText(txt,0,0); }
      ctx.fillStyle=TEXT_COLOR; ctx.fillText(txt,0,0);
      const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
      const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false,opacity:0});
      const s=new THREE.Sprite(mat); const aspect=c.width/c.height; s.scale.set(TEXT_SIZE_WORLD*aspect, TEXT_SIZE_WORLD, 1); s.visible=false; return s;
    };

    const coreLine=new THREE.Mesh(cylGeom,cylMat); coreLine.visible=false; earthGroup.add(coreLine); coreLineRef.current=coreLine;

    const textSprite=makeTextSpriteV(TEXT_STR);
    textSprite.position.set(TEXT_X_OFFSET_WORLD + LABEL_GAP_V, P.R*0.5 + TEXT_Y_OFFSET_WORLD, 0);
    earthGroup.add(textSprite); textRef.current=textSprite;

    const abLine=new THREE.Mesh(cylGeom,cylMat); abLine.visible=false; earthGroup.add(abLine); abLineRef.current=abLine;

    const abText=makeTextSpriteH(TEXT_STR_AB);
    { const base = P.R*0.5*THREE.MathUtils.clamp(AB_LEN,0,1);
      abText.position.copy(abDirFromAz().multiplyScalar(base + LABEL_GAP_H));
    }
    earthGroup.add(abText); abTextRef.current=abText;

    const mats:[THREE.Material,...THREE.Material[]]=[earthMat, cloudsMat, rimMat, mantleMat, outerCoreMat, innerCoreMat];

    const cStart=P.R/Math.sqrt(3);
    const setCutAmount=(t:number)=>{
      const tt=THREE.MathUtils.clamp(t,0,1);
      if(tt<=0.0001){ mats.forEach((m:any)=>{ (m as any).clippingPlanes=[]; m.needsUpdate=true; }); }
      else{
        const c=cStart*(1-tt);
        (pX as any).constant=c; (pY as any).constant=c; (pZ as any).constant=c;
        mats.forEach((m:any)=>{ (m as any).clippingPlanes=[pX,pY,pZ]; (m as any).clipIntersection=true; m.needsUpdate=true; });
      }
      if(coreLineRef.current){ const H=P.R*tt, m=coreLineRef.current; m.visible=tt>0.0001; m.scale.set(1,H,1); m.position.set(0,H*0.5,0); }
      if(abLineRef.current){ const dir=abDirFromAz().normalize(); const L=P.R*THREE.MathUtils.clamp(AB_LEN,0,1)*tt;
        const m=abLineRef.current; m.visible=tt>0.0001; m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
        m.scale.set(1,L,1); m.position.copy(dir.clone().multiplyScalar(L*0.5)); }
      const vis=tt>0.001;
      if(textRef.current){ const mat=textRef.current.material as THREE.SpriteMaterial; textRef.current.visible=vis; mat.opacity=tt; }
      if(abTextRef.current){
        const mat2=abTextRef.current.material as THREE.SpriteMaterial; abTextRef.current.visible=vis; mat2.opacity=tt;
        const base = P.R*0.5*THREE.MathUtils.clamp(AB_LEN,0,1);
        abTextRef.current.position.copy(abDirFromAz().multiplyScalar(base + LABEL_GAP_H));
      }
    };

    const setSunByTE=(tAz:number,tEl:number)=>{
      const azDeg=THREE.MathUtils.lerp(P.sunAzMinDeg,P.sunAzMaxDeg,THREE.MathUtils.clamp(tAz,0,1));
      const elDeg=THREE.MathUtils.lerp(P.sunElMinDeg,P.sunElMaxDeg,THREE.MathUtils.clamp(tEl,0,1));
      const az=THREE.MathUtils.degToRad(azDeg), el=THREE.MathUtils.degToRad(elDeg);
      const r=P.sunRadius, cosEl=Math.cos(el);
      const x=r*cosEl*Math.cos(az), y=r*Math.sin(el), z=r*cosEl*Math.sin(az);
      if(sunRef.current && sunTargetRef.current){
        sunRef.current.position.set(x,y,z);
        sunTargetRef.current.position.set(0,0,0);
        sunTargetRef.current.updateMatrixWorld();
        sunRef.current.target=sunTargetRef.current;
        sunRef.current.updateMatrixWorld();
      }
    };

    const tAz0=(P.sunAzInitDeg-P.sunAzMinDeg)/(P.sunAzMaxDeg-P.sunAzMinDeg);
    const tEl0=(P.sunElInitDeg-P.sunElMinDeg)/(P.sunElMaxDeg-P.sunElMinDeg);
    setCutAmount(0); setSunByTE(tAz0,tEl0);

    const onResize=()=>{ const nw=host.clientWidth, nh=host.clientHeight; renderer.setSize(nw,nh); camera.aspect=nw/nh; camera.updateProjectionMatrix(); applyScreenOffset(); applyViewShift(); };
    window.addEventListener("resize", onResize);

    let raf=0;
    const loop=()=>{ raf=requestAnimationFrame(loop);
      if((earthMat as any).userData?.shader && sunRef.current){ const sh=(earthMat as any).userData.shader; sh.uniforms.uSunDir.value.copy(sunRef.current.position).normalize(); }
      if(rotationOnRef.current){ earth.rotation.y+=P.rotEarthY; if(cloudsMeshRef.current) cloudsMeshRef.current.rotation.y+=P.rotCloudsY; }
      renderer.render(scene,camera);
    };
    loop();

    const applyCut=()=>setCutAmount(parseFloat(cutRef.current?.value||"0"));
    if(cutRef.current){ cutRef.current.oninput=applyCut; cutRef.current.step="0.01"; cutRef.current.value="0"; }
    const applySun=()=>{ const tAz=parseFloat(sunAzRef.current?.value||String(tAz0)); const tEl=parseFloat(sunElRef.current?.value||String(tEl0)); setSunByTE(tAz,tEl); };
    if(sunAzRef.current){ sunAzRef.current.min="0"; sunAzRef.current.max="1"; sunAzRef.current.step="0.001"; sunAzRef.current.value=String(tAz0); sunAzRef.current.oninput=applySun; }
    if(sunElRef.current){ sunElRef.current.min="0"; sunElRef.current.max="1"; sunElRef.current.step="0.001"; sunElRef.current.value=String(tEl0); sunElRef.current.oninput=applySun; }
    applyCut(); applySun();

    if(cloudsChkRef.current){
      cloudsChkRef.current.checked = true;
      cloudsChkRef.current.indeterminate = false;
      const syncClouds = () => { const on = !!cloudsChkRef.current?.checked; if (cloudsMeshRef.current) cloudsMeshRef.current.visible = on; };
      cloudsChkRef.current.onchange = syncClouds; syncClouds();
    }
    if(moveChkRef.current){
      moveChkRef.current.checked = true;
      moveChkRef.current.indeterminate = false;
      const syncMove = () => { rotationOnRef.current = !!moveChkRef.current?.checked; };
      moveChkRef.current.onchange = syncMove; syncMove();
    }

    return ()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onPointerMove as any);
      renderer.domElement.removeEventListener("wheel", onWheelCapture as any, true);
      scene.traverse((o:any)=>{ if(o.isMesh){ o.geometry?.dispose?.(); const m=o.material; if(Array.isArray(m)) m.forEach((mm:any)=>mm?.dispose?.()); else (m as any)?.dispose?.(); }});
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  },[isVisible]);

  return (
    <div ref={hostRef} style={{position:"relative",width:"100%",height:"100vh",background:P.bg,userSelect:"text",overscrollBehavior:"contain"}}>
      <style>{`
        input[type="checkbox"].bare {
          appearance: none; -webkit-appearance: none;
          width: 16px; height: 16px; border: 2px solid #fff; border-radius: 4px;
          background: transparent; display: inline-block; vertical-align: middle;
          transition: background 120ms ease, border-color 120ms ease;
        }
        input[type="checkbox"].bare:checked { background: ${UI.sliderBlue}; border-color: ${UI.sliderBlue}; }
        input[type="checkbox"].bare:focus { outline: none; box-shadow: none; }
      `}</style>

      <div style={{
        position:"absolute", right:24, bottom:24,
        transform:`translate(${MENU_OFFSET.x}px, ${-MENU_OFFSET.y}px)`,
        background:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)",
        color:"#fff", borderRadius:12, padding:"12px 14px", width:460, font:"12px/1.4 system-ui", zIndex:10,
        display:"grid", gap:10
      }}>
        <label style={{display:"grid",gap:6}}>
          <span>{LABELS.cut}</span>
          <input ref={cutRef} type="range" min={0} max={1} step={0.01} defaultValue={0}/>
        </label>
        <label style={{display:"grid",gap:6}}>
          <span>{LABELS.sunAz}</span>
          <input ref={sunAzRef} type="range" min={0} max={1} step={0.001}
                 defaultValue={(P.sunAzInitDeg-P.sunAzMinDeg)/(P.sunAzMaxDeg-P.sunAzMinDeg)}/>
        </label>
        <label style={{display:"grid",gap:6}}>
          <span>{LABELS.sunEl}</span>
          <input ref={sunElRef} type="range" min={0} max={1} step={0.001}
                 defaultValue={(P.sunElInitDeg-P.sunElMinDeg)/(P.sunElMaxDeg-P.sunElMinDeg)}/>
        </label>
        <div style={{display:"flex",gap:16,alignItems:"center",justifyContent:"space-between",marginTop:2}}>
          <label style={{display:"flex",alignItems:"center",gap:8}}>
            <input className="bare" ref={cloudsChkRef} type="checkbox" defaultChecked />
            <span>{LABELS.clouds}</span>
          </label>
          <label style={{display:"flex",alignItems:"center",gap:8}}>
            <input className="bare" ref={moveChkRef} type="checkbox" defaultChecked />
            <span>{LABELS.move}</span>
          </label>
        </div>
      </div>

      {SHOW_RED_DEBUG && (
        <div
          style={{
            position:"absolute",
            left: RED_AREA.x, top: RED_AREA.y, width: RED_AREA.w, height: RED_AREA.h,
            outline: "2px solid #ff0033", borderRadius: 12, pointerEvents:"none", zIndex:9
          }}
        />
      )}

      <div
        style={{
          position:"absolute",
          left: RED_AREA.x + RED_AREA.w / 2 + TEXT_POS.dx,
          top:  RED_AREA.y + RED_AREA.h / 2 + TEXT_POS.dy,
          transform: "translate(-50%, -50%)",
          width: Math.max(0, RED_AREA.w - TEXTBOX_INSET * 2),
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(6px)",
          color:"#fff",
          borderRadius:12,
          padding:"14px 16px",
          zIndex:10,
          boxSizing:"border-box",
          fontFamily: GOTHAM_STACK,
        }}
      >
        <div style={{ fontWeight: TITLE_STYLE.weight, fontSize: TITLE_STYLE.size, lineHeight: 1.25, marginBottom: 10 }}>
          {TEXT_CFG.h1}
        </div>
        <div style={{ fontWeight: BODY_STYLE.weight, fontSize: BODY_STYLE.size, lineHeight: BODY_STYLE.line }}>
          {TEXT_CFG.body}
        </div>
      </div>
    </div>
  );
}

  return Image_06;
})();

const GravityOnPlanetsScene = (() => {
// src/images/Image_10_Gravity_on_Planets.tsx

type PlanetKey =
  | "Sun"
  | "Mercury"
  | "Venus"
  | "Earth"
  | "Moon"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto";

interface PlanetData {
  key: PlanetKey;
  name: string;
  gravity: number; // m/s²
  color: string;
  atmosphereColor: string;
  description: string;
  texture: string;
}

/* ---------- CONSTS ---------- */
const GROUND_BODY_HEIGHT = 320;
const GROUND_VISUAL_HEIGHT = 120;
const EARTH_G = 9.81;
const PHYSICS_TIME_SCALE = 0.45;
const SAFE_TOP = 80;
const SAFE_BOTTOM_OFFSET = GROUND_VISUAL_HEIGHT + 40;
const LEFT_COLUMN_WIDTH = 260;
const RIGHT_PANEL_WIDTH = 280;

// [POOL SETTINGS]
// EXACTLY 100 Bags. No more, no less.
const MAX_POOL_SIZE = 100;

const PLANETS: PlanetData[] = [
  {
    key: "Sun",
    name: "Sun",
    gravity: 274.0,
    color: "#FDB813",
    atmosphereColor: "rgba(253,184,19,0.45)",
    description: "The star at the center of our Solar System. Gravity is crushing.",
    texture: "/solar_texture/2k_sun.jpg",
  },
  {
    key: "Mercury",
    name: "Mercury",
    gravity: 3.7,
    color: "#A5A5A5",
    atmosphereColor: "rgba(165,165,165,0.25)",
    description: "The smallest planet, with gravity similar to Mars.",
    texture: "/solar_texture/MERCURY_texture.jpg",
  },
  {
    key: "Venus",
    name: "Venus",
    gravity: 8.87,
    color: "#E3BB76",
    atmosphereColor: "rgba(227,187,118,0.45)",
    description: "Thick atmosphere and high pressure, slightly less gravity than Earth.",
    texture: "/solar_texture/Venus.jpg",
  },
  {
    key: "Earth",
    name: "Earth",
    gravity: 9.81,
    color: "#22A6B3",
    atmosphereColor: "rgba(34,166,179,0.45)",
    description: "Our home. The standard for 1g.",
    texture: earthCloudyTextureUrl,
  },
  {
    key: "Moon",
    name: "Moon",
    gravity: 1.62,
    color: "#CFCFCF",
    atmosphereColor: "rgba(255,255,255,0.18)",
    description: "Earth's only natural satellite. One-sixth of Earth's gravity.",
    texture: "/solar_texture/2k_moon.jpg",
  },
  {
    key: "Mars",
    name: "Mars",
    gravity: 3.71,
    color: "#DD4C22",
    atmosphereColor: "rgba(221,76,34,0.42)",
    description: "The Red Planet. Low gravity allows for massive volcanoes.",
    texture: "/solar_texture/2k_mars.jpg",
  },
  {
    key: "Jupiter",
    name: "Jupiter",
    gravity: 24.79,
    color: "#D8CA9D",
    atmosphereColor: "rgba(216,202,157,0.4)",
    description: "The gas giant. Massive gravity, over 2.5x that of Earth.",
    texture: "/solar_texture/2k_jupiter.jpg",
  },
  {
    key: "Saturn",
    name: "Saturn",
    gravity: 10.44,
    color: "#EAD6B8",
    atmosphereColor: "rgba(234,214,184,0.4)",
    description: "Famous for its rings. Gravity is surprisingly close to Earth's.",
    texture: "/solar_texture/2k_saturn.jpg",
  },
  {
    key: "Uranus",
    name: "Uranus",
    gravity: 8.69,
    color: "#D1F7FF",
    atmosphereColor: "rgba(209,247,255,0.45)",
    description: "An ice giant with a distinct tilt. Slightly less gravity than Earth.",
    texture: "/solar_texture/2k_uranus.jpg",
  },
  {
    key: "Neptune",
    name: "Neptune",
    gravity: 11.15,
    color: "#5B5DDF",
    atmosphereColor: "rgba(91,93,223,0.45)",
    description: "The windiest planet. Heavy gravity for an ice giant.",
    texture: "/solar_texture/2k_neptune.jpg",
  },
  {
    key: "Pluto",
    name: "Pluto",
    gravity: 0.62,
    color: "#968570",
    atmosphereColor: "rgba(150,133,112,0.28)",
    description: "A dwarf planet in the Kuiper Belt. Extremely low gravity.",
    texture: "/solar_texture/PlutoColour.jpg",
  },
];

const TRASH_TEXTURES: string[] = [
  "/TrashBag (1).png",
  "/TrashBag (2).png",
  "/TrashBag (3).png",
  "/TrashBag (4).png",
  "/TrashBag (5).png",
  "/TrashBag (6).png",
];

/* ---------- STYLES ---------- */

const rootStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  backgroundColor: "#050b22",
  color: "#ffffff",
  overflow: "hidden",
  fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const starsLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  overflow: "hidden",
};

const starsPattern: CSSProperties = {
  position: "absolute",
  width: "100%",
  height: "100%",
  opacity: 0.9,
  backgroundImage: "url(/solar_texture/2k_stars_milky_way.jpg)",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const gradientOverlay: CSSProperties = {
  position: "absolute",
  width: "100%",
  height: "100%",
  background:
    "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 40%, rgba(0,0,0,0.7))",
};

const hudStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  padding: "24px 32px 0 32px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  zIndex: 20,
  pointerEvents: "none",
};

const hudLeftStyle: CSSProperties = {
  pointerEvents: "auto",
};

const titleStyle: CSSProperties = {
  fontSize: 42,
  fontWeight: 900,
  letterSpacing: "0.20em",
  textTransform: "uppercase",
  color: "#ffffff",
  textShadow: "0 0 22px rgba(255,255,255,0.65)",
};

const resetButtonStyle: CSSProperties = {
  pointerEvents: "auto",
  padding: 8,
  borderRadius: 999,
  background: "rgba(15,23,42,0.7)",
  border: "1px solid rgba(255,255,255,0.35)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 0 18px rgba(255,255,255,0.35)",
};

const mainCanvasStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 10,
  pointerEvents: "none", // دوباره غیرفعال؛ فقط برای رندر
};

// لایه‌ی کلیک شفاف روی صحنه (فقط کلیک، اسکرول آزاد)
const clickOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 15,
  pointerEvents: "auto",
  background: "transparent",
};

const groundOverlayBase: CSSProperties = {
  position: "absolute",
  left: 0,
  bottom: 0,
  width: "100%",
  height: GROUND_VISUAL_HEIGHT,
  zIndex: 5,
  pointerEvents: "none",
};

// LEFT COLUMN
const leftColumnWrapper: CSSProperties = {
  position: "absolute",
  left: 40,
  top: SAFE_TOP,
  bottom: SAFE_BOTTOM_OFFSET,
  width: LEFT_COLUMN_WIDTH,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "stretch",
  zIndex: 25,
  pointerEvents: "none",
};

const leftPlanetCircle: CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  borderRadius: "999px",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 0 40px rgba(0,0,0,0.85)",
  border: "2px solid rgba(229,231,235,0.9)",
};

const leftPlanetTexture: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const leftPlanetLight: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.75), transparent 55%)",
  mixBlendMode: "screen",
};

const leftPlanetShade: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 75% 80%, rgba(15,23,42,0.8), transparent 60%)",
};

const leftPlanetName: CSSProperties = {
  marginTop: 16,
  textAlign: "center",
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const infoPanelBox: CSSProperties = {
  width: "100%",
  background: "rgba(15,23,42,0.88)",
  backdropFilter: "blur(28px)",
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.9)",
  padding: 20,
  boxShadow: "0 22px 60px rgba(15,23,42,0.95)",
  pointerEvents: "auto",
};

// RIGHT PANEL
const sidePanelWrapper: CSSProperties = {
  position: "absolute",
  right: 40,
  top: SAFE_TOP,
  bottom: SAFE_BOTTOM_OFFSET,
  width: RIGHT_PANEL_WIDTH,
  maxWidth: "32vw",
  zIndex: 40,
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
};

const sidePanel: CSSProperties = {
  background: "rgba(15,23,42,0.85)",
  backdropFilter: "blur(26px)",
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.7)",
  maxHeight: "100%",
  width: "100%",
  padding: "16px 12px 16px 14px",
  overflowY: "auto",
  pointerEvents: "auto",
};

const ufoWrapper: CSSProperties = {
  position: "absolute",
  top: 28,
  left: "50%",
  zIndex: 30,
};

const ufoButton: CSSProperties = {
  position: "relative",
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

/* ---------- COMPONENT ---------- */

const Image_22_Gravity_on_Planets = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const groundRef = useRef<Matter.Body | null>(null);

  // [REF] Inactive Pool: Bodies waiting to be dropped.
  const trashBagPoolRef = useRef<Matter.Body[]>([]);
  
  // [NEW REF] Active Queue: Guaranteed FIFO tracking of bodies currently in the world.
  const activeBagsQueueRef = useRef<Matter.Body[]>([]);

  const [currentPlanet, setCurrentPlanet] = useState<PlanetData>(PLANETS[3]);
  const [objectCount, setObjectCount] = useState(0);
  const [isUfoOpen, setIsUfoOpen] = useState(false);
  const [ufoOffset, setUfoOffset] = useState({ x: 0, y: 0 });

  const lastDropRef = useRef<number>(0);
  const isVisible = true;

  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", handler);
    return () => window.removeEventListener("contextmenu", handler);
  }, []);

  /* ----- Matter init ----- */
  useEffect(() => {
    if (!sceneRef.current) return;

    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const Runner = Matter.Runner;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;

    const engine = Engine.create();
    engine.timing.timeScale = PHYSICS_TIME_SCALE;
    engine.positionIterations = 4;
    engine.velocityIterations = 4;
    engineRef.current = engine;

    const { clientWidth, clientHeight } = sceneRef.current;

    const render = Render.create({
      element: sceneRef.current,
      engine,
      options: {
        width: clientWidth,
        height: clientHeight,
        background: "transparent",
        wireframes: false,
        pixelRatio:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio || 1, 1.2)
            : 1,
        showAngleIndicator: false,
      },
    });
    renderRef.current = render;

    const wallOptions = {
      isStatic: true,
      render: { visible: false },
      friction: 0.5,
      restitution: 0.2,
    };

    const visualTop = clientHeight - GROUND_VISUAL_HEIGHT;
    const groundCenterY = visualTop + GROUND_BODY_HEIGHT / 2;

    const ground = Bodies.rectangle(
      clientWidth / 2,
      groundCenterY,
      clientWidth * 2,
      GROUND_BODY_HEIGHT,
      {
        isStatic: true,
        friction: 1.0,
        restitution: 0.05,
        label: "Ground",
        render: { fillStyle: PLANETS[3].color },
      }
    );
    groundRef.current = ground;

    const leftWall = Bodies.rectangle(
      -80,
      clientHeight / 2,
      160,
      clientHeight * 4,
      wallOptions
    );
    const rightWall = Bodies.rectangle(
      clientWidth + 80,
      clientHeight / 2,
      160,
      clientHeight * 4,
      wallOptions
    );

    Composite.add(engine.world, [ground, leftWall, rightWall]);

    // --- [INIT] Fill Object Pool (Create 100 hidden bodies) ---
    if (trashBagPoolRef.current.length === 0) {
        const initialRadius = 6;
        const initialScale = 0.012 * (initialRadius / 6);
        const initialTexture = TRASH_TEXTURES[0];

        for (let i = 0; i < MAX_POOL_SIZE; i++) {
            const bag = Bodies.circle(-9999, -9999, initialRadius, {
                restitution: 0.5,
                friction: 0.7,
                frictionAir: 0.018,
                density: 0.002,
                collisionFilter: { group: 0 }, // Collide with everything
                label: "Pooled Trash Bag",
                isSleeping: true, // Start sleeping
                render: {
                    visible: true,
                    sprite: {
                        texture: initialTexture,
                        xScale: initialScale,
                        yScale: initialScale,
                    },
                },
            });
            trashBagPoolRef.current.push(bag);
        }
    }

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    Render.run(render);

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    const onResize = () => {
      if (!renderRef.current || !sceneRef.current || !groundRef.current) return;
      const { clientWidth: w, clientHeight: h } = sceneRef.current;
      renderRef.current.bounds.max.x = w;
      renderRef.current.bounds.max.y = h;
      renderRef.current.options.width = w;
      renderRef.current.options.height = h;
      renderRef.current.canvas.width = w;
      renderRef.current.canvas.height = h;

      const vTop = h - GROUND_VISUAL_HEIGHT;
      const gCenter = vTop + GROUND_BODY_HEIGHT / 2;

      Matter.Body.setPosition(groundRef.current, { x: w / 2, y: gCenter });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
      Engine.clear(engine);
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
      groundRef.current = null;
      trashBagPoolRef.current = [];
      activeBagsQueueRef.current = []; // Clear the new Queue
    };
  }, []);

  /* ----- gravity ----- */
  useEffect(() => {
    if (!engineRef.current || !groundRef.current) return;
    const rawNorm = currentPlanet.gravity / EARTH_G;
    engineRef.current.world.gravity.y = rawNorm;
    groundRef.current.render.fillStyle = currentPlanet.color;
  }, [currentPlanet]);

  /* ----- pause ----- */
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.timing.timeScale = isVisible ? PHYSICS_TIME_SCALE : 0;
  }, [isVisible]);

  /* ----- UFO float ----- */
  useEffect(() => {
    let frameId: number;
    let start: number | null = null;
    const loop = (time: number) => {
      if (start === null) start = time;
      const t = (time - start) / 1000;
      const y = Math.sin(t * 2) * 8;
      const x = Math.sin(t * 0.9) * 22 * Math.cos(t * 0.6);
      setUfoOffset({ x, y });
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  /* ----- DROP TRASH (STRICT QUEUE-DRIVEN FIFO RECYCLING) ----- */
  const dropTrash = () => {
    if (!engineRef.current || !sceneRef.current) return;

    // Fast Throttle (80ms)
    const now = performance.now();
    if (now - lastDropRef.current < 80) return; 
    lastDropRef.current = now;

    let bag: Matter.Body | undefined;
    const world = engineRef.current.world;

    if (activeBagsQueueRef.current.length < MAX_POOL_SIZE) {
        // SCENARIO 1: Below cap. Use a new one from the inactive pool.
        bag = trashBagPoolRef.current.pop();
        if (!bag) return;
        
        Matter.Composite.add(world, bag);
        activeBagsQueueRef.current.push(bag);
        setObjectCount(activeBagsQueueRef.current.length); 
    } else {
        // SCENARIO 2: At cap (100). FORCE FIFO recycling.
        bag = activeBagsQueueRef.current.shift();
        if (!bag) return;

        activeBagsQueueRef.current.push(bag);
        setObjectCount(MAX_POOL_SIZE);
    }

    const { clientWidth } = sceneRef.current;
    const ufoCenterX = clientWidth / 2 + ufoOffset.x;
    const spawnY = 28 + 190 + ufoOffset.y; 

    const x = ufoCenterX + (Math.random() * 36 - 18);
    const textureIndex = Math.floor(Math.random() * TRASH_TEXTURES.length);
    const texture = TRASH_TEXTURES[textureIndex >= 0 ? textureIndex : 0];
    const gNormReal = currentPlanet.gravity / EARTH_G;
    const restitutionBase = Math.min(0.95, 1.05 - gNormReal * 0.4); 
    const restitution = Math.max(0.1, Math.min(0.95, restitutionBase + (Math.random() - 0.5) * 0.08));

    Matter.Body.setPosition(bag, { x, y: spawnY });
    Matter.Body.setVelocity(bag, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(bag, (Math.random() - 0.5) * 0.4);
    bag.restitution = restitution;
    
    if (bag.render.sprite) {
        bag.render.sprite.texture = texture;
    }
    
    Matter.Sleeping.set(bag, false);

    const sideKick = (Math.random() - 0.5) * 0.0003;
    Matter.Body.applyForce(bag, bag.position, { x: sideKick, y: 0 });
    
    setIsUfoOpen(true);
    setTimeout(() => setIsUfoOpen(false), 200);
  };

  const resetWorld = () => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;
    
    const bagsToReset = [...activeBagsQueueRef.current];
    activeBagsQueueRef.current = [];
    
    for (const b of bagsToReset) {
        Matter.Composite.remove(world, b);
        Matter.Sleeping.set(b, true);
        trashBagPoolRef.current.push(b);
    }
    
    const otherBodies = Matter.Composite.allBodies(world);
    for (let i = otherBodies.length - 1; i >= 0; i--) {
        const b = otherBodies[i];
        if (b.label !== "Pooled Trash Bag" && b.label !== "Ground" && !b.isStatic) {
             Matter.Composite.remove(world, b);
        }
    }
    setObjectCount(0);
  };

  const gFactor = currentPlanet.gravity / EARTH_G;

  return (
    <section ref={sectionRef} style={rootStyle}>
      <div style={starsLayer}>
        <div style={starsPattern} />
        <div style={gradientOverlay} />
      </div>

      <div style={hudStyle}>
        <div style={hudLeftStyle}>
          <div style={titleStyle}>GRAVITY LAB</div>
        </div>
        <button type="button" onClick={resetWorld} style={resetButtonStyle}>
          <img
            src="/Restarticon.png"
            alt="Restart"
            style={{ width: 32, height: 32, objectFit: "contain", display: "block", filter: "invert(100%) drop-shadow(0 0 8px rgba(255,255,255,0.8))" }}
          />
        </button>
      </div>

      <div style={{ ...ufoWrapper, transform: `translateX(calc(-50% + ${ufoOffset.x}px)) translateY(${ufoOffset.y}px)` }}>
        <button type="button" onClick={dropTrash} style={ufoButton}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: 142,
                left: "50%",
                transform: "translateX(-50%)",
                width: 260,
                height: 260,
                opacity: isUfoOpen ? 1 : 0,
                transition: "opacity 0.2s ease-out",
                background: "radial-gradient(ellipse at 50% 0%, rgba(56,250,200,0.8) 0%, rgba(34,197,164,0.55) 18%, rgba(34,197,164,0.18) 42%, rgba(15,23,42,0) 80%)",
                filter: "blur(26px)",
                pointerEvents: "none",
                zIndex: 0,
                mixBlendMode: "screen",
              }}
            />
            <img
              src="/alien_spaceship.png"
              alt="Alien UFO"
              style={{ width: 260, height: "auto", display: "block", position: "relative", zIndex: 1, filter: "drop-shadow(0 0 26px rgba(190,242,100,0.9))" }}
            />
          </div>
        </button>
      </div>

      {/* کانواس Matter فقط برای رندر، بدون اینتراکشن */}
      <div ref={sceneRef} style={mainCanvasStyle} />

      {/* لایه کلیک شفاف: هر جای وسط صحنه کلیک = dropTrash */}
      <div
        style={clickOverlayStyle}
        onClick={dropTrash}
      />

      <div style={{ ...groundOverlayBase, background: currentPlanet.color, boxShadow: `0 -24px 80px ${currentPlanet.atmosphereColor}` }} />

      <div style={leftColumnWrapper}>
        <div style={{ ...leftPlanetCircle, boxShadow: "0 0 40px rgba(0,0,0,0.85), 0 0 90px " + currentPlanet.atmosphereColor }}>
          <div style={{ ...leftPlanetTexture, backgroundImage: `url(${currentPlanet.texture})` }} />
          <div style={leftPlanetLight} />
          <div style={leftPlanetShade} />
        </div>
        <div style={leftPlanetName}>{currentPlanet.name}</div>
        <div style={{ ...infoPanelBox, marginTop: 20 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "baseline", justifyContent: "flex-start", marginBottom: 4 }}>
            <div style={{ width: 150, textAlign: "left" }}>
              <span style={{ fontSize: 52, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{currentPlanet.gravity}</span>
            </div>
            <span style={{ fontSize: 16, color: "#e5e7eb", opacity: 0.9, marginTop: 4 }}>m/s²</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: "#cbd5f5", letterSpacing: "0.18em", textTransform: "uppercase" }}>{gFactor.toFixed(3)}G RELATIVE FORCE</div>
          <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: "#e5e7eb", opacity: 0.9 }}>
            OBJECTS: <span style={{ fontVariantNumeric: "tabular-nums" }}>{objectCount}</span>
          </div>
          <p style={{ fontSize: 12, color: "#f9fafb", lineHeight: 1.7, borderTop: "1px solid rgba(148,163,184,0.75)", paddingTop: 10, paddingRight: 4, minHeight: 64, marginTop: 10 }}>{currentPlanet.description}</p>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.9)", overflow: "hidden" }}>
              <div style={{ width: `${Math.min((currentPlanet.gravity / 25) * 100, 100)}%`, height: "100%", background: "linear-gradient(to right, #e5f0ff, #60a5fa, #a855f7)", transition: "width 0.55s cubic-bezier(0.18,0.89,0.32,1.1)" }} />
            </div>
            <span style={{ fontSize: 9, color: "#e5e7eb" }}>GRAVITY INDEX</span>
          </div>
        </div>
      </div>

      <div style={sidePanelWrapper}>
        <div style={sidePanel}>
          <div style={{ padding: "0 18px 10px 4px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.25em", color: "#cbd5f5", marginBottom: 4 }}>Destination</div>
            <div style={{ width: 40, height: 2, background: "linear-gradient(to right, rgba(148,163,184,0.8), rgba(209,213,219,0.9))", borderRadius: 999 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PLANETS.map((planet) => {
              const active = planet.key === currentPlanet.key;
              return (
                <button
                  key={planet.key}
                  type="button"
                  onClick={() => setCurrentPlanet(planet)}
                  style={{ margin: "0 14px", padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 12, borderRadius: 10, border: active ? "1px solid rgba(209,213,219,0.95)" : "1px solid rgba(107,114,128,0.7)", backgroundColor: active ? "rgba(15,23,42,0.96)" : "rgba(15,23,42,0.82)", cursor: "pointer", color: "#e5e7eb", fontSize: 12, textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "999px", position: "relative", overflow: "hidden", boxShadow: active ? "0 0 16px rgba(148,163,184,0.9)" : "0 0 8px rgba(0,0,0,0.75)", border: active ? "2px solid rgba(229,231,235,0.95)" : "2px solid rgba(148,163,184,0.9)", backgroundColor: planet.color, backgroundImage: `radial-gradient(circle at 28% 18%, rgba(255,255,255,0.75), transparent 55%), radial-gradient(circle at 80% 80%, rgba(15,23,42,0.85), transparent 55%), radial-gradient(circle at 50% 60%, rgba(15,23,42,0.4), transparent 60%)`, backgroundBlendMode: "screen" }} />
                    <span style={{ fontWeight: 700, color: active ? "#f9fafb" : "#e5e7eb" }}>{planet.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};


  return Image_22_Gravity_on_Planets;
})();

const PolesEquatorScene = (() => {
// src/images/Image_12_Poles_Equator.tsx

const UI_ACCENT = "#3b82f6";

const TEX = {
  day: earthColorTextureUrl,
  night: earthNightTextureUrl,
  clouds: earthCloudsTextureUrl,
  specular: earthSpecularTextureUrl,
  bump: earthTopographyTextureUrl,
};

const P = {
  R: 0.85, segW: 128, segH: 64,
  camFov: 45, camPos: new THREE.Vector3(0, 0.6, 3),
  minDist: 1.0, maxDist: 9.0,
  rotEarthY: 0.003,
  rotCloudsY: 0.0004,
  sunIntensity: 3.2,
  hemiSky: 0x5a7cff, hemiGround: 0x0b0c1c, hemiIntensity: 0.35,
  bg: "#020410",
  zoomSpeed: 1.8,
} as const;

const VIEW = { shiftX: 0.22, shiftY: 0.00 } as const;

const E_POS = new THREE.Vector3(0, 0, 0);

const LINE_COLORS = { eq: "#fb00ffff", axis: "#6fff00ff" } as const;
const LINES = { eqThickness: 0.006, axisThickness: 0.008 } as const;

const LABELS = {
  fontPx: 84, baseWorldH: 0.22, color: 0xffffff,
  latN: 28, lonN: -20, latS: -28, lonS: 20,
  offsetNorthPole: new THREE.Vector3(0, 1.27, 0),
  offsetSouthPole: new THREE.Vector3(0, -1.27, 0),
  offsetEquator:   new THREE.Vector3(1.05, 0.035, 0),
} as const;

const UI = {
  panelW: 500, panelH: 300,
  dx: -200, dy: 0,
  titleSize: 58, bodySize: 26, bodyLH: 1.6,
  title: `Poles
and Equator`,
  body:
    "The northernmost and southernmost points on Earth are the poles. The imaginary line equidistant from these two points, thought to divide the Earth in half, is called the Equator.",
  useFreePos: false, x: 40, y: 80,
  side: "right" as "right" | "left",
  sideOffset: 40, vAlign: "center" as "top" | "center" | "bottom",
  titleDx: -200, titleDy: 0,
  textBgEnable: true,
  textBgW: 540, textBgH: 440,
  textBgDx: -210, textBgDy: -6,
  textBgRadius: 16, textBgBlur: 8,
  textBgColor: "rgba(0,0,0,0.45)",
  panelBg: "transparent" as const,
  panelBlur: 0 as const,
} as const;

const ZOOM_AREA = { radiusK: 0.42 };

function parseHexWithAlpha(hex: string) {
  const h = hex.trim().toLowerCase();
  if (/^#([0-9a-f]{8})$/.test(h)) {
    const r = parseInt(h.slice(1, 3), 16) / 255;
    const g = parseInt(h.slice(3, 5), 16) / 255;
    const b = parseInt(h.slice(5, 7), 16) / 255;
    const a = parseInt(h.slice(7, 9), 16) / 255;
    return { color: new THREE.Color(r, g, b), opacity: a };
  }
  return { color: new THREE.Color(h as any), opacity: 1 };
}

function Image_07() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const azRef = useRef<HTMLInputElement | null>(null);
  const tagBoxRef = useRef<HTMLSpanElement | null>(null);
  const lineBoxRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const host = hostRef.current!;
    const w = host.clientWidth, h = host.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(P.bg as any, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(P.camFov, w / h, 0.1, 300);
    camera.position.copy(P.camPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = P.minDist;
    controls.maxDistance = P.maxDist;
    controls.zoomSpeed = P.zoomSpeed;
    controls.enableZoom = false;
    controls.target.copy(E_POS);
    controls.update();

    const applyViewOffset = () => {
      const rect = renderer.domElement.getBoundingClientRect();
      const fullW = Math.max(1, Math.floor(rect.width));
      const fullH = Math.max(1, Math.floor(rect.height));
      const offX = Math.floor(VIEW.shiftX * fullW);
      const offY = Math.floor(VIEW.shiftY * fullH);
      if (offX === 0 && offY === 0) camera.clearViewOffset();
      else camera.setViewOffset(fullW, fullH, offX, offY, fullW, fullH);
      camera.updateProjectionMatrix();
    };
    applyViewOffset();

    const worldToScreen = (v: THREE.Vector3) => {
      const p = v.clone().project(camera);
      const r = renderer.domElement.getBoundingClientRect();
      const x = (p.x * 0.5 + 0.5) * r.width + r.left;
      const y = (-p.y * 0.5 + 0.5) * r.height + r.top;
      return { x, y, rect: r };
    };

    const zone = (e: PointerEvent | WheelEvent) => {
      const s = worldToScreen(E_POS);
      const dx = (e.clientX ?? s.x) - s.x;
      const dy = (e.clientY ?? s.y) - s.y;
      const rad = Math.min(s.rect.width, s.rect.height) * ZOOM_AREA.radiusK;
      controls.enableZoom = dx * dx + dy * dy <= rad * rad;
    };
    renderer.domElement.addEventListener("pointermove", zone);
    renderer.domElement.addEventListener("wheel", zone, { passive: true });

    scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiIntensity));
    const sun = new THREE.DirectionalLight(0xffffff, P.sunIntensity);
    sun.target.position.copy(E_POS);
    scene.add(sun, sun.target);

    const setSunAzimuth = (deg: number) => {
      const th = THREE.MathUtils.degToRad(deg), el = THREE.MathUtils.degToRad(20), R = 50;
      sun.position.set(
        E_POS.x + R * Math.cos(th) * Math.cos(el),
        E_POS.y + R * Math.sin(el),
        E_POS.z + R * Math.sin(th) * Math.cos(el)
      );
    };
    setSunAzimuth(45);

    const worldGroup = new THREE.Group(); worldGroup.position.copy(E_POS); scene.add(worldGroup);
    const spinGroup = new THREE.Group(); worldGroup.add(spinGroup);
    const staticLines = new THREE.Group(); staticLines.position.copy(E_POS); scene.add(staticLines);

    { // stars
      const N = 4000, R = 90, pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(R * (0.8 + 0.2 * Math.random()));
        pos.set([v.x, v.y, v.z], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.06, sizeAttenuation: true, color: 0xffffff, depthWrite: false })));
    }

    const loader = new THREE.TextureLoader();
    const loadSRGB = (u: string, cb: (t: THREE.Texture) => void) =>
      loader.load(u, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cb(t); });
    const loadLIN = (u: string, cb: (t: THREE.Texture) => void) =>
      loader.load(u, (t) => { t.colorSpace = THREE.LinearSRGBColorSpace; t.anisotropy = 8; cb(t); });

    const earthMat = new THREE.MeshPhongMaterial({
      color: 0xffffff, shininess: 18, specular: 0x335577, reflectivity: 0.2, dithering: true, emissiveIntensity: 0.28,
    });
    loadSRGB(TEX.day,   (t) => { earthMat.map = t; earthMat.needsUpdate = true; });
    loadSRGB(TEX.night, (t) => { earthMat.emissive = new THREE.Color(0xffffff); earthMat.emissiveMap = t; earthMat.needsUpdate = true; });
    loadLIN (TEX.specular, (t) => { earthMat.specularMap = t; earthMat.needsUpdate = true; });
    loadLIN (TEX.bump,     (t) => { earthMat.bumpMap = t; earthMat.bumpScale = 0.045; earthMat.needsUpdate = true; });

    const earth = new THREE.Mesh(new THREE.SphereGeometry(P.R, P.segW, P.segH), earthMat);
    const cloudsMat = new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffffff });
    loadSRGB(TEX.clouds, (t) => { cloudsMat.map = t; cloudsMat.needsUpdate = true; });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(P.R * 1.012, P.segW, P.segH), cloudsMat);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(P.R * 1.06, 64, 32),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader:`varying vec3 vN; void main(){ float i=pow(clamp(1.0 - vN.z,0.0,1.0),4.0); gl_FragColor=vec4(0.25,0.55,1.0,1.0)*i*0.25; }`,
      })
    );

    // فقط زمین و ابرها می‌چرخند
    spinGroup.add(earth, clouds, atmosphere);

    const eqParsed = parseHexWithAlpha(LINE_COLORS.eq);
    const axisParsed = parseHexWithAlpha(LINE_COLORS.axis);

    const eqMat = new THREE.MeshBasicMaterial({
      color: eqParsed.color, transparent: eqParsed.opacity < 1, opacity: eqParsed.opacity
    });
    const axisMat = new THREE.MeshBasicMaterial({
      color: axisParsed.color, transparent: axisParsed.opacity < 1, opacity: axisParsed.opacity
    });

    const eqRadius = P.R * 1.004;
    const eqCurve = new THREE.EllipseCurve(0, 0, eqRadius, eqRadius, 0, Math.PI * 2, false, 0);
    const eqPts = eqCurve.getPoints(256).map(p => new THREE.Vector3(p.x, 0, p.y));
    const eqPath = new THREE.CatmullRomCurve3(eqPts, true);
    staticLines.add(new THREE.Mesh(
      new THREE.TubeGeometry(eqPath, 256, P.R * LINES.eqThickness, 16, true),
      eqMat
    ));
    staticLines.add(new THREE.Mesh(
      new THREE.CylinderGeometry(P.R * LINES.axisThickness, P.R * LINES.axisThickness, P.R * 2.30, 24),
      axisMat
    ));

    // ───── برچسب‌ها
    type Label = { sprite: THREE.Sprite };
    const makeLabel = (text: string, worldH: number): Label => {
      const W = 1024, H = 256, aspect = W / H;
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);
      ctx.font = `bold ${LABELS.fontPx}px Gotham, Segoe UI, Arial`;
      ctx.fillStyle = "#" + (LABELS.color as number).toString(16).padStart(6, "0");
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 10;
      ctx.fillText(text, 40, H / 2);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
      sp.scale.set(worldH * aspect, worldH, 1);
      return { sprite: sp };
    };
    const placeOnSphere = (latDeg: number, lonDeg: number, r: number) => {
      const lat = THREE.MathUtils.degToRad(latDeg);
      const lon = THREE.MathUtils.degToRad(lonDeg);
      return new THREE.Vector3(
        r * Math.cos(lat) * Math.cos(lon),
        r * Math.sin(lat),
        r * Math.cos(lat) * Math.sin(lon)
      );
    };

    const labels: Label[] = [];

    // قطب‌ها: به صحنه اضافه می‌شوند تا نچرخند
    const north = makeLabel("North Pole Point", LABELS.baseWorldH);
    north.sprite.position.copy(E_POS).add(LABELS.offsetNorthPole.clone().multiplyScalar(P.R));
    scene.add(north.sprite); labels.push(north);

    const south = makeLabel("South Pole Point", LABELS.baseWorldH);
    south.sprite.position.copy(E_POS).add(LABELS.offsetSouthPole.clone().multiplyScalar(P.R));
    scene.add(south.sprite); labels.push(south);

    // استوا: به worldGroup اضافه می‌شود تا نچرخد
    const equatorLbl = makeLabel("Equator", LABELS.baseWorldH * 0.9);
    equatorLbl.sprite.position.copy(E_POS).add(LABELS.offsetEquator.clone().multiplyScalar(P.R));
    worldGroup.add(equatorLbl.sprite); labels.push(equatorLbl);

    // نیمکره‌ها: گروهِ برچسب‌ها زیر worldGroup تا نچرخند
    const labelGroupWorld = new THREE.Group(); worldGroup.add(labelGroupWorld);
    const hemiN = makeLabel("Northen Hemiespher", LABELS.baseWorldH);
    hemiN.sprite.position.copy(placeOnSphere(LABELS.latN, LABELS.lonN, P.R * 1.005));
    labelGroupWorld.add(hemiN.sprite); labels.push(hemiN);
    const hemiS = makeLabel("southern Henispher", LABELS.baseWorldH);
    hemiS.sprite.position.copy(placeOnSphere(LABELS.latS, LABELS.lonS, P.R * 1.005));
    labelGroupWorld.add(hemiS.sprite); labels.push(hemiS);

    if (azRef.current) {
      azRef.current.value = "45";
      azRef.current.oninput = (e: any) => setSunAzimuth(parseFloat(e.target.value));
      (azRef.current as HTMLInputElement).style.accentColor = UI_ACCENT;
    }

    const styleBox = (el: HTMLElement, on: boolean) => {
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.border = `2px solid ${UI_ACCENT}CC`;
      el.style.borderRadius = "4px";
      el.style.display = "inline-block";
      el.style.boxSizing = "border-box";
      el.style.background = on ? UI_ACCENT : "transparent";
      el.style.cursor = "pointer";
      el.setAttribute("data-on", on ? "1" : "0");
    };
    const toggleBox = (el: HTMLElement, fn: (on: boolean) => void) => {
      const on = el.getAttribute("data-on") !== "1";
      styleBox(el, on);
      fn(on);
    };

    if (tagBoxRef.current) {
      styleBox(tagBoxRef.current, true);
      tagBoxRef.current.onclick = () => toggleBox(tagBoxRef.current!, (on) => {
        labels.forEach(({ sprite }) => (sprite.visible = on));
      });
    }
    if (lineBoxRef.current) {
      styleBox(lineBoxRef.current, true);
      lineBoxRef.current.onclick = () => toggleBox(lineBoxRef.current!, (on) => {
        staticLines.visible = on;
      });
    }

    const onResize = () => {
      const nw = host.clientWidth, nh = host.clientHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      applyViewOffset();
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      // فقط کره و ابرها می‌چرخند
      spinGroup.rotation.y += P.rotEarthY;
      clouds.rotation.y += P.rotCloudsY;

      // برچسب‌ها همیشه رو به دوربین
      labels.forEach(({ sprite }) => sprite.quaternion.copy(camera.quaternion));

      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", zone);
      renderer.domElement.removeEventListener("wheel", zone);
      scene.traverse((o: any) => {
        if (o.isMesh) {
          o.geometry?.dispose?.();
          if (Array.isArray(o.material)) o.material.forEach((m: any) => m?.dispose?.());
          else o.material?.dispose?.();
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  const panelPosStyle: CSSProperties = (() => {
    if (UI.useFreePos) return { position: "absolute", left: UI.x, top: UI.y, transform: "none" };
    const base: CSSProperties = { position: "absolute" };
    if (UI.side === "right") Object.assign(base, { right: UI.sideOffset });
    else Object.assign(base, { left: UI.sideOffset });
    if (UI.vAlign === "center") Object.assign(base, { top: "50%", transform: "translateY(-50%)" });
    if (UI.vAlign === "top") Object.assign(base, { top: UI.sideOffset, transform: "none" });
    if (UI.vAlign === "bottom") Object.assign(base, { bottom: UI.sideOffset, transform: "none" });
    return base;
  })();

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: P.bg, userSelect: "none", touchAction: "pan-y", overscrollBehaviorY: "contain" }}>
      <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />

      {/* پنل متن */}
      <div
        style={{
          ...panelPosStyle,
          width: UI.panelW, height: UI.panelH,
          background: UI.panelBg, backdropFilter: `blur(${UI.panelBlur}px)`,
          borderRadius: 16, padding: 24, color: "#fff",
          fontFamily: "Gotham, Inter, system-ui, Segoe UI, Arial",
          display: "grid", alignContent: "start", textAlign: "left",
          position: "absolute", userSelect: "text",
        }}
      >
        <div style={{
          fontSize: UI.titleSize, fontWeight: 800, whiteSpace: "pre-line",
          transform: `translate(${UI.titleDx}px, ${UI.titleDy}px)`,
          position: "relative", zIndex: 2,
        }}>
          {UI.title}
        </div>

        {UI.textBgEnable && (
          <div style={{
            position: "absolute",
            width: UI.textBgW, height: UI.textBgH,
            transform: `translate(${UI.textBgDx}px, ${UI.textBgDy}px)`,
            background: UI.textBgColor,
            backdropFilter: `blur(${UI.textBgBlur}px)`,
            borderRadius: UI.textBgRadius,
            zIndex: 1, pointerEvents: "none",
          }} />
        )}

        <div style={{
          fontSize: UI.bodySize, fontWeight: 400, lineHeight: UI.bodyLH, marginTop: 12,
          whiteSpace: "pre-line", opacity: 0.95,
          transform: `translate(${UI.dx}px, ${UI.dy}px)`,
          position: "relative", zIndex: 2,
        }}>
          {UI.body}
        </div>
      </div>

      {/* کنترل‌ها */}
      <div
        style={{
          position: "absolute", left: "50%", bottom: 24, transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff",
          borderRadius: 12, padding: "10px 14px", display: "grid", gap: 8,
          width: 420, font: "12px/1.4 system-ui,Segoe UI,Arial", zIndex: 10, userSelect: "text",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ textAlign: "center" }}>SUN Light Direction</span>
          <input
            ref={azRef}
            type="range"
            min={0}
            max={360}
            step={1}
            defaultValue={45}
            style={{ accentColor: UI_ACCENT }}
          />
        </label>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span ref={tagBoxRef} />
            <span>Tags</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span ref={lineBoxRef} />
            <span>Lines</span>
          </div>
        </div>
      </div>
    </div>
  );
}

  return Image_07;
})();

type EarthPageItem = {
  id: string;
  title: string;
  subtitle: string;
  Component: () => ReactElement;
};

const EARTH_PAGES: EarthPageItem[] = [
  {
    id: "earth-cuts",
    title: "Earth Cut",
    subtitle: "Inside Earth / radius comparison",
    Component: EarthCutsScene,
  },
  {
    id: "gravity-on-planets",
    title: "Gravity Lab",
    subtitle: "Compare gravity across planets",
    Component: GravityOnPlanetsScene,
  },
  {
    id: "poles-equator",
    title: "Poles & Equator",
    subtitle: "Earth axis, poles, and equator labels",
    Component: PolesEquatorScene,
  },
];

export default function Earth_Pages() {
  const [pageIndex, setPageIndex] = useState(0);
  const currentPage = EARTH_PAGES[pageIndex];
  const CurrentComponent = currentPage.Component;

  const goToPage = (direction: -1 | 1) => {
    setPageIndex((current) => {
      const next = current + direction;
      if (next < 0) return EARTH_PAGES.length - 1;
      if (next >= EARTH_PAGES.length) return 0;
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") goToPage(-1);
      if (event.key === "ArrowRight") goToPage(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section className="earth-pages-experiment">
      <style>{`
        .earth-pages-experiment {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 100vh;
          overflow: hidden;
          background: #020410;
        }

        .earth-pages-stage {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .earth-pages-nav {
          position: absolute;
          left: 50%;
          bottom: 24px;
          z-index: 9999;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(0,0,0,0.38);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-radius: 999px;
          color: #fff;
          font-family: Gotham, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          box-shadow: 0 18px 55px rgba(0,0,0,0.45);
          user-select: none;
        }

        .earth-pages-arrow {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.28);
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
        }

        .earth-pages-arrow:hover {
          transform: scale(1.06);
          background: rgba(255,255,255,0.16);
          border-color: rgba(255,255,255,0.48);
        }

        .earth-pages-info {
          min-width: 220px;
          text-align: center;
        }

        .earth-pages-count {
          font-size: 11px;
          letter-spacing: 0.22em;
          opacity: 0.72;
          margin-bottom: 3px;
        }

        .earth-pages-title {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .earth-pages-subtitle {
          font-size: 11px;
          opacity: 0.72;
          margin-top: 2px;
        }

        .earth-pages-dots {
          position: absolute;
          left: 50%;
          bottom: 86px;
          z-index: 9999;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          pointer-events: auto;
        }

        .earth-pages-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          border: 0;
          padding: 0;
          cursor: pointer;
          background: rgba(255,255,255,0.34);
          transition: width 180ms ease, background 180ms ease;
        }

        .earth-pages-dot.is-active {
          width: 24px;
          background: rgba(255,255,255,0.92);
        }
      `}</style>

      <div className="earth-pages-stage" key={currentPage.id}>
        <CurrentComponent />
      </div>

      <div className="earth-pages-dots" aria-label="Earth page selector">
        {EARTH_PAGES.map((page, index) => (
          <button
            key={page.id}
            type="button"
            className={`earth-pages-dot ${index === pageIndex ? "is-active" : ""}`}
            aria-label={`Open page ${index + 1}: ${page.title}`}
            onClick={() => setPageIndex(index)}
          />
        ))}
      </div>

      <div className="earth-pages-nav">
        <button type="button" className="earth-pages-arrow" onClick={() => goToPage(-1)} aria-label="Previous page">
          ‹
        </button>

        <div className="earth-pages-info">
          <div className="earth-pages-count">{pageIndex + 1} / {EARTH_PAGES.length}</div>
          <div className="earth-pages-title">{currentPage.title}</div>
          <div className="earth-pages-subtitle">{currentPage.subtitle}</div>
        </div>

        <button type="button" className="earth-pages-arrow" onClick={() => goToPage(1)} aria-label="Next page">
          ›
        </button>
      </div>
    </section>
  );
}
