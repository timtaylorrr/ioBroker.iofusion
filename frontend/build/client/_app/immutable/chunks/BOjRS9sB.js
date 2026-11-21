import"./xihTtKlq.js";import{$ as e,Ft as t,Lt as n,Pt as r,Q as i,Ut as a,Wt as o,Y as s,Yt as c,b as l,et as u,f as d,g as f,i as p,mt as m,pt as h,q as g,y as _,yt as v}from"./Bzqs-o_7.js";import{O as y,R as b,Y as x,_ as S,i as C,k as w,w as T,y as E,z as D}from"./OnUsEhrB.js";import{t as O}from"./BVZZLa00.js";var k=s(`<input type="text" class="input" name="filter" autocomplete="off" spellcheck="false"/> <style>.input {
			padding: 0 0.9em;
			border-radius: 0.6em;
			border: 1px solid rgba(255, 255, 255, 0.2);
			background-color: rgba(0, 0, 0, 0.2);
			color: white;
			font-family: inherit;
			font-size: inherit;
			height: 100%;
			min-width: 5.5rem;
		}

		.clear {
			position: relative;
		}

		.clear > button {
			background: none;
			color: rgba(255, 255, 255, 0.9);
			font-size: 1.25rem;
			border: none;
			cursor: pointer;
			position: absolute;
			top: 0;
			right: 0;
			width: 2.8rem;
			height: 100%;
		}

		.clear > input {
			padding-right: 2.5rem;
			border: 1px solid rgba(255, 255, 255, 0.3);
		}

		.clear > input::placeholder {
			color: rgba(255, 255, 255, 0.35);
			opacity: 1;
		}

		/* Phone */
		@media all and (max-width: 768px) {
			.input {
				height: 2.8rem;
				width: 100%;
				max-width: unset;
			}

			.clear {
				max-width: unset;
			}
		}</style>`,1);function A(i,s){o(s,!0);let A=()=>t(w,`$focusSearch`,R),j=()=>t(C,`$modals`,R),M=()=>t(T,`$drawerSearch`,R),N=()=>t(D,`$motion`,R),P=()=>t(E,`$dashboard`,R),F=()=>t(S,`$currentViewId`,R),I=()=>t(b,`$lang`,R),L=()=>t(x,`$states`,R),[R,z]=r(),B;m(()=>{B&&(A()?B.focus():B.blur())}),m(()=>{j().length!==0&&setTimeout(()=>{n(T,void 0)},N())}),m(()=>{n(y,V(P()?.views?.find(e=>e.id===F()),M()?.toLowerCase()))});function V(e,t){if(!t||!e?.sections)return e;let n=(e,n,r,i)=>[e,n,r?.friendly_name,i,I()(i)].map(String).some(e=>e.toLowerCase().includes(t)),r=e=>{if((e.type===`horizontal-stack`||e.type===`vertical-stack`)&&e.sections){let t=e.sections.map(r).filter(Boolean);return t.length?{...e,sections:t}:void 0}if(e.items){let t=e.items.filter(e=>n(e.entity_id,e.name,L()?.[e.entity_id]?.attributes,L()?.[e.entity_id]?.state));return t.length?{...e,items:t}:void 0}},i=e.sections.map(r).filter(Boolean);return{...e,sections:i}}p(()=>{n(T,void 0),n(w,!1)}),O(i,{get condition(){return M()},onclear:()=>{n(T,void 0)},children:(t,r)=>{var i=k(),a=v(i);_(a),d(a,e=>B=e,()=>B),c(2),h(e=>l(a,`placeholder`,e),[()=>I()(`search`)]),e(`click`,a,()=>n(w,!0)),u(`blur`,a,()=>n(w,!1)),f(a,M,e=>n(T,e)),g(t,i)},$$slots:{default:!0}}),a(),z()}i([`click`]);export{A as default};