import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { fmtBRL } from '../utils/formatters';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { CategoryIcon } from '../components/CategoryIcon';
import type { FabKind } from '../types';

interface CategoriasScreenProps {
  fabKind?: FabKind;
}

export function CategoriasScreen({ fabKind: _fabKind = 'circle' }: CategoriasScreenProps) {
  const data = [
    {cat:'mercado', spent:920, budget:1200},
    {cat:'restaurante', spent:480, budget:600},
    {cat:'transporte', spent:540, budget:500},
    {cat:'casa', spent:2400, budget:2400},
    {cat:'saude', spent:89, budget:300},
    {cat:'lazer', spent:280, budget:400},
    {cat:'assinaturas', spent:172, budget:200},
    {cat:'trabalho', spent:120, budget:400},
  ];
  return (
    <div className="phone-surface" style={{height:'100%',position:'relative'}} data-screen-label="Categories">
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}><IOSStatusBar/></div>
      <div style={{position:'absolute',top:0,left:0,right:0,bottom:80,overflow:'auto',paddingTop:54,paddingBottom:20}} className="no-scrollbar">
        <div style={{padding:'8px 16px 6px',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <h1 style={{fontSize:24,fontWeight:600,letterSpacing:-0.6,margin:0,color:'var(--text-1)'}}>Categorias</h1>
          <span style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:0.5,textTransform:'uppercase'}}>MAI · 2026</span>
        </div>
        <div style={{padding:'12px 16px 8px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {data.map(d=>{
            const pct = (d.spent/d.budget)*100;
            const over = pct > 100;
            return (
              <div key={d.cat} style={{background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card-sm)',padding:14}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <CategoryIcon cat={d.cat} size={32} radius={8}/>
                  <span className="money" style={{fontSize:10,fontFamily:'var(--font-mono)',color: over?'var(--neg)':'var(--text-3)',letterSpacing:0.5}}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div style={{fontSize:13.5,fontWeight:500,color:'var(--text-1)',marginBottom:6}}>{CATS[d.cat].label}</div>
                <div className="money" style={{fontSize:17,fontWeight:600,letterSpacing:-0.4,color:'var(--text-1)'}}>{fmtBRL(d.spent,{decimals:0})}</div>
                <div className="money" style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',marginTop:1}}>de {fmtBRL(d.budget,{decimals:0})}</div>
                <div style={{marginTop:10,height:4,background:'var(--bg-2)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${Math.min(100,pct)}%`,height:'100%',background: over?'var(--neg)':`var(--cat-${d.cat})`}}/>
                </div>
              </div>
            );
          })}
          {/* + new category */}
          <button style={{
            background:'transparent',border:'1.5px dashed var(--border-2)',borderRadius:'var(--r-card-sm)',
            padding:14,minHeight:130,color:'var(--text-3)',cursor:'pointer',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,
            fontFamily:'var(--font-sans)',fontSize:13,fontWeight:500,
          }}>
            <Icons.plus size={20} color="var(--text-3)"/>
            Nova categoria
          </button>
        </div>
      </div>
    </div>
  );
}
