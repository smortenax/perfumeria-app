/**
 * The orb's shader (WebGL 1, GLSL ES 1.0). One program draws every orb.
 * Domain-warped noise gives a marbled interior in the spirit of the Liquid Orb Editor's
 * Crystal Drop, Frost Flow, Opal and Refractive Gel presets (LerSent001/orb, MIT); written
 * anew for WebGL, so it runs where WebGPU doesn't.
 */

export const ORB_VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

export const ORB_FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uSeed, uDensity, uGlow, uLight, uWeight, uContour, uT1, uT2;
uniform vec3 uC0, uC1, uC2, uBg;

float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5,m=0.;for(int i=0;i<5;i++){s+=a*n(p);m+=a;a*=.5;p=mat2(.8,-.6,.6,.8)*p*2.03;}return s/m;}

void main(){
  vec2 p=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);
  float L=length(p);
  vec3 main=uC0;
  float px=2./uRes.y;
  // contour: a pure molecule is a perfect sphere; naturals wobble, absolutes and resins more
  vec2 dir=p/max(L,1e-4);
  float R=.72*(1.+uContour*.085*(fbm(dir*1.4+uSeed+vec2(uTime*.06,-uTime*.04))-.5)*2.);
  // diffusion: glow spreading into the frame
  float glow=exp(-max(L-R,0.)/(.02+uGlow*.22))*(.06+uGlow*.55);
  vec3 col=uBg+main*glow*.9;
  if(L<R+px){
    vec2 q=p/R; float d=sqrt(max(1.-dot(q,q),0.));
    vec2 s=q*(1.-.22*d)*1.45+uSeed;
    float t=uTime;
    vec2 w1=vec2(fbm(s*1.05+vec2(t*.05,0.)),fbm(s*1.05+vec2(6.8,-t*.045)));
    vec2 s2=s+(w1-.5)*1.6;
    vec2 w2=vec2(fbm(s2*1.3+vec2(1.7,9.2)+t*.03),fbm(s2*1.3+vec2(8.3,2.8)-t*.025));
    vec2 ww=s+(w2-.5)*1.9;
    float body=fbm(ww*1.25+vec2(t*.03,-t*.02));
    float vein=pow(clamp(1.-abs(fbm(ww*2.2+vec2(3.1,-t*.025))*2.-1.),0.,1.),3.);
    float fine=pow(clamp(1.-abs(fbm(ww*4.1+vec2(-2.,t*.02))*2.-1.),0.,1.),5.);
    float v=smoothstep(.28,.72,body);
    // families: each takes its share of the field, blended like a liquid
    vec3 c=uC0;
    c=mix(c,uC1,smoothstep(uT1-.17,uT1+.17,v));
    c=mix(c,uC2,smoothstep(uT2-.17,uT2+.17,v));
    // intensity: weak = milky and translucent, strong = dense colour
    vec3 milk=mix(vec3(.95,.95,.97),c,.38);
    c=mix(milk,c,.3+.7*uDensity);
    c=mix(c,mix(c,vec3(1.),.55),vein*(.35+.25*(1.-uDensity))+fine*.18);
    float alpha=.5+.5*uDensity;
    // volume
    c*=.5+.5*pow(d,.55);
    c=mix(c,c*1.2+.03,d*.25);
    // note: base notes weigh at the bottom, top notes lighten the top
    c*=1.-uWeight*.42*smoothstep(.05,-.95,q.y);
    c=mix(c,c*1.12+.05,(1.-uWeight)*.45*smoothstep(.1,.95,q.y));
    // glass rim
    float fres=pow(1.-d,3.);
    c=mix(c,mix(main,vec3(1.),.5),fres*.4);
    c+=smoothstep(R-6.*px,R-1.5*px,L)*smoothstep(R+px,R-.5*px,L)*.18;
    // luminosity: light from inside
    float core=pow(d,1.8);
    c=mix(c,c*1.45+mix(main,vec3(1.),.6)*.28,uLight*core);
    // small fixed specular, the same for every material
    vec3 nrm=normalize(vec3(q,d)); vec3 Ld=normalize(vec3(-.45,.6,.9));
    c+=pow(max(dot(nrm,Ld),0.),36.)*.07;
    vec3 inside=mix(uBg+main*glow*.9,c,alpha);
    col=mix(col,inside,smoothstep(R+px,R-px,L));
  }
  gl_FragColor=vec4(col,1.);
}`;
